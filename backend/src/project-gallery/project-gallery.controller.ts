import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, BadRequestException, Req, Res, Query, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { ProjectGalleryService } from './project-gallery.service';
import { CreateProjectGalleryDto } from './dto/create-project-gallery.dto';
import { UpdateProjectGalleryDto } from './dto/update-project-gallery.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectOwnershipGuard } from '../auth/guards/project-ownership.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('api/projects/:projectId/gallery')
export class ProjectGalleryController {
  constructor(private readonly galleryService: ProjectGalleryService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('create-gallery')
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async uploadImage(@UploadedFile() file: Express.Multer.File, @Param('projectId') projectId: string, @Req() req: any) {
    if (!file) throw new BadRequestException('Image file is required');
    
    // Ensure ownership before processing upload
    await this.galleryService.validateProjectOwnership(+projectId, req.user);
    
    const uploadDir = './uploads/gallery';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const isWebp = file.mimetype === 'image/webp' || file.originalname.toLowerCase().endsWith('.webp');
    const ext = isWebp ? '.webp' : '.jpg';
    
    const uniqueSuffix = uuidv4() + ext;
    const filePath = path.join(uploadDir, uniqueSuffix);

    const img = sharp(file.buffer).resize(1920, 1080, { fit: 'inside', withoutEnlargement: true });
    
    if (isWebp) {
      await img.webp({ quality: 80 }).toFile(filePath);
    } else {
      await img.jpeg({ quality: 80 }).toFile(filePath);
    }

    return { imageUrl: `/api/projects/${projectId}/gallery/uploads/${uniqueSuffix}` };
  }

  @Get('uploads/:filename')
  serveImage(@Param('filename') filename: string, @Res() res: any) {
    const filePath = path.resolve('./uploads/gallery', filename);
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('Image not found');
    }
    return res.sendFile(filePath);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('create-gallery')
  create(@Param('projectId') projectId: string, @Body() createDto: CreateProjectGalleryDto, @Req() req: any) {
    return this.galleryService.create(+projectId, createDto, req.user);
  }

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('pagination') pagination?: string,
  ) {
    // Pass undefined for user so it skips ownership validation for public view
    return this.galleryService.findAllPaginated(+projectId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      search: search,
      pagination: pagination === 'false' ? false : true
    }, undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.galleryService.findOne(+id, undefined);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('edit-gallery')
  update(@Param('id') id: string, @Body() updateDto: UpdateProjectGalleryDto, @Req() req: any) {
    return this.galleryService.update(+id, updateDto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('delete-gallery')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.galleryService.remove(+id, req.user);
  }
}

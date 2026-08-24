import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, BadRequestException, Res, Query, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CadProjectsService } from './cad-projects.service';
import { diskStorage, memoryStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('cad-projects')
export class CadProjectsController {
  constructor(private readonly cadProjectsService: CadProjectsService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('create-project')
  @Post()
  create(@Body() createDto: { name: string }, @Req() req: any) {
    return this.cadProjectsService.create(createDto, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('read-project')
  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.cadProjectsService.findAll(pageNumber, limitNumber, search, req.user);
  }

  @Get('public')
  findPublic() {
    return this.cadProjectsService.findPublic();
  }

  @Get('public/:id')
  findPublicOne(@Param('id') id: string) {
    return this.cadProjectsService.findPublicOne(+id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('read-project')
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.cadProjectsService.findOne(+id, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('edit-project')
  @Post(':id/logo')
  @UseInterceptors(FileInterceptor('logo', { storage: memoryStorage() }))
  async uploadLogo(@UploadedFile() file: Express.Multer.File, @Param('id') id: string, @Req() req: any) {
    if (!file) throw new BadRequestException('Logo file is required');
    
    // Ensure ownership before upload
    await this.cadProjectsService.findOne(+id, req.user);

    const uploadDir = './uploads/projects';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const isWebp = file.mimetype === 'image/webp' || file.originalname.toLowerCase().endsWith('.webp');
    const ext = isWebp ? '.webp' : '.png';
    
    const uniqueSuffix = uuidv4() + ext;
    const filePath = path.join(uploadDir, uniqueSuffix);

    const img = sharp(file.buffer).resize(512, 512, { fit: 'inside', withoutEnlargement: true });
    
    if (isWebp) {
      await img.webp({ quality: 90 }).toFile(filePath);
    } else {
      await img.png({ quality: 90 }).toFile(filePath);
    }

    const logoUrl = `/cad-projects/uploads/${uniqueSuffix}`;
    await this.cadProjectsService.update(+id, { logoUrl }, req.user);
    return { logoUrl };
  }

  @Get('uploads/:filename')
  serveLogo(@Param('filename') filename: string, @Res() res: any) {
    const filePath = path.resolve('./uploads/projects', filename);
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('Image not found');
    }
    return res.sendFile(filePath);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('edit-project')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.cadProjectsService.update(+id, data, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('delete-project')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.cadProjectsService.remove(+id, req.user);
  }
}

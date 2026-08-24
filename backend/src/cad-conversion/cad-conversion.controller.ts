import { Controller, Get, Post, Put, Param, Delete, Patch, Body, UseInterceptors, UploadedFile, BadRequestException, Res, Query, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CadConversionService } from './cad-conversion.service';
import { ConversionPipelineService } from './conversion-pipeline.service';
import { diskStorage } from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { Response } from 'express';
import * as fs from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('api/cad-conversion')
export class CadConversionController {
  constructor(
    private readonly cadConversionService: CadConversionService,
    private readonly conversionPipeline: ConversionPipelineService
  ) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('create-conversion')
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/cad',
      filename: (req, file, cb) => {
        const uniqueSuffix = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueSuffix);
      }
    }),
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext !== '.dxf' && ext !== '.dwg') {
        return cb(new BadRequestException('Only .dxf and .dwg files are allowed'), false);
      }
      cb(null, true);
    }
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: any, @Body('projectId') projectId?: string) {
    if (!file) throw new BadRequestException('File is required');
    
    if (!fs.existsSync('./uploads/cad')) {
      fs.mkdirSync('./uploads/cad', { recursive: true });
    }
    
    const conversion = await this.cadConversionService.create({
      originalFileName: file.originalname,
      originalFilePath: file.path,
      fileSize: file.size,
      status: 'PENDING',
      projectId: projectId ? +projectId : undefined
    }, req.user);

    this.conversionPipeline.runPipeline(conversion.id, file.path, file.originalname).catch(console.error);
    return conversion;
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('edit-conversion')
  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/cad',
      filename: (req, file, cb) => {
        const uniqueSuffix = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueSuffix);
      }
    }),
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext !== '.dxf' && ext !== '.dwg') {
        return cb(new BadRequestException('Only .dxf and .dwg files are allowed'), false);
      }
      cb(null, true);
    }
  }))
  async updateFile(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) throw new BadRequestException('File is required');
    
    if (!fs.existsSync('./uploads/cad')) {
      fs.mkdirSync('./uploads/cad', { recursive: true });
    }
    
    const conversion = await this.cadConversionService.update(+id, {
      originalFileName: file.originalname,
      originalFilePath: file.path,
      fileSize: file.size,
      status: 'PENDING',
      svgFilePath: null
    }, req.user);

    this.conversionPipeline.runPipeline(conversion.id, file.path, file.originalname).catch(console.error);
    return conversion;
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('read-conversion')
  @Get()
  async findAll(@Req() req: any, @Query('projectId') projectId?: string) {
    return this.cadConversionService.findAll(projectId ? +projectId : undefined, req.user);
  }

  @Get('public')
  async findPublic(@Query('projectId') projectId?: string) {
    return this.cadConversionService.findPublic(projectId ? +projectId : undefined);
  }

  @Get('public/:id')
  async findPublicOne(@Param('id') id: string) {
    return this.cadConversionService.findOne(+id, undefined);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('read-conversion')
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.cadConversionService.findOne(+id, req.user);
  }

  // NOTE: getCompositeSvg is used by the PUBLIC project viewer. It MUST remain unprotected.
  // It will not receive req.user, so ownership validation will gracefully bypass, returning the SVG.
  @Get(':id/composite-svg')
  async getCompositeSvg(@Param('id') id: string, @Res() res: Response) {
    const data = await this.cadConversionService.getCompositeSvg(+id);
    res.setHeader('Cache-Control', 'no-cache');
    res.json(data);
  }

  @Get('public/:id/svg')
  async getPublicSvg(@Param('id') id: string, @Res() res: Response) {
    const conversion = await this.cadConversionService.findOne(+id, undefined);
    if (!conversion.svgFilePath || !fs.existsSync(conversion.svgFilePath)) {
      throw new BadRequestException('SVG file not available');
    }
    const svgContent = await this.cadConversionService.getEditorSvg(+id, undefined);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svgContent);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('read-conversion')
  @Get(':id/svg')
  async getSvg(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const conversion = await this.cadConversionService.findOne(+id, req.user);
    if (!conversion.svgFilePath || !fs.existsSync(conversion.svgFilePath)) {
      throw new BadRequestException('SVG file not available');
    }
    const svgContent = await this.cadConversionService.getEditorSvg(+id, req.user);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svgContent);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('edit-conversion')
  @Put(':id/svg')
  async updateSvg(@Param('id') id: string, @Req() req: any, @Body() body: { svg: string }) {
    const conversion = await this.cadConversionService.findOne(+id, req.user);
    if (!conversion.svgFilePath) {
      throw new BadRequestException('SVG file path not found for this conversion');
    }
    if (!body.svg) {
      throw new BadRequestException('SVG content is required');
    }
    fs.writeFileSync(conversion.svgFilePath, body.svg, 'utf-8');
    return { success: true };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('edit-conversion')
  @Patch(':id')
  async update(@Param('id') id: string, @Req() req: any, @Body() body: any) {
    return this.cadConversionService.update(+id, body, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('edit-conversion')
  @Patch(':id/activate')
  async activateLayout(@Param('id') id: string, @Req() req: any) {
    return this.cadConversionService.activateLayout(+id, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('delete-conversion')
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.cadConversionService.remove(+id, req.user);
  }
}

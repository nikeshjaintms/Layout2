import { Controller, Get, Post, Body, Patch, Param, Delete, Logger, BadRequestException, Query, UseGuards, Req, ParseArrayPipe } from '@nestjs/common';
import { ProjectPlotService } from './project-plot.service';
import { CreateProjectPlotDto } from './dto/create-project-plot.dto';
import { UpdateProjectPlotDto } from './dto/update-project-plot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectOwnershipGuard } from '../auth/guards/project-ownership.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('api/projects/:projectId/plots')
export class ProjectPlotController {
  private readonly logger = new Logger(ProjectPlotController.name);

  constructor(private readonly projectPlotService: ProjectPlotService) {}

  @Get('/public')
  findPublicAll(
    @Param('projectId') projectId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('pagination') pagination?: string,
    @Query('statusId') statusId?: string,
    @Query('assignment') assignment?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('conversionId') conversionId?: string,
  ) {
    return this.projectPlotService.findAllByProject(+projectId, page, limit, search, pagination, statusId, assignment, sortBy, sortOrder, undefined, conversionId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('create-plot')
  @Post('bulk')
  async createBulk(@Param('projectId') projectId: string, @Body(new ParseArrayPipe({ items: CreateProjectPlotDto, whitelist: true })) createProjectPlotsDto: CreateProjectPlotDto[], @Req() req: any) {
    this.logger.log(`[Bulk Create] Received payload for projectId: ${projectId} with ${createProjectPlotsDto?.length || 0} plots`);
    
    if (!Array.isArray(createProjectPlotsDto) || createProjectPlotsDto.length === 0) {
      throw new BadRequestException({
        success: false,
        message: 'Invalid payload',
        reason: 'Payload must be a non-empty array of plots'
      });
    }

    return this.projectPlotService.createBulk(+projectId, createProjectPlotsDto, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('create-plot')
  @Post()
  create(@Param('projectId') projectId: string, @Body() createProjectPlotDto: CreateProjectPlotDto, @Req() req: any) {
    return this.projectPlotService.create(+projectId, createProjectPlotDto, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('read-plot')
  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('pagination') pagination?: string,
    @Query('statusId') statusId?: string,
    @Query('assignment') assignment?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('conversionId') conversionId?: string,
  ) {
    return this.projectPlotService.findAllByProject(+projectId, page, limit, search, pagination, statusId, assignment, sortBy, sortOrder, req.user, conversionId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('read-plot')
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.projectPlotService.findOne(+id, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('edit-plot')
  @Patch(':id/assignment')
  async updateAssignment(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: { 
      cadRegionId: string | null;
      conversionId?: number | null;
      cadObjectType?: string | null;
      x?: number | null;
      y?: number | null;
      rotation?: number | null;
      scale?: number | null;
      metadata?: any | null;
    }
  ) {
    if (body.cadRegionId !== null && typeof body.cadRegionId !== 'string') {
      throw new BadRequestException('cadRegionId must be a string or null');
    }
    try {
      return await this.projectPlotService.updateAssignment(+id, body, req.user);
    } catch (e) {
      console.error('Update assignment failed:', e);
      throw new BadRequestException(e.message);
    }
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('edit-plot')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectPlotDto: UpdateProjectPlotDto, @Req() req: any) {
    return this.projectPlotService.update(+id, updateProjectPlotDto, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('delete-plot')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.projectPlotService.remove(+id, req.user);
  }
}

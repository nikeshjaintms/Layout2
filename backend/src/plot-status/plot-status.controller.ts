import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, UseGuards, Req } from '@nestjs/common';
import { PlotStatusService } from './plot-status.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectOwnershipGuard } from '../auth/guards/project-ownership.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('api/plot-statuses')
export class PlotStatusController {
  constructor(private readonly plotStatusService: PlotStatusService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('create-status')
  @Post()
  create(@Body() createPlotStatusDto: any, @Req() req: any) {
    return this.plotStatusService.create(createPlotStatusDto, req.user);
  }

  // --- Project Specific Routes ---

  @Get('public/project/:projectId')
  findPublicProjectStatuses(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('pagination') pagination?: string
  ) {
    return this.plotStatusService.findProjectStatusesPaginated(projectId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      search,
      pagination: pagination === 'false' ? false : true
    });
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('read-status')
  @Get('project/:projectId')
  findProjectStatuses(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('pagination') pagination?: string
  ) {
    return this.plotStatusService.findProjectStatusesPaginated(projectId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      search,
      pagination: pagination === 'false' ? false : true
    }, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('create-status')
  @Post('project/:projectId')
  createProjectStatus(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() createPlotStatusDto: any,
    @Req() req: any
  ) {
    return this.plotStatusService.createProjectStatus(projectId, createPlotStatusDto, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('edit-status')
  @Patch('project/:projectId/:id')
  updateProjectStatus(
    @Param('projectId', ParseIntPipe) projectId: number, // not directly needed for update, but good for route structure
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlotStatusDto: any,
    @Req() req: any
  ) {
    return this.plotStatusService.update(id, updatePlotStatusDto, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('delete-status')
  @Delete('project/:projectId/:id')
  deleteProjectStatus(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any
  ) {
    return this.plotStatusService.remove(id, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('read-status')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.plotStatusService.findOne(id, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('edit-status')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updatePlotStatusDto: any, @Req() req: any) {
    return this.plotStatusService.update(id, updatePlotStatusDto, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('delete-status')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.plotStatusService.remove(id, req.user);
  }
}

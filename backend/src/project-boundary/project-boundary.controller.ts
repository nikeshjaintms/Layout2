import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ProjectBoundaryService } from './project-boundary.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectOwnershipGuard } from '../auth/guards/project-ownership.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('api')
export class ProjectBoundaryController {
  constructor(private readonly projectBoundaryService: ProjectBoundaryService) {}

  @Get('projects/public/:projectId/boundaries')
  findPublicByProject(@Param('projectId') projectId: string) {
    return this.projectBoundaryService.findPublicByProject(+projectId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('read-boundary')
  @Get('projects/:projectId/boundaries')
  findAllByProject(@Param('projectId') projectId: string, @Req() req: any) {
    return this.projectBoundaryService.findAllByProject(+projectId, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('create-boundary')
  @Post('projects/:projectId/boundaries')
  create(@Param('projectId') projectId: string, @Body() data: any, @Req() req: any) {
    return this.projectBoundaryService.create(+projectId, data, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('edit-boundary')
  @Patch('boundary/:id')
  update(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.projectBoundaryService.update(+id, data, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('delete-boundary')
  @Delete('boundary/:id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.projectBoundaryService.remove(+id, req.user);
  }
}

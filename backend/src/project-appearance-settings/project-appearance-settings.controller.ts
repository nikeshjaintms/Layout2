import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { ProjectAppearanceSettingsService } from './project-appearance-settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectOwnershipGuard } from '../auth/guards/project-ownership.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('cad-projects/:projectId/appearance-settings')
export class ProjectAppearanceSettingsController {
  constructor(private readonly projectAppearanceSettingsService: ProjectAppearanceSettingsService) {}

  @Get('/public')
  findPublicOne(@Param('projectId') projectId: string) {
    return this.projectAppearanceSettingsService.findOne(+projectId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('edit-appearance')
  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() data: { dimensionColor?: string; plotColor?: string; plotLabelColor?: string },
    @Req() req: any
  ) {
    return this.projectAppearanceSettingsService.create(+projectId, data, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('read-appearance')
  @Get()
  findOne(@Param('projectId') projectId: string, @Req() req: any) {
    return this.projectAppearanceSettingsService.findOne(+projectId, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard, ProjectOwnershipGuard)
  @RequirePermissions('edit-appearance')
  @Patch()
  update(
    @Param('projectId') projectId: string,
    @Body() data: { dimensionColor?: string; plotColor?: string; plotLabelColor?: string },
    @Req() req: any
  ) {
    return this.projectAppearanceSettingsService.update(+projectId, data, req.user);
  }
}

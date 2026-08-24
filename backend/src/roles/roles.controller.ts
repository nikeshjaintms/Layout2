import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('admin/roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('permissions')
  @RequirePermissions('read-role')
  getAllPermissions() {
    return this.rolesService.getAllPermissions();
  }

  @Post()
  @RequirePermissions('create-role')
  create(@Body() body: { name: string; description?: string; permissionIds: number[] }) {
    return this.rolesService.create(body);
  }

  @Get()
  @RequirePermissions('read-role')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('read-role')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('edit-role')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: { name?: string; description?: string; permissionIds?: number[] }) {
    return this.rolesService.update(id, body);
  }

  @Delete(':id')
  @RequirePermissions('delete-role')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.remove(id);
  }
}

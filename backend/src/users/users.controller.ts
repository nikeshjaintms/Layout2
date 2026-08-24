import { Controller, Post, Get, Patch, Delete, Body, Query, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions('create-user')
  async createUser(@Body() body: any) {
    return this.usersService.createAdminUser(body);
  }

  @Get()
  @RequirePermissions('read-user')
  async getUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search: string = ''
  ) {
    return this.usersService.getAdminUsers(parseInt(page, 10), parseInt(limit, 10), search);
  }

  @Get(':id')
  @RequirePermissions('read-user')
  async getUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getAdminUserById(id);
  }

  @Patch(':id')
  @RequirePermissions('edit-user')
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.usersService.updateAdminUser(id, body);
  }

  @Delete(':id')
  @RequirePermissions('delete-user')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteAdminUser(id);
  }
}

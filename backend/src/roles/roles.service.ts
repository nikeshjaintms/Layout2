import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true }
        },
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });
    if (!role) {
      throw new BadRequestException('Role not found');
    }
    return role;
  }

  async create(data: { name: string; description?: string; permissionIds: number[] }) {
    const existing = await this.prisma.role.findUnique({ where: { name: data.name.toUpperCase() } });
    if (existing) {
      throw new ConflictException('Role already exists');
    }

    return this.prisma.role.create({
      data: {
        name: data.name.toUpperCase(),
        description: data.description,
        permissions: {
          create: data.permissionIds.map(id => ({ permissionId: id }))
        }
      },
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });
  }

  async update(id: number, data: { name?: string; description?: string; permissionIds?: number[] }) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new BadRequestException('Role not found');
    }
    
    // Admin role protection
    if (role.name === 'ADMIN' && data.name && data.name !== 'ADMIN') {
      throw new BadRequestException('Cannot rename ADMIN role');
    }

    const updateData: any = {
      description: data.description
    };

    if (data.name) {
      updateData.name = data.name.toUpperCase();
    }

    if (data.permissionIds) {
      // First delete existing
      await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
      // Then re-add
      updateData.permissions = {
        create: data.permissionIds.map(pid => ({ permissionId: pid }))
      };
    }

    return this.prisma.role.update({
      where: { id },
      data: updateData,
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });
  }

  async remove(id: number) {
    const role = await this.prisma.role.findUnique({ 
      where: { id },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
    
    if (!role) {
      throw new BadRequestException('Role not found');
    }
    if (role.name === 'ADMIN' || role.name === 'CLIENT') {
      throw new BadRequestException('Cannot delete default system roles');
    }
    if (role._count.users > 0) {
      throw new BadRequestException('Cannot delete role that has assigned users');
    }

    await this.prisma.role.delete({ where: { id } });
    return { success: true };
  }

  async getAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [
        { subject: 'asc' },
        { action: 'asc' }
      ]
    });
  }
}

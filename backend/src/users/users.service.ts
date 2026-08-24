import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createAdminUser(data: any) {
    const { name, email, password, roleId } = data;
    if (!password || password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long.');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        roleId: roleId ? parseInt(roleId, 10) : null
      }
    });

    const { password: _, ...result } = user;
    return result;
  }

  async getAdminUsers(page: number, limit: number, search: string) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (search) {
      where.email = { contains: search, mode: 'insensitive' };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          role: { select: { id: true, name: true } }
        }
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getAdminUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        role: { select: { id: true, name: true } }
      }
    });
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    return user;
  }

  async updateAdminUser(id: number, data: any) {
    const { name, email, password, roleId } = data;
    const userToUpdate = await this.prisma.user.findUnique({ where: { id } });
    if (!userToUpdate) {
      throw new BadRequestException('User not found.');
    }

    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name;
    }
    if (roleId !== undefined) {
      updateData.roleId = roleId ? parseInt(roleId, 10) : null;
    }
    if (email) {
      const existingUser = await this.prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('User with this email already exists.');
      }
      updateData.email = email;
    }
    if (password) {
      if (password.length < 6) {
        throw new BadRequestException('Password must be at least 6 characters long.');
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    const { password: _, ...result } = user;
    return result;
  }

  async deleteAdminUser(id: number) {
    const userToDelete = await this.prisma.user.findUnique({ where: { id } });
    if (!userToDelete) {
      throw new BadRequestException('User not found.');
    }
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectGalleryDto } from './dto/create-project-gallery.dto';
import { UpdateProjectGalleryDto } from './dto/update-project-gallery.dto';

@Injectable()
export class ProjectGalleryService {
  constructor(private readonly prisma: PrismaService) {}

  async validateProjectOwnership(projectId: number, user: any) {
    if (!user || user.role === 'ADMIN') return true;
    const project = await this.prisma.cadProject.findUnique({ where: { id: projectId }, select: { ownerId: true } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== user.id) throw new ForbiddenException('You do not have permission to access this project');
    return true;
  }

  async validateGalleryOwnership(galleryId: number, user: any) {
    if (!user || user.role === 'ADMIN') return true;
    const item = await this.prisma.projectGallery.findUnique({ where: { id: galleryId }, select: { projectId: true } });
    if (!item) throw new NotFoundException('Gallery item not found');
    return this.validateProjectOwnership(item.projectId, user);
  }

  async create(projectId: number, createDto: CreateProjectGalleryDto, user?: any) {
    if (user) await this.validateProjectOwnership(projectId, user);
    return this.prisma.projectGallery.create({
      data: {
        ...createDto,
        projectId,
      },
    });
  }

  async findAllPaginated(projectId: number, params: { page: number; limit: number; search?: string; pagination: boolean }, user?: any) {
    if (user) await this.validateProjectOwnership(projectId, user);
    const { page, limit, search, pagination } = params;
    
    let where: any = { projectId };
    if (search && search.trim()) {
      where = {
        ...where,
        OR: [
          { title: { contains: search.trim(), mode: 'insensitive' } },
          { description: { contains: search.trim(), mode: 'insensitive' } }
        ]
      };
    }

    if (!pagination) {
      const data = await this.prisma.projectGallery.findMany({ where, orderBy: { createdAt: 'desc' } });
      return { data, total: data.length, page: 1, limit: data.length, totalPages: 1 };
    }

    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.prisma.projectGallery.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.projectGallery.count({ where })
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  async findOne(id: number, user?: any) {
    if (user) await this.validateGalleryOwnership(id, user);
    const item = await this.prisma.projectGallery.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Gallery item not found');
    return item;
  }

  async update(id: number, updateDto: UpdateProjectGalleryDto, user?: any) {
    if (user) await this.validateGalleryOwnership(id, user);
    return this.prisma.projectGallery.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: number, user?: any) {
    if (user) await this.validateGalleryOwnership(id, user);
    return this.prisma.projectGallery.delete({
      where: { id },
    });
  }
}

import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlotStatusService {
  constructor(private prisma: PrismaService) {}

  async validateProjectOwnership(projectId: number, user: any) {
    if (!user || user.role === 'ADMIN') return true;
    const project = await this.prisma.cadProject.findUnique({ where: { id: projectId }, select: { ownerId: true } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== user.id) throw new ForbiddenException('You do not have permission to access this project');
    return true;
  }

  async validatePlotStatusOwnership(statusId: number, user: any) {
    if (!user || user.role === 'ADMIN') return true;
    const status = await this.prisma.plotStatus.findUnique({ where: { id: statusId }, select: { projectId: true } });
    if (!status) throw new NotFoundException('Plot status not found');
    if (status.projectId) {
      return this.validateProjectOwnership(status.projectId, user);
    }
    // If it's a global status with no projectId, only ADMIN should modify, but since user is not ADMIN, deny?
    // Usually PlotStatus is project-specific now.
    throw new ForbiddenException('You do not have permission to access this status');
  }

  async create(createPlotStatusDto: any, user?: any) {
    if (user && createPlotStatusDto.projectId) {
      await this.validateProjectOwnership(createPlotStatusDto.projectId, user);
    }
    return this.prisma.plotStatus.create({ data: createPlotStatusDto });
  }

  async findOne(id: number, user?: any) {
    if (user) await this.validatePlotStatusOwnership(id, user);
    const status = await this.prisma.plotStatus.findUnique({ where: { id } });
    if (!status) throw new NotFoundException('Plot status not found');
    return status;
  }

  async update(id: number, updatePlotStatusDto: any, user?: any) {
    if (user) await this.validatePlotStatusOwnership(id, user);
    return this.prisma.plotStatus.update({
      where: { id },
      data: updatePlotStatusDto,
    });
  }

  async remove(id: number, user?: any) {
    if (user) await this.validatePlotStatusOwnership(id, user);
    const plotsWithStatus = await this.prisma.projectPlot.count({
      where: { statusId: id }
    });
    
    if (plotsWithStatus > 0) {
      throw new BadRequestException(`Cannot delete Plot Status. It is currently assigned to ${plotsWithStatus} plot(s).`);
    }

    return this.prisma.plotStatus.delete({ where: { id } });
  }

  // --- Project Specific Methods ---

  async findProjectStatusesPaginated(projectId: number, params: { page?: number, limit?: number, search?: string, pagination?: boolean }, user?: any) {
    if (user) await this.validateProjectOwnership(projectId, user);
    const { page = 1, limit = 10, search, pagination = true } = params;
    
    const where: any = { projectId };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (pagination === false) {
      const [total, data] = await Promise.all([
        this.prisma.plotStatus.count({ where }),
        this.prisma.plotStatus.findMany({
          where,
          orderBy: { id: 'asc' },
        })
      ]);
      return { data, total };
    }

    const [total, data] = await Promise.all([
      this.prisma.plotStatus.count({ where }),
      this.prisma.plotStatus.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: 'asc' },
      })
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async createProjectStatus(projectId: number, data: any, user?: any) {
    if (user) await this.validateProjectOwnership(projectId, user);
    // Check for duplicate name in same project
    const existing = await this.prisma.plotStatus.findFirst({
      where: { projectId, name: data.name }
    });
    if (existing) {
      throw new BadRequestException(`Status with name '${data.name}' already exists in this project.`);
    }

    return this.prisma.plotStatus.create({
      data: { ...data, projectId },
    });
  }
}

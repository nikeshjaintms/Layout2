import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectBoundaryService {
  constructor(private prisma: PrismaService) {}

  async validateProjectOwnership(projectId: number, user: any) {
    if (!user || user.role === 'ADMIN') return true;
    const project = await this.prisma.cadProject.findUnique({ where: { id: projectId }, select: { ownerId: true } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== user.id) throw new ForbiddenException('You do not have permission to access this project');
    return true;
  }

  async validateBoundaryOwnership(boundaryId: number, user: any) {
    if (!user || user.role === 'ADMIN') return true;
    const boundary = await this.prisma.projectBoundary.findUnique({ where: { id: boundaryId }, select: { projectId: true } });
    if (!boundary) throw new NotFoundException('Boundary not found');
    return this.validateProjectOwnership(boundary.projectId, user);
  }

  async findAllByProject(projectId: number, user: any) {
    await this.validateProjectOwnership(projectId, user);
    return this.prisma.projectBoundary.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findPublicByProject(projectId: number) {
    return this.prisma.projectBoundary.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(projectId: number, data: any, user?: any) {
    if (user) await this.validateProjectOwnership(projectId, user);
    // Basic validation / mapping
    return this.prisma.projectBoundary.create({
      data: {
        projectId,
        name: data.name || 'Boundary',
        area: data.area,
        pointCount: data.pointCount,
        latMin: data.latMin,
        latMax: data.latMax,
        lngMin: data.lngMin,
        lngMax: data.lngMax,
        geoJson: data.geoJson,
      },
    });
  }

  async update(id: number, data: any, user?: any) {
    if (user) await this.validateBoundaryOwnership(id, user);
    const boundary = await this.prisma.projectBoundary.findUnique({ where: { id } });
    if (!boundary) throw new NotFoundException(`Boundary with ID ${id} not found`);

    return this.prisma.projectBoundary.update({
      where: { id },
      data: {
        name: data.name,
        area: data.area,
        pointCount: data.pointCount,
        latMin: data.latMin,
        latMax: data.latMax,
        lngMin: data.lngMin,
        lngMax: data.lngMax,
        geoJson: data.geoJson,
      },
    });
  }

  async remove(id: number, user?: any) {
    if (user) await this.validateBoundaryOwnership(id, user);
    return this.prisma.projectBoundary.delete({
      where: { id },
    });
  }
}

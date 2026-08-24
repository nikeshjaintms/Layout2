import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectOwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Admin has global access
    if (user && user.role === 'ADMIN') {
      return true;
    }

    // Extract projectId from params, query, or body safely
    let projectId = request.params?.projectId || request.query?.projectId || request.body?.projectId;

    if (!projectId) {
      // If no projectId is provided, let it pass (or let controller handle it)
      // Usually, if it's a specific item, we might need to look up its projectId
      // but for routes structured as /api/projects/:projectId/* this works perfectly.
      return true;
    }

    projectId = parseInt(projectId, 10);
    if (isNaN(projectId)) {
      throw new BadRequestException('Invalid project ID');
    }

    const project = await this.prisma.cadProject.findUnique({
      where: { id: projectId },
      select: { ownerId: true }
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerId !== user.id) {
      throw new ForbiddenException('You do not have permission to access this project');
    }

    return true;
  }
}

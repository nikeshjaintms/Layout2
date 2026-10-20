import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CadProjectsService {
  constructor(private prisma: PrismaService) {}

  async validateOwnership(projectId: number, user: any) {
    if (user.role === 'ADMIN') return true;
    
    const project = await this.prisma.cadProject.findUnique({
      where: { id: projectId },
      select: { ownerId: true }
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== user.id) {
      throw new ForbiddenException('You do not have permission to access this project');
    }
    return true;
  }

  async create(data: { name: string }, user: any) {
    const ownerId = user.role === 'CLIENT' ? user.id : null; // ADMINs can leave it null or we can extend to let them choose
    return this.prisma.cadProject.create({
      data: { 
        name: data.name,
        ownerId: ownerId,
        adminActive: true,
        clientActive: true,
        plotStatuses: {
          create: [
            { name: 'Available', fillColor: '#22c55e' },
            { name: 'Sold', fillColor: '#ef4444' },
            { name: 'Reserved', fillColor: '#f97316' },
            { name: 'Booked', fillColor: '#3b82f6' },
            { name: 'Hold', fillColor: '#6b7280' },
          ]
        }
      }
    });
  }

  async findAll(page: number = 1, limit: number = 10, search?: string, user?: any) {
    const skip = (page - 1) * limit;
    
    const where: any = search ? {
      name: {
        contains: search,
      }
    } : {};

    if (user && user.role === 'CLIENT') {
      where.ownerId = user.id;
    }

    const [data, total] = await Promise.all([
      this.prisma.cadProject.findMany({
        where,
        include: {
          _count: {
            select: { conversions: true, plots: true }
          },
          owner: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.cadProject.count({ where })
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findPublic() {
    return this.prisma.cadProject.findMany({
      where: { 
        adminActive: true,
        clientActive: true,
        OR: [
          { ownerId: null },
          {
            owner: {
              role: {
                name: 'ADMIN'
              }
            }
          },
          {
            owner: {
              subscription: {
                status: 'ACTIVE',
                endDate: { gt: new Date() }
              }
            }
          }
        ]
      },
      include: {
        _count: {
          select: { 
            conversions: true,
            plots: true 
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findPublicOne(id: number) {
    const project = await this.prisma.cadProject.findFirst({
      where: { 
        id, 
        adminActive: true, 
        clientActive: true,
        OR: [
          { ownerId: null },
          {
            owner: {
              role: {
                name: 'ADMIN'
              }
            }
          },
          {
            owner: {
              subscription: {
                status: 'ACTIVE',
                endDate: { gt: new Date() }
              }
            }
          }
        ]
      },
      include: {
        conversions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async findOne(id: number, user: any) {
    await this.validateOwnership(id, user);

    const project = await this.prisma.cadProject.findUnique({
      where: { id },
      include: {
        conversions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(id: number, data: any, user: any) {
    await this.validateOwnership(id, user);

    return this.prisma.cadProject.update({
      where: { id },
      data: { 
        ...(data.name && { name: data.name }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        ...(data.mapZoom !== undefined && { mapZoom: data.mapZoom }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.place !== undefined && { place: data.place }),
        ...(data.googleMapsLink !== undefined && { googleMapsLink: data.googleMapsLink }),
        ...(data.labelFontSize !== undefined && { labelFontSize: data.labelFontSize }),
        ...(data.labelFontFamily !== undefined && { labelFontFamily: data.labelFontFamily }),
        ...(data.labelFontColor !== undefined && { labelFontColor: data.labelFontColor }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.info !== undefined && { info: data.info }),
      }
    });
  }

  async remove(id: number, user: any) {
    await this.validateOwnership(id, user);

    return this.prisma.cadProject.delete({
      where: { id }
    });
  }
  async updateStatus(id: number, active: boolean, user: any) {
    const project = await this.prisma.cadProject.findUnique({
      where: { id },
      include: {
        owner: {
          include: { subscription: true }
        }
      }
    });

    if (!project) throw new NotFoundException('Project not found');

    const subscription = project.owner?.subscription;
    const isSubscriptionActive = subscription && subscription.status === 'ACTIVE' && subscription.endDate.getTime() > new Date().getTime();

    if (user.role === 'CLIENT') {
      if (project.ownerId !== user.id) {
        throw new ForbiddenException('You do not have permission to access this project');
      }
      if (active && !project.adminActive) {
        throw new ForbiddenException('Project activation requires admin approval.');
      }
      if (active && !isSubscriptionActive) {
        throw new ForbiddenException('Your subscription is inactive or expired. Please contact admin.');
      }
      return this.prisma.cadProject.update({
        where: { id },
        data: { clientActive: active }
      });
    } else if (user.role === 'ADMIN') {
      if (active && !isSubscriptionActive) {
        if (!subscription) throw new ForbiddenException('Subscription not found.');
        if (subscription.status !== 'ACTIVE') {
          throw new ForbiddenException('Subscription is inactive. Please activate the subscription before activating this project.');
        } else {
          throw new ForbiddenException('Subscription has expired. Please extend the subscription before activating this project.');
        }
      }
      return this.prisma.cadProject.update({
        where: { id },
        data: { adminActive: active, ...(active && { clientActive: true }) }
      });
    }
    throw new ForbiddenException('Invalid role for status update');
  }
}

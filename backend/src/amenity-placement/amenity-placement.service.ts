import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateAmenityPlacementDto } from './dto/create-amenity-placement.dto';
import { UpdateAmenityPlacementDto } from './dto/update-amenity-placement.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AmenityPlacementService {
  constructor(private prisma: PrismaService) {}

  async validateProjectOwnership(projectId: number, user: any) {
    if (!user || user.role === 'ADMIN') return true;
    const project = await this.prisma.cadProject.findUnique({ where: { id: projectId }, select: { ownerId: true } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== user.id) throw new ForbiddenException('You do not have permission to access this project');
    return true;
  }

  async validatePlacementOwnership(placementId: number, user: any) {
    if (!user || user.role === 'ADMIN') return true;
    const placement = await this.prisma.amenityPlacement.findUnique({ where: { id: placementId }, select: { projectId: true } });
    if (!placement) throw new NotFoundException('Placement not found');
    return this.validateProjectOwnership(placement.projectId, user);
  }

  async create(createAmenityPlacementDto: CreateAmenityPlacementDto, user?: any) {
    if (user && createAmenityPlacementDto.projectId) {
      await this.validateProjectOwnership(createAmenityPlacementDto.projectId, user);
    }
    return this.prisma.amenityPlacement.create({
      data: createAmenityPlacementDto,
    });
  }

  async findAll(conversionId?: number, user?: any) {
    // We optionally validate based on conversionId to ensure the user has access.
    // If conversionId is provided, validate its project.
    if (conversionId && user) {
      const conversion = await this.prisma.cadConversion.findUnique({ where: { id: conversionId }, select: { projectId: true } });
      if (conversion && conversion.projectId) {
        await this.validateProjectOwnership(conversion.projectId, user);
      }
    }
    return this.prisma.amenityPlacement.findMany({
      where: conversionId ? { conversionId } : undefined,
      include: { amenity: true },
    });
  }

  async findOne(id: number, user?: any) {
    if (user) await this.validatePlacementOwnership(id, user);
    return this.prisma.amenityPlacement.findUnique({
      where: { id },
      include: { amenity: true },
    });
  }

  async update(id: number, updateAmenityPlacementDto: UpdateAmenityPlacementDto, user?: any) {
    if (user) await this.validatePlacementOwnership(id, user);
    return this.prisma.amenityPlacement.update({
      where: { id },
      data: updateAmenityPlacementDto,
    });
  }

  async remove(id: number, user?: any) {
    if (user) await this.validatePlacementOwnership(id, user);
    return this.prisma.amenityPlacement.delete({
      where: { id },
    });
  }
}

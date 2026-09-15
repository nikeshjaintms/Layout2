import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectPlotDto } from './dto/create-project-plot.dto';
import { UpdateProjectPlotDto } from './dto/update-project-plot.dto';

@Injectable()
export class ProjectPlotService {
  private readonly logger = new Logger(ProjectPlotService.name);

  constructor(private prisma: PrismaService) {}

  async validateProjectOwnership(projectId: number, user: any) {
    if (!user || user.role === 'ADMIN') return true;
    const project = await this.prisma.cadProject.findUnique({ where: { id: projectId }, select: { ownerId: true } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== user.id) throw new ForbiddenException('You do not have permission to access this project');
    return true;
  }

  async validatePlotOwnership(plotId: number, user: any) {
    if (!user || user.role === 'ADMIN') return true;
    const plot = await this.prisma.projectPlot.findUnique({ where: { id: plotId }, select: { projectId: true } });
    if (!plot) throw new NotFoundException('Plot not found');
    return this.validateProjectOwnership(plot.projectId, user);
  }

  async createBulk(projectId: number, createProjectPlotsDto: CreateProjectPlotDto[], user?: any) {
    if (user) await this.validateProjectOwnership(projectId, user);
    this.logger.log(`[createBulk] Starting validation for ${createProjectPlotsDto.length} plots in project ${projectId}`);
    
    // 1. Validation Phase
    const plotNumbers = createProjectPlotsDto.map(p => p.plotNumber).filter(Boolean);
    const existingPlots = await this.prisma.projectPlot.findMany({
      where: {
        projectId,
        plotNumber: { in: plotNumbers }
      }
    });

    if (existingPlots.length > 0) {
      const failedPlots = existingPlots.map(ep => ({
        plotNumber: ep.plotNumber,
        reason: 'Plot number already exists in this project'
      }));
      this.logger.warn(`[createBulk] Validation failed: Found ${failedPlots.length} duplicate plots`);
      throw new BadRequestException({
        success: false,
        message: 'Validation failed for one or more plots.',
        reason: 'Duplicate plot numbers found.',
        failedPlots
      });
    }

    // 2. Transaction Phase
    this.logger.log(`[createBulk] Validation passed. Beginning transaction...`);
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const payload = createProjectPlotsDto.map(dto => ({
          ...dto,
          projectId,
        }));
        
        const created = await tx.projectPlot.createMany({
          data: payload as any,
        });
        this.logger.log(`[createBulk] Transaction Commit: Successfully inserted ${created.count} plots.`);
        return created;
      });
      return { success: true, count: result.count };
    } catch (error) {
      this.logger.error(`[createBulk] Transaction Rollback due to error: ${error.message}`, error.stack);
      throw new BadRequestException({
        success: false,
        message: 'Failed to create bulk plots',
        reason: error.message || 'Unknown database error',
        failedPlots: []
      });
    }
  }

  async create(projectId: number, createProjectPlotDto: CreateProjectPlotDto, user?: any) {
    if (user) await this.validateProjectOwnership(projectId, user);
    return this.prisma.projectPlot.create({
      data: {
        ...createProjectPlotDto,
        projectId,
      } as any,
      include: { status: true },
    });
  }

  async findAllByProject(projectId: number, pageStr?: string, limitStr?: string, search?: string, paginationStr?: string, statusIdStr?: string, assignment?: string, sortBy?: string, sortOrder?: string, user?: any, conversionIdStr?: string) {
    if (user) await this.validateProjectOwnership(projectId, user);
    const pagination = paginationStr === 'false' ? false : true;
    const page = Math.max(1, parseInt(pageStr || '1', 10) || 1);
    const limit = Math.max(1, parseInt(limitStr || '10', 10) || 10);
    const skip = (page - 1) * limit;

    let where: any = { projectId };
    
    if (search && search.trim()) {
      where = {
        ...where,
        plotNumber: { contains: search.trim(), mode: 'insensitive' }
      };
    }
    
    if (statusIdStr) {
      const parsedStatus = parseInt(statusIdStr, 10);
      if (!isNaN(parsedStatus)) {
        where = { ...where, statusId: parsedStatus };
      }
    }

    if (conversionIdStr) {
      const parsedConversionId = parseInt(conversionIdStr, 10);
      if (!isNaN(parsedConversionId)) {
        where = { 
          ...where, 
          OR: [
            { conversionId: parsedConversionId },
            { conversionId: null }
          ]
        };
      }
    }
    
    if (assignment === 'assigned') {
      where = { ...where, cadRegionId: { not: null } };
    } else if (assignment === 'available') {
      where = { ...where, cadRegionId: null };
    }

    let orderBy: any = undefined;
    const isNaturalSort = (!sortBy || sortBy === 'plotNumber');
    
    if (!isNaturalSort) {
      const order = sortOrder === 'desc' ? 'desc' : 'asc';
      if (sortBy === 'status') {
        orderBy = { status: { name: order } };
      } else {
        orderBy = { [sortBy]: order };
      }
    }

    // Fetch all matching records to perform natural sort in JS if needed
    const allData = await this.prisma.projectPlot.findMany({
      where,
      include: { status: true },
      orderBy: orderBy ? orderBy : undefined,
    });
    
    let sortedData = allData;
    if (isNaturalSort) {
      const orderMulti = sortOrder === 'desc' ? -1 : 1;
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
      sortedData.sort((a, b) => {
        return collator.compare(a.plotNumber || '', b.plotNumber || '') * orderMulti;
      });
    }

    const total = sortedData.length;

    if (pagination === false) {
      return { data: sortedData, total };
    }

    const paginatedData = sortedData.slice(skip, skip + limit);

    return {
      data: paginatedData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: number, user?: any) {
    if (user) await this.validatePlotOwnership(id, user);
    const plot = await this.prisma.projectPlot.findUnique({
      where: { id },
      include: { status: true },
    });
    if (!plot) throw new NotFoundException('Plot not found');
    return plot;
  }

  async updateAssignment(id: number, payload: any, user?: any) {
    if (user) await this.validatePlotOwnership(id, user);
    let dataToUpdate: any = {};
    if (payload.cadRegionId === null) {
      // Wiping assignment: clear all placement fields
      dataToUpdate = {
        cadRegionId: null,
        conversionId: null,
        cadObjectType: null,
        x: null,
        y: null,
        rotation: null,
        scale: null,
        metadata: null,
      };
    } else {
      // Assigning: update fields
      dataToUpdate = {
        cadRegionId: payload.cadRegionId,
        conversionId: payload.conversionId,
        cadObjectType: payload.cadObjectType,
        x: payload.x,
        y: payload.y,
        rotation: payload.rotation,
        scale: payload.scale,
        metadata: payload.metadata,
      };
    }
    return this.prisma.projectPlot.update({
      where: { id },
      data: dataToUpdate,
      include: { status: true },
    });
  }

  async update(id: number, updateProjectPlotDto: UpdateProjectPlotDto, user?: any) {
    if (user) await this.validatePlotOwnership(id, user);
    return this.prisma.projectPlot.update({
      where: { id },
      data: updateProjectPlotDto as any,
      include: { status: true },
    });
  }

  async remove(id: number, user?: any) {
    if (user) await this.validatePlotOwnership(id, user);
    return this.prisma.projectPlot.delete({ where: { id } });
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { AmenityPlacementService } from './amenity-placement.service';
import { CreateAmenityPlacementDto } from './dto/create-amenity-placement.dto';
import { UpdateAmenityPlacementDto } from './dto/update-amenity-placement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('api/amenity-placement')
export class AmenityPlacementController {
  constructor(private readonly amenityPlacementService: AmenityPlacementService) {}

  @Get('public')
  findPublic(@Query('conversionId') conversionId?: string) {
    // Pass undefined for user to bypass ownership checks in service if needed,
    // though the service doesn't seem to enforce ownership on read.
    return this.amenityPlacementService.findAll(conversionId ? +conversionId : undefined, undefined);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('edit-conversion')
  @Post()
  create(@Body() createAmenityPlacementDto: CreateAmenityPlacementDto, @Req() req: any) {
    return this.amenityPlacementService.create(createAmenityPlacementDto, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('read-conversion')
  @Get()
  findAll(@Req() req: any, @Query('conversionId') conversionId?: string) {
    return this.amenityPlacementService.findAll(conversionId ? +conversionId : undefined, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('read-conversion')
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.amenityPlacementService.findOne(+id, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('edit-conversion')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAmenityPlacementDto: UpdateAmenityPlacementDto, @Req() req: any) {
    return this.amenityPlacementService.update(+id, updateAmenityPlacementDto, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('edit-conversion')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.amenityPlacementService.remove(+id, req.user);
  }
}

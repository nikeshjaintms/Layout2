import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { CadShapeAppearanceService, ShapeAppearanceUpdate } from './cad-shape-appearance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { UseGuards } from '@nestjs/common';

@Controller('api/cad-conversion/:conversionId/shapes/appearance')
export class CadShapeAppearanceController {
  constructor(private readonly cadShapeAppearanceService: CadShapeAppearanceService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('read-conversion')
  findAll(@Param('conversionId') conversionId: string) {
    return this.cadShapeAppearanceService.findAllByConversion(+conversionId);
  }

  @Patch('bulk')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('edit-conversion')
  updateBulk(
    @Param('conversionId') conversionId: string,
    @Body() body: { updates: ShapeAppearanceUpdate[] }
  ) {
    return this.cadShapeAppearanceService.updateBulk(+conversionId, body.updates);
  }
}

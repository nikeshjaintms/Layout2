import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
// @ts-ignore
import DxfParser from 'dxf-parser';
import { PrismaService } from '../prisma/prisma.service';

const PLOT_LAYER_CANDIDATES = ['PLOT', 'PARCEL', 'BOUNDARY'];

@Injectable()
export class DxfPlotDetectionService {
  private readonly logger = new Logger(DxfPlotDetectionService.name);

  constructor(
    private prisma: PrismaService,
  ) {}

  async detectAndCreatePlots(conversionId: number, dxfFilePath: string, projectId: number) {
    try {
      const dxfText = fs.readFileSync(dxfFilePath, 'utf-8');
      const parser = new DxfParser();
      let dxf;
      try {
        dxf = parser.parseSync(dxfText);
      } catch (e) {
        this.logger.error(`Error parsing DXF for plot detection: ${e.message}`);
        return { count: 0 };
      }

      // Step 1: Add diagnostics
      const entityTypeCounts: Record<string, number> = {};
      const layerNames = new Set<string>();
      for (const e of dxf.entities || []) {
        entityTypeCounts[e.type] = (entityTypeCounts[e.type] || 0) + 1;
        layerNames.add(e.layer || '(none)');
      }
      this.logger.log(`Entity types: ${JSON.stringify(entityTypeCounts)}`);
      this.logger.log(`Layers: ${[...layerNames].join(', ')}`);

      // Also log a couple of raw LWPOLYLINE/POLYLINE entities in full
      const samplePolylines = (dxf.entities || [])
        .filter((e: any) => e.type === 'LWPOLYLINE' || e.type === 'POLYLINE')
        .slice(0, 3);
      this.logger.log(`Sample polyline entities: ${JSON.stringify(samplePolylines, null, 2)}`);

      const closedPolygons = this.extractClosedPolygons(dxf);

      // Fix 1: Validate every point and every polygon before insert
      const validPolygons = closedPolygons.filter((poly: any) => this.isValidPolygon(poly.points));
      const droppedCount = closedPolygons.length - validPolygons.length;

      if (droppedCount > 0) {
        this.logger.warn(`Warning: ${droppedCount} malformed polygon(s) skipped`);
      }

      if (validPolygons.length === 0) {
        return { count: 0 };
      }

      let nextNumber = 1; // always starts at 1 for this conversion

      // Fix Requirement 2: Clear out any existing plots for this conversion before re-inserting
      await this.prisma.projectPlot.deleteMany({
        where: { conversionId }
      });

      // Find the 'Available' PlotStatus ID for this project to set as default STATUS
      const availableStatus = await this.prisma.plotStatus.findFirst({
        where: { projectId, name: 'Available' },
        select: { id: true },
      });

      const plotRecords = validPolygons.map((polygon: any) => ({
        projectId,
        conversionId,
        cadObjectType: 'PLOT',
        metadata: { cadPoints: polygon.points },
        source: 'CAD_DETECTED' as any,
        reviewStatus: 'DRAFT' as any,
        plotNumber: String(nextNumber++),
        ...(availableStatus && { statusId: availableStatus.id }),
      }));

      // Fix 2: Make the insert resilient to a single bad row
      let finalInsertedCount = 0;
      try {
        await this.prisma.projectPlot.createMany({ data: plotRecords });
        finalInsertedCount = plotRecords.length;
      } catch (err) {
        this.logger.warn(`Bulk insert failed (${err.message}), retrying individually`);
        let inserted = 0;
        for (const record of plotRecords) {
          try {
            await this.prisma.projectPlot.create({ data: record });
            inserted++;
          } catch (rowErr) {
            this.logger.error(`Skipped one invalid plot: ${rowErr.message}`);
          }
        }
        this.logger.log(`Inserted ${inserted} of ${plotRecords.length} plots`);
        finalInsertedCount = inserted;
      }

      return { count: finalInsertedCount };
    } catch (err) {
      this.logger.error(`detectAndCreatePlots failed: ${err.message}`);
      return { count: 0 };
    }
  }

  private isValidPoint(p: any): boolean {
    return (
      p &&
      typeof p.x === 'number' && Number.isFinite(p.x) &&
      typeof p.y === 'number' && Number.isFinite(p.y)
    );
  }

  private isValidPolygon(points: any[]): boolean {
    return Array.isArray(points) && points.length >= 3 && points.every((p) => this.isValidPoint(p));
  }

  // Step 2: Make the closed-shape check version-agnostic and geometry-based
  private isClosedPolyline(e: any): boolean {
    if (e.shape === true || e.closed === true) return true;
    if (typeof e.flag === 'number' && (e.flag & 1) === 1) return true;
    if (typeof e.flags === 'number' && (e.flags & 1) === 1) return true;

    const verts = e.vertices || [];
    if (verts.length < 3) return false;
    const first = verts[0];
    const last = verts[verts.length - 1];
    const EPSILON = 0.01;
    return Math.abs(first.x - last.x) < EPSILON && Math.abs(first.y - last.y) < EPSILON;
  }

  private extractClosedPolygons(dxf: any) {
    const entities = dxf.entities || [];

    const allPolylines = entities.filter((e: any) => e.type === 'LWPOLYLINE' || e.type === 'POLYLINE');
    
    // Step 3: Drop the layer allow-list as a hard filter, use it only as a preference
    const EXCLUDED_LAYERS = ['TEXT', 'DIMENSION', 'TITLE-BLOCK', 'GRID', 'DEFPOINTS'];
    
    // Filter out obviously non-plot layers, but don't require PLOT/PARCEL layers
    const viablePolylines = allPolylines.filter((e: any) => {
      const layerName = (e.layer || '').toUpperCase();
      return !EXCLUDED_LAYERS.some(ex => layerName.includes(ex));
    });

    const onPlotLayer = viablePolylines.filter(
      (e: any) => PLOT_LAYER_CANDIDATES.includes((e.layer || '').toUpperCase()),
    );
    const candidates = onPlotLayer.length > 0 ? onPlotLayer : viablePolylines;

    return candidates
      .map((e: any) => ({
        points: (e.vertices || []).map((v: any) => ({ x: v.x, y: v.y })),
        isExplicitlyClosed: this.isClosedPolyline(e)
      }))
      .filter((p: any) => {
        if (p.points.length < 3) return false;
        if (p.isExplicitlyClosed) return true;

        // Geometric closure check
        const dx = p.points[p.points.length - 1].x - p.points[0].x;
        const dy = p.points[p.points.length - 1].y - p.points[0].y;
        const closingGap = Math.sqrt(dx * dx + dy * dy);
        
        let totalLen = 0;
        for (let i = 0; i < p.points.length - 1; i++) {
          const sx = p.points[i + 1].x - p.points[i].x;
          const sy = p.points[i + 1].y - p.points[i].y;
          totalLen += Math.sqrt(sx * sx + sy * sy);
        }
        const avgSeg = p.points.length > 1 ? totalLen / (p.points.length - 1) : 0;
        
        return closingGap <= avgSeg * 2;
      });
  }
}

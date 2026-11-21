import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPackagesService } from './subscription-packages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly packagesService: SubscriptionPackagesService,
  ) {}

  @Get('packages')
  findAllPackages(@Request() req) {
    const activeOnly = req.user?.role !== 'ADMIN';
    return this.packagesService.findAll(activeOnly);
  }

  @Get('packages/:id')
  findPackageById(@Param('id', ParseIntPipe) id: number) {
    return this.packagesService.findById(id);
  }

  @Post('packages')
  createPackage(@Body() body: any, @Request() req) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    return this.packagesService.create(body);
  }

  @Patch('packages/:id')
  updatePackage(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @Request() req
  ) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    return this.packagesService.update(id, body);
  }

  @Delete('packages/:id')
  deletePackage(
    @Param('id', ParseIntPipe) id: number,
    @Request() req
  ) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    return this.packagesService.delete(id);
  }

  @Get()
  findAll(@Request() req) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    return this.subscriptionsService.findAll();
  }

  @Get('users')
  getEligibleUsers(@Request() req) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    return this.subscriptionsService.getEligibleUsers();
  }

  @Get('me')
  findMySubscription(@Request() req) {
    if (req.user.role !== 'CLIENT') throw new ForbiddenException('Client only');
    return this.subscriptionsService.findByUserId(req.user.id);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number, @Request() req) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    return this.subscriptionsService.findById(id);
  }

  @Post('assign-offline')
  assignOffline(
    @Body()
    body: {
      userId: number;
      startDate?: string;
      endDate?: string;
      durationDays?: number;
      durationType?: 'DAYS' | 'MONTHS' | 'YEARS';
      durationValue?: number;
      paymentMethod?: string;
      paymentReference?: string;
      amount?: number | string;
      notes?: string;
      renewalMode?: 'EXTEND' | 'OVERWRITE';
      status?: string;
    },
    @Request() req
  ) {
    return this.subscriptionsService.assignOfflinePayment(body, req.user);
  }

  @Post()
  create(
    @Body()
    body: {
      userId: number;
      startDate?: string;
      endDate?: string;
      durationDays?: number;
      durationType?: 'DAYS' | 'MONTHS' | 'YEARS';
      durationValue?: number;
      status?: string;
      paymentMethod?: string;
      paymentReference?: string;
      amount?: number | string;
      notes?: string;
      renewalMode?: 'EXTEND' | 'OVERWRITE';
    },
    @Request() req
  ) {
    return this.subscriptionsService.create(body, req.user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      startDate?: string;
      endDate?: string;
      status?: string;
    },
    @Request() req
  ) {
    return this.subscriptionsService.update(id, body, req.user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
    @Request() req
  ) {
    return this.subscriptionsService.updateStatus(id, status, req.user);
  }

  @Post(':id/extend')
  extendSubscription(
    @Param('id', ParseIntPipe) id: number,
    @Body('durationType') durationType: 'DAYS' | 'MONTHS' | 'YEARS',
    @Body('durationValue') durationValue: number,
    @Request() req
  ) {
    return this.subscriptionsService.extendSubscription(id, durationType, durationValue, req.user);
  }

  @Delete(':id')
  deleteSubscription(
    @Param('id', ParseIntPipe) id: number,
    @Request() req
  ) {
    return this.subscriptionsService.delete(id, req.user);
  }
}

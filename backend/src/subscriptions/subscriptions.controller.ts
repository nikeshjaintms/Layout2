import { Controller, Get, Patch, Post, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  findAll(@Request() req) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    return this.subscriptionsService.findAll();
  }

  @Get('me')
  findMySubscription(@Request() req) {
    if (req.user.role !== 'CLIENT') throw new ForbiddenException('Client only');
    return this.subscriptionsService.findByUserId(req.user.id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Request() req
  ) {
    return this.subscriptionsService.updateStatus(+id, status, req.user);
  }

  @Post(':id/extend')
  extendSubscription(
    @Param('id') id: string,
    @Body('durationType') durationType: 'DAYS' | 'MONTHS' | 'YEARS',
    @Body('durationValue') durationValue: number,
    @Request() req
  ) {
    return this.subscriptionsService.extendSubscription(+id, durationType, durationValue, req.user);
  }
}

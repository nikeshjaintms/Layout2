import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.subscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      }
    });
  }

  async findByUserId(userId: number) {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId }
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    return sub;
  }

  async updateStatus(id: number, status: string, user: any) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    const validStatuses = ['ACTIVE', 'INACTIVE'];
    if (!validStatuses.includes(status)) throw new BadRequestException('Invalid status');

    const subscription = await this.prisma.subscription.findUnique({ where: { id } });
    if (!subscription) throw new NotFoundException('Subscription not found');
    
    // Check if activating an expired subscription
    if (status === 'ACTIVE' && subscription.endDate.getTime() < new Date().getTime()) {
      throw new ForbiddenException('Subscription has expired. Please extend the subscription before activating.');
    }

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: { status }
    });

    await this.prisma.subscriptionHistory.create({
      data: {
        subscriptionId: id,
        action: status === 'ACTIVE' ? 'ACTIVATED' : 'DEACTIVATED',
        previousStatus: subscription.status,
        newStatus: status,
        changedBy: user.email,
      }
    });

    return updated;
  }

  async extendSubscription(id: number, durationType: 'DAYS' | 'MONTHS' | 'YEARS', durationValue: number, user: any) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    
    const subscription = await this.prisma.subscription.findUnique({ where: { id } });
    if (!subscription) throw new NotFoundException('Subscription not found');

    const newEndDate = new Date(subscription.endDate);
    
    if (durationType === 'DAYS') {
      newEndDate.setDate(newEndDate.getDate() + durationValue);
    } else if (durationType === 'MONTHS') {
      newEndDate.setMonth(newEndDate.getMonth() + durationValue);
    } else if (durationType === 'YEARS') {
      newEndDate.setFullYear(newEndDate.getFullYear() + durationValue);
    }

    const action = durationValue >= 0 ? 'EXTENDED' : 'REDUCED';
    const totalDaysDiff = Math.round((newEndDate.getTime() - subscription.endDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const updated = await this.prisma.subscription.update({
      where: { id },
      data: { 
        endDate: newEndDate,
        durationDays: subscription.durationDays + totalDaysDiff
      }
    });

    await this.prisma.subscriptionHistory.create({
      data: {
        subscriptionId: id,
        action,
        previousEndDate: subscription.endDate,
        newEndDate: newEndDate,
        changedBy: user.email,
      }
    });

    return updated;
  }
}

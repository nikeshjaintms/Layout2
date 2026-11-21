import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
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
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getEligibleUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        subscription: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            durationDays: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: number) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        history: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    return sub;
  }

  async findByUserId(userId: number) {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
      include: {
        history: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    return sub;
  }

  async create(data: {
    userId: number;
    startDate?: string | Date;
    endDate?: string | Date;
    durationDays?: number;
    durationType?: 'DAYS' | 'MONTHS' | 'YEARS';
    durationValue?: number;
    status?: string;
    paymentMethod?: string;
    paymentReference?: string;
    amount?: number | string;
    notes?: string;
    renewalMode?: 'EXTEND' | 'OVERWRITE';
  }, user: any) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    
    // If paymentMethod is specified or if user already has a subscription, handle through offline/smart assignment
    if (data.paymentMethod) {
      return this.assignOfflinePayment(data, user);
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: data.userId },
      include: { subscription: true },
    });
    if (!targetUser) throw new NotFoundException('Target user not found');
    if (targetUser.subscription) {
      return this.assignOfflinePayment({
        ...data,
        paymentMethod: 'Administrative Assignment',
      }, user);
    }

    const start = data.startDate ? new Date(data.startDate) : new Date();
    let end: Date;
    let durationDays: number;

    if (data.endDate) {
      end = new Date(data.endDate);
      durationDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    } else if (data.durationType && data.durationValue) {
      end = new Date(start);
      if (data.durationType === 'DAYS') {
        end.setDate(end.getDate() + data.durationValue);
      } else if (data.durationType === 'MONTHS') {
        end.setMonth(end.getMonth() + data.durationValue);
      } else if (data.durationType === 'YEARS') {
        end.setFullYear(end.getFullYear() + data.durationValue);
      }
      durationDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    } else {
      const days = data.durationDays || 365;
      end = new Date(start);
      end.setDate(end.getDate() + days);
      durationDays = days;
    }

    const status = data.status || 'ACTIVE';

    const newSub = await this.prisma.subscription.create({
      data: {
        userId: data.userId,
        startDate: start,
        endDate: end,
        durationDays,
        status,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    await this.prisma.subscriptionHistory.create({
      data: {
        subscriptionId: newSub.id,
        action: 'CREATED',
        newStartDate: start,
        newEndDate: end,
        newStatus: status,
        changedBy: user.email || 'ADMIN',
      },
    });

    return newSub;
  }

  async assignOfflinePayment(data: {
    userId: number;
    startDate?: string | Date;
    endDate?: string | Date;
    durationDays?: number;
    durationType?: 'DAYS' | 'MONTHS' | 'YEARS';
    durationValue?: number;
    paymentMethod?: string;
    paymentReference?: string;
    amount?: number | string;
    notes?: string;
    renewalMode?: 'EXTEND' | 'OVERWRITE';
    status?: string;
  }, user: any) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Admin only');

    const targetUser = await this.prisma.user.findUnique({
      where: { id: data.userId },
      include: { subscription: true },
    });
    if (!targetUser) throw new NotFoundException('Target user not found');

    const existingSub = targetUser.subscription;
    const isExistingValid = existingSub && new Date(existingSub.endDate).getTime() > Date.now();
    const shouldExtendExisting = isExistingValid && data.renewalMode === 'EXTEND';

    let start: Date;
    let end: Date;
    let durationDays: number;

    if (shouldExtendExisting && existingSub) {
      start = new Date(existingSub.startDate);
      const baseEnd = new Date(existingSub.endDate);
      end = new Date(baseEnd);

      if (data.endDate) {
        end = new Date(data.endDate);
      } else if (data.durationType && data.durationValue) {
        if (data.durationType === 'DAYS') {
          end.setDate(end.getDate() + data.durationValue);
        } else if (data.durationType === 'MONTHS') {
          end.setMonth(end.getMonth() + data.durationValue);
        } else if (data.durationType === 'YEARS') {
          end.setFullYear(end.getFullYear() + data.durationValue);
        }
      } else {
        const days = data.durationDays || 365;
        end.setDate(end.getDate() + days);
      }
      durationDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    } else {
      start = data.startDate ? new Date(data.startDate) : new Date();
      if (data.endDate) {
        end = new Date(data.endDate);
      } else if (data.durationType && data.durationValue) {
        end = new Date(start);
        if (data.durationType === 'DAYS') {
          end.setDate(end.getDate() + data.durationValue);
        } else if (data.durationType === 'MONTHS') {
          end.setMonth(end.getMonth() + data.durationValue);
        } else if (data.durationType === 'YEARS') {
          end.setFullYear(end.getFullYear() + data.durationValue);
        }
      } else {
        const days = data.durationDays || 365;
        end = new Date(start);
        end.setDate(end.getDate() + days);
      }
      durationDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    }

    const status = data.status || 'ACTIVE';

    // Format descriptive audit log for offline payment
    const paymentParts = [
      data.paymentMethod ? `Mode: ${data.paymentMethod}` : 'Offline Payment',
      data.amount ? `Amount: ₹${data.amount}` : null,
      data.paymentReference ? `Ref: ${data.paymentReference}` : null,
      data.notes ? `Note: ${data.notes}` : null,
    ].filter(Boolean);
    const auditString = `${user.email || 'ADMIN'} [Offline: ${paymentParts.join(' | ')}]`;

    if (existingSub) {
      const updated = await this.prisma.subscription.update({
        where: { id: existingSub.id },
        data: {
          startDate: start,
          endDate: end,
          durationDays,
          status,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      await this.prisma.subscriptionHistory.create({
        data: {
          subscriptionId: existingSub.id,
          action: 'OFFLINE_RENEWAL',
          previousStartDate: existingSub.startDate,
          previousEndDate: existingSub.endDate,
          previousStatus: existingSub.status,
          newStartDate: start,
          newEndDate: end,
          newStatus: status,
          changedBy: auditString,
        },
      });

      return updated;
    } else {
      const newSub = await this.prisma.subscription.create({
        data: {
          userId: data.userId,
          startDate: start,
          endDate: end,
          durationDays,
          status,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      await this.prisma.subscriptionHistory.create({
        data: {
          subscriptionId: newSub.id,
          action: 'OFFLINE_PAYMENT',
          newStartDate: start,
          newEndDate: end,
          newStatus: status,
          changedBy: auditString,
        },
      });

      return newSub;
    }
  }

  async update(id: number, data: {
    startDate?: string | Date;
    endDate?: string | Date;
    status?: string;
  }, user: any) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Admin only');

    const subscription = await this.prisma.subscription.findUnique({ where: { id } });
    if (!subscription) throw new NotFoundException('Subscription not found');

    const newStart = data.startDate ? new Date(data.startDate) : subscription.startDate;
    const newEnd = data.endDate ? new Date(data.endDate) : subscription.endDate;
    const newStatus = data.status || subscription.status;

    if (newStatus === 'ACTIVE' && newEnd.getTime() < new Date().getTime()) {
      throw new BadRequestException('Cannot set status to ACTIVE because the end date is in the past. Extend the end date first.');
    }

    const durationDays = Math.max(1, Math.round((newEnd.getTime() - newStart.getTime()) / (1000 * 60 * 60 * 24)));

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: {
        startDate: newStart,
        endDate: newEnd,
        durationDays,
        status: newStatus,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    await this.prisma.subscriptionHistory.create({
      data: {
        subscriptionId: id,
        action: 'UPDATED',
        previousStartDate: subscription.startDate,
        previousEndDate: subscription.endDate,
        previousStatus: subscription.status,
        newStartDate: newStart,
        newEndDate: newEnd,
        newStatus: newStatus,
        changedBy: user.email || 'ADMIN',
      },
    });

    return updated;
  }

  async delete(id: number, user: any) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Admin only');

    const subscription = await this.prisma.subscription.findUnique({ where: { id } });
    if (!subscription) throw new NotFoundException('Subscription not found');

    await this.prisma.subscription.delete({
      where: { id },
    });

    return { message: 'Subscription deleted successfully' };
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
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    await this.prisma.subscriptionHistory.create({
      data: {
        subscriptionId: id,
        action: status === 'ACTIVE' ? 'ACTIVATED' : 'DEACTIVATED',
        previousStatus: subscription.status,
        newStatus: status,
        changedBy: user.email || 'ADMIN',
      },
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
        durationDays: subscription.durationDays + totalDaysDiff,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    await this.prisma.subscriptionHistory.create({
      data: {
        subscriptionId: id,
        action,
        previousEndDate: subscription.endDate,
        newEndDate: newEndDate,
        changedBy: user.email || 'ADMIN',
      },
    });

    return updated;
  }
}

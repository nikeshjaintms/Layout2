import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true }
            }
          }
        }
      }
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.firstLoginAt && user.role?.name === 'CLIENT') {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(now.getDate() + 365);

      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          firstLoginAt: now,
          subscription: {
            create: {
              startDate: now,
              endDate: endDate,
              durationDays: 365,
              status: 'ACTIVE'
            }
          }
        },
        include: { subscription: true }
      });
      user.firstLoginAt = now;

      if (updatedUser.subscription) {
        await this.prisma.subscriptionHistory.create({
          data: {
            subscriptionId: updatedUser.subscription.id,
            action: 'CREATED',
            newStartDate: now,
            newEndDate: endDate,
            newStatus: 'ACTIVE',
            changedBy: 'SYSTEM'
          }
        });
      }
    }

    const { password, ...result } = user;
    
    const payload = { email: user.email, sub: user.id };
    const permissions = user.role?.permissions.map(rp => `${rp.permission.action}-${rp.permission.subject}`) || [];
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        ...result,
        role: user.role?.name || null,
        permissions,
      }
    };
  }

  async changePassword(userId: number, currentPass: string, newPass: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const isMatch = await bcrypt.compare(currentPass, user.password);
    if (!isMatch) throw new UnauthorizedException('Current password is incorrect');

    const hashedNewPassword = await bcrypt.hash(newPass, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    return { success: true };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true }
            }
          }
        }
      }
    });
    if (!user) throw new UnauthorizedException('User not found');
    
    const { password, ...result } = user;
    const permissions = user.role?.permissions.map(rp => `${rp.permission.action}-${rp.permission.subject}`) || [];
    
    return {
      ...result,
      role: user.role?.name || null,
      permissions,
    };
  }
}

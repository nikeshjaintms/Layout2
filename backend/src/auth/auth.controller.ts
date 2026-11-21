import { Controller, Post, Body, HttpCode, HttpStatus, Res, Get, UseGuards, Req, Patch } from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() signInDto: Record<string, any>, @Res({ passthrough: true }) res: Response) {
    const { access_token, user } = await this.authService.login(signInDto.email, signInDto.password);
    
    // Set HttpOnly cookie
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { user };
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const userProfile = await this.authService.getProfile(req.user.id);
    const tokenPayload = {
      email: userProfile.email,
      sub: userProfile.id,
      role: userProfile.role,
      isSubscriptionActive: userProfile.isSubscriptionActive,
    };
    const access_token = this.authService.generateToken(tokenPayload);
    if (access_token) {
      res.cookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }
    return { user: userProfile };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(@Req() req: any, @Body() body: any) {
    return this.authService.changePassword(req.user.id, body.currentPassword, body.newPassword);
  }
}

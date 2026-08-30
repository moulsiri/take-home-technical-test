import { Controller, Post, Body, UseGuards, Request, Res, Req, Get, Query, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import type { Response, Request as ExpressRequest } from 'express';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService
  ) {}

  private setCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.register(dto);
    this.setCookies(res, tokens);
    return tokens;
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.login(dto);
    this.setCookies(res, tokens);
    return tokens;
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Req() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refreshToken'];
    if (!refreshToken) throw new UnauthorizedException('No refresh token found in cookies');

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      const tokens = await this.authService.refreshToken(payload.sub, refreshToken);
      this.setCookies(res, tokens);
      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token signature or expired');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: any) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return this.authService.logout(req.user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @HttpCode(HttpStatus.OK)
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    if (!token) throw new UnauthorizedException('Token is missing');
    return this.authService.verifyEmail(token);
  }
}


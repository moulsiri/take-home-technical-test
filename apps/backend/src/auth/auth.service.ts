import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto, LoginDto } from './dto/auth.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  private mockSendEmail(to: string, subject: string, link: string) {
    console.log(`\n=== MOCK EMAIL ===\nTo: ${to}\nSubject: ${subject}\nLink: ${link}\n==================\n`);
  }

  private async hashData(data: string) {
    return bcrypt.hash(data, 10);
  }

  async generateTokens(userId: string, email: string, role: string, isVerified?: boolean) {
    const payload = { sub: userId, email, role, isVerified };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        payload,
        {
          secret: process.env.JWT_ACCESS_SECRET,
          expiresIn: 900,
        },
      ),
      this.jwtService.signAsync(
        payload,
        {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: 604800,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const tokenHash = await this.hashData(refreshToken);
    
    // Store in DB, invalidate previous ones if needed. For now just create a new active record.
    const expiresInDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  async register(dto: RegisterDto) {
    const userExists = await this.usersService.findByEmail(dto.email);
    if (userExists) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await this.hashData(dto.password);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const newUser = await this.usersService.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      verificationToken,
    });
    
    this.mockSendEmail(dto.email, 'Verify your email', `http://localhost:3000/verify-email?token=${verificationToken}`);

    return this.login({ email: dto.email, password: dto.password });
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.isVerified);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async refreshToken(userId: string, incomingRefreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const activeTokens = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    });

    let tokenMatched = false;
    let matchedTokenId: string | null = null;
    
    for (const token of activeTokens) {
      const isMatch = await bcrypt.compare(incomingRefreshToken, token.tokenHash);
      if (isMatch) {
        tokenMatched = true;
        matchedTokenId = token.id;
        break;
      }
    }

    if (!tokenMatched || !matchedTokenId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Optionally revoke the old token for reuse protection (rolling refresh tokens)
    await this.prisma.refreshToken.update({
      where: { id: matchedTokenId },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.isVerified);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string) {
    // Revoke all refresh tokens for user (or we could pass the specific refresh token to revoke)
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return { message: 'If email exists, a reset link was sent.' };
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: resetToken, resetPasswordExpires: expires }
    });

    this.mockSendEmail(email, 'Reset Password', `http://localhost:3000/reset-password?token=${resetToken}`);
    return { message: 'If email exists, a reset link was sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() }
      }
    });
    if (!user) throw new UnauthorizedException('Invalid or expired reset token');

    const passwordHash = await this.hashData(newPassword);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      }
    });
    return { message: 'Password reset successfully' };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { verificationToken: token }
    });
    if (!user) throw new UnauthorizedException('Invalid verification token');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null }
    });
    return { message: 'Email verified successfully' };
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { expect, describe, it, beforeEach, vi } from 'vitest';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

vi.mock('bcrypt', () => ({
  hash: vi.fn().mockResolvedValue('hash'),
  compare: vi.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  let authService: AuthService;

  const mockUsersService = {
    findByEmail: vi.fn(),
    create: vi.fn(),
  };

  const mockJwtService = {
    signAsync: vi.fn().mockResolvedValue('mockToken'),
  };

  const mockPrismaService = {
    refreshToken: {
      create: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should throw ConflictException if user exists (Test 1)', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce({ id: '1' });
      await expect(
        authService.register({ email: 'test@test.com', name: 'Test', password: 'pass' })
      ).rejects.toThrow(ConflictException);
    });

    it('should create new user and return tokens (Test 2)', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null);
      mockUsersService.findByEmail.mockResolvedValueOnce({ 
        id: '1', email: 'test@test.com', passwordHash: 'hash', role: 'USER' 
      });
      mockUsersService.create.mockResolvedValueOnce({ id: '1' });
      
      const result = await authService.register({ email: 'test@test.com', name: 'Test', password: 'pass' });
      
      expect(mockUsersService.create).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken', 'mockToken');
      expect(result).toHaveProperty('refreshToken', 'mockToken');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException on invalid credentials (Test 3)', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null);
      await expect(
        authService.login({ email: 'wrong@test.com', password: 'pass' })
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});

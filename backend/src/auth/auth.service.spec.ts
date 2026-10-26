import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcryptjs';

describe('AuthService Unit Tests', () => {
  let authService: AuthService;
  let mockPrismaService: any;
  let mockJwtService: any;

  beforeEach(() => {
    mockPrismaService = {
      user: {
        findUnique: vi.fn(),
      },
    };

    mockJwtService = {
      sign: vi.fn().mockReturnValue('mocked-signed-jwt-token'),
    };

    authService = new AuthService(mockPrismaService, mockJwtService);
  });

  describe('login', () => {
    it('should authenticate active user with valid credentials and return access token', async () => {
      const mockHashedPassword = await bcrypt.hash('CorrectPassword123!', 10);
      const mockUser = {
        id: 'usr-uuid-1',
        employeeId: 'EMP-1001',
        fullName: 'M. S. Parthiban',
        email: 'parthiban@msp.com',
        phone: '9840123456',
        passwordHash: mockHashedPassword,
        role: 'ADMIN',
        isActive: true,
        assignedProjects: ['MSP Green Valley'],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.login({
        email: 'PARTHIBAN@MSP.COM ', // test trim & lowercase normalization
        password: 'CorrectPassword123!',
      });

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'parthiban@msp.com' },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'usr-uuid-1',
        email: 'parthiban@msp.com',
        role: 'ADMIN',
      });
      expect(result).toHaveProperty('accessToken', 'mocked-signed-jwt-token');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user.employeeId).toBe('EMP-1001');
    });

    it('should throw UnauthorizedException when email does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'unknown@msp.com',
          password: 'SomePassword123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password does not match hash', async () => {
      const mockHashedPassword = await bcrypt.hash('RealPassword123!', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'usr-uuid-1',
        email: 'parthiban@msp.com',
        passwordHash: mockHashedPassword,
        isActive: true,
      });

      await expect(
        authService.login({
          email: 'parthiban@msp.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject login for deactivated employee accounts with informative message', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'usr-uuid-2',
        email: 'suspended@msp.com',
        passwordHash: 'hash',
        isActive: false,
      });

      await expect(
        authService.login({
          email: 'suspended@msp.com',
          password: 'AnyPassword',
        }),
      ).rejects.toThrow('This employee account has been deactivated');
    });
  });

  describe('getProfile', () => {
    it('should return safe user profile for valid user id', async () => {
      const mockProfile = {
        id: 'usr-uuid-1',
        employeeId: 'EMP-1001',
        fullName: 'M. S. Parthiban',
        email: 'parthiban@msp.com',
        role: 'ADMIN',
        isActive: true,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockProfile);

      const profile = await authService.getProfile('usr-uuid-1');
      expect(profile).toEqual(mockProfile);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'usr-uuid-1' },
        select: expect.objectContaining({ id: true, employeeId: true }),
      });
    });

    it('should throw UnauthorizedException when user profile not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(authService.getProfile('non-existent-id')).rejects.toThrow(UnauthorizedException);
    });
  });
});

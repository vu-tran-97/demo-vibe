import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { BusinessException } from '../common/filters/business.exception';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrisma = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    loginLog: {
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: number) => {
      const config: Record<string, string | number> = {
        JWT_SECRET: 'test-secret-key-min-32-chars-long!!',
        JWT_ACCESS_EXPIRATION: 900,
        JWT_REFRESH_EXPIRATION: 604800,
      };
      return config[key] ?? defaultValue;
    }),
  };

  const mockMailService = {
    sendWelcomeEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendOrderConfirmation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  // ============================================================
  // 1.1 Password Hashing
  // ============================================================
  describe('Password Hashing', () => {
    // TC-U-001
    it('should hash password with bcrypt (12 rounds)', async () => {
      const password = 'P@ssw0rd123';
      const hash = await bcrypt.hash(password, 12);
      expect(hash).toMatch(/^\$2[aby]\$12\$/);
      expect(hash.length).toBe(60);
    });

    // TC-U-002
    it('should verify correct password matches hash', async () => {
      const password = 'P@ssw0rd123';
      const hash = await bcrypt.hash(password, 12);
      const result = await bcrypt.compare(password, hash);
      expect(result).toBe(true);
    });

    // TC-U-003
    it('should reject wrong password against hash', async () => {
      const hash = await bcrypt.hash('P@ssw0rd123', 12);
      const result = await bcrypt.compare('WrongPassword1!', hash);
      expect(result).toBe(false);
    });

    // TC-U-004
    it('should generate different hashes for same password (salt uniqueness)', async () => {
      const password = 'P@ssw0rd123';
      const hash1 = await bcrypt.hash(password, 12);
      const hash2 = await bcrypt.hash(password, 12);
      expect(hash1).not.toBe(hash2);
    });
  });

  // ============================================================
  // 1.2 JWT Generation & Validation
  // ============================================================
  describe('JWT Generation', () => {
    // TC-U-010
    it('should generate access token with correct payload', async () => {
      const userId = '665a1b2c3d4e5f6a7b8c9d0e';
      const email = 'user@example.com';

      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const tokens = await service.generateTokens(userId, email, 'BUYER');

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { sub: userId, email, role: 'BUYER', type: 'access' },
        { expiresIn: 900 },
      );
      expect(tokens.accessToken).toBe('access-token');
    });

    // TC-U-011
    it('should generate refresh token with correct payload', async () => {
      const userId = '665a1b2c3d4e5f6a7b8c9d0e';
      const email = 'user@example.com';

      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const tokens = await service.generateTokens(userId, email, 'BUYER');

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { sub: userId, email, role: 'BUYER', type: 'refresh' },
        { expiresIn: 604800 },
      );
      expect(tokens.refreshToken).toBe('refresh-token');
    });
  });

  // ============================================================
  // 1.6 Refresh Token Hash
  // ============================================================
  describe('Token Hashing', () => {
    // TC-U-050
    it('should produce deterministic SHA-256 hash of refresh token', () => {
      const token = 'some-jwt-token-string';
      const hash1 = service.hashToken(token);
      const hash2 = service.hashToken(token);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);

      const expected = crypto.createHash('sha256').update(token).digest('hex');
      expect(hash1).toBe(expected);
    });
  });

  // ============================================================
  // Signup
  // ============================================================
  describe('signup', () => {
    const signupDto = {
      email: 'newuser@example.com',
      password: 'P@ssw0rd123',
      name: 'New User',
      nickname: 'newuser',
    };
    const ip = '127.0.0.1';

    // TC-I-001 (unit-level)
    it('should create user and return tokens on valid signup', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-id-123',
        userEmail: signupDto.email,
        userNm: signupDto.name,
        userNcnm: signupDto.nickname,
        emailVrfcYn: 'N',
        prflImgUrl: null,
        useRoleCd: 'BUYER',
      });
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.loginLog.create.mockResolvedValue({});

      const result = await service.signup(signupDto, ip);

      expect(result.user.email).toBe(signupDto.email);
      expect(result.user.emailVerified).toBe(false);
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.expiresIn).toBe(900);
    });

    // TC-E-001
    it('should throw EMAIL_ALREADY_EXISTS for duplicate email', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'existing-user' });

      await expect(service.signup(signupDto, ip)).rejects.toThrow(
        BusinessException,
      );
      await expect(service.signup(signupDto, ip)).rejects.toMatchObject({
        errorCode: 'EMAIL_ALREADY_EXISTS',
      });
    });

    // TC-E-002
    it('should throw NICKNAME_ALREADY_EXISTS for duplicate nickname', async () => {
      mockPrisma.user.findFirst
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce({ id: 'existing-user' }); // nickname check

      await expect(service.signup(signupDto, ip)).rejects.toThrow(
        BusinessException,
      );
    });
  });

  // ============================================================
  // Login
  // ============================================================
  describe('login', () => {
    const loginDto = { email: 'user@example.com', password: 'P@ssw0rd123' };
    const ip = '127.0.0.1';

    const mockUser = {
      id: 'user-id-123',
      userEmail: 'user@example.com',
      userPswd: '$2b$12$hashedpasswordhere',
      userNm: 'Test User',
      userNcnm: 'testuser',
      userSttsCd: 'ACTV',
      emailVrfcYn: 'Y',
      prflImgUrl: null,
      useRoleCd: 'BUYER',
      delYn: 'N',
    };

    // TC-E-011
    it('should throw INVALID_CREDENTIALS for nonexistent email', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.login(loginDto, ip)).rejects.toMatchObject({
        errorCode: 'INVALID_CREDENTIALS',
      });
    });

    // TC-E-010
    it('should throw INVALID_CREDENTIALS for wrong password', async () => {
      const hash = await bcrypt.hash('DifferentPassword1!', 12);
      mockPrisma.user.findFirst.mockResolvedValue({ ...mockUser, userPswd: hash });
      mockPrisma.loginLog.create.mockResolvedValue({});

      await expect(service.login(loginDto, ip)).rejects.toMatchObject({
        errorCode: 'INVALID_CREDENTIALS',
      });
    });

    // TC-E-012
    it('should throw ACCOUNT_SUSPENDED for suspended user', async () => {
      const hash = await bcrypt.hash(loginDto.password, 12);
      mockPrisma.user.findFirst.mockResolvedValue({
        ...mockUser,
        userPswd: hash,
        userSttsCd: 'SUSP',
      });
      mockPrisma.loginLog.create.mockResolvedValue({});

      await expect(service.login(loginDto, ip)).rejects.toMatchObject({
        errorCode: 'ACCOUNT_SUSPENDED',
      });
    });

    // TC-E-013
    it('should throw ACCOUNT_INACTIVE for inactive user', async () => {
      const hash = await bcrypt.hash(loginDto.password, 12);
      mockPrisma.user.findFirst.mockResolvedValue({
        ...mockUser,
        userPswd: hash,
        userSttsCd: 'INAC',
      });
      mockPrisma.loginLog.create.mockResolvedValue({});

      await expect(service.login(loginDto, ip)).rejects.toMatchObject({
        errorCode: 'ACCOUNT_INACTIVE',
      });
    });

    // TC-E-014
    it('should throw INVALID_CREDENTIALS for social-only account', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        ...mockUser,
        userPswd: null,
      });

      await expect(service.login(loginDto, ip)).rejects.toMatchObject({
        errorCode: 'INVALID_CREDENTIALS',
      });
    });

    // TC-I-010 (unit-level)
    it('should return tokens on valid login', async () => {
      const hash = await bcrypt.hash(loginDto.password, 12);
      mockPrisma.user.findFirst.mockResolvedValue({
        ...mockUser,
        userPswd: hash,
      });
      mockPrisma.user.update.mockResolvedValue({});
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.loginLog.create.mockResolvedValue({});

      const result = await service.login(loginDto, ip);

      expect(result.user.email).toBe(loginDto.email);
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });
  });

  // ============================================================
  // Logout
  // ============================================================
  describe('logout', () => {
    // TC-I-030 (unit-level)
    it('should revoke refresh token', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await service.logout('some-refresh-token');

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { tknVal: expect.stringMatching(/^[a-f0-9]{64}$/), rvkdYn: 'N' },
        data: { rvkdYn: 'Y' },
      });
    });
  });

  // ============================================================
  // Refresh
  // ============================================================
  describe('refresh', () => {
    const ip = '127.0.0.1';

    // TC-E-020 / TC-E-023
    it('should throw INVALID_REFRESH_TOKEN for invalid JWT', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(
        service.refresh('invalid-token', ip),
      ).rejects.toMatchObject({
        errorCode: 'INVALID_REFRESH_TOKEN',
      });
    });

    // TC-E-022
    it('should detect token reuse and revoke all tokens', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-id',
        email: 'user@example.com',
        type: 'refresh',
      });

      const tokenHash = service.hashToken('revoked-token');
      mockPrisma.refreshToken.findFirst.mockResolvedValue({
        id: 'token-id',
        userId: 'user-id',
        tknVal: tokenHash,
        rvkdYn: 'Y', // Already revoked
      });
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 3 });

      await expect(
        service.refresh('revoked-token', ip),
      ).rejects.toMatchObject({
        errorCode: 'TOKEN_REUSE_DETECTED',
      });

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
        data: { rvkdYn: 'Y' },
      });
    });

    // TC-I-020 (unit-level)
    it('should rotate tokens on valid refresh', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-id',
        email: 'user@example.com',
        type: 'refresh',
      });

      const tokenHash = service.hashToken('valid-token');
      mockPrisma.refreshToken.findFirst.mockResolvedValue({
        id: 'token-id',
        userId: 'user-id',
        tknVal: tokenHash,
        rvkdYn: 'N',
      });
      mockPrisma.refreshToken.update.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        userEmail: 'user@example.com',
        useRoleCd: 'BUYER',
        delYn: 'N',
      });
      mockJwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refresh('valid-token', ip);

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'token-id' },
        data: { rvkdYn: 'Y' },
      });
    });
  });

  // ============================================================
  // Email Verification
  // ============================================================
  describe('verifyEmail', () => {
    // TC-E-031
    it('should throw INVALID_VERIFICATION_TOKEN for unknown token', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyEmail('unknown-token'),
      ).rejects.toMatchObject({
        errorCode: 'INVALID_VERIFICATION_TOKEN',
      });
    });

    // TC-E-032
    it('should throw EMAIL_ALREADY_VERIFIED if already verified', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-id',
        emailVrfcYn: 'Y',
        emlVrfcExprDt: new Date(Date.now() + 86400000),
      });

      await expect(
        service.verifyEmail('some-token'),
      ).rejects.toMatchObject({
        errorCode: 'EMAIL_ALREADY_VERIFIED',
      });
    });

    // TC-E-030
    it('should throw VERIFICATION_TOKEN_EXPIRED for expired token', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-id',
        emailVrfcYn: 'N',
        emlVrfcExprDt: new Date(Date.now() - 1000), // expired
      });

      await expect(
        service.verifyEmail('expired-token'),
      ).rejects.toMatchObject({
        errorCode: 'VERIFICATION_TOKEN_EXPIRED',
      });
    });

    // TC-I-040 (unit-level)
    it('should verify email successfully', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-id',
        emailVrfcYn: 'N',
        emlVrfcExprDt: new Date(Date.now() + 86400000),
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.verifyEmail('valid-token');

      expect(result.message).toBe('Email verified successfully');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: {
          emailVrfcYn: 'Y',
          emlVrfcTkn: null,
          emlVrfcExprDt: null,
        },
      });
    });
  });

  // ============================================================
  // Forgot Password
  // ============================================================
  describe('forgotPassword', () => {
    // TC-E-040
    it('should return success for nonexistent email (no enumeration)', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await service.forgotPassword('nobody@example.com');

      expect(result.message).toContain('If an account');
    });

    // TC-E-041
    it('should return success for social-only user (no leak)', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-id',
        userPswd: null, // social-only
      });

      const result = await service.forgotPassword('social@example.com');

      expect(result.message).toContain('If an account');
    });

    // TC-I-050 (unit-level)
    it('should generate reset token for valid user', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-id',
        userPswd: '$2b$12$hashedpassword',
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.forgotPassword('user@example.com');

      expect(result.message).toContain('If an account');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: {
          pswdRstTkn: expect.stringMatching(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
          ),
          pswdRstExprDt: expect.any(Date),
        },
      });
    });
  });

  // ============================================================
  // Reset Password
  // ============================================================
  describe('resetPassword', () => {
    // TC-E-043
    it('should throw INVALID_RESET_TOKEN for unknown token', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'unknown', newPassword: 'N3wP@ss!' }),
      ).rejects.toMatchObject({
        errorCode: 'INVALID_RESET_TOKEN',
      });
    });

    // TC-E-042
    it('should throw RESET_TOKEN_EXPIRED for expired token', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-id',
        pswdRstExprDt: new Date(Date.now() - 1000),
      });

      await expect(
        service.resetPassword({ token: 'expired', newPassword: 'N3wP@ss!' }),
      ).rejects.toMatchObject({
        errorCode: 'RESET_TOKEN_EXPIRED',
      });
    });

    // TC-I-051 / TC-S-031 (unit-level)
    it('should reset password and revoke all refresh tokens', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-id',
        pswdRstExprDt: new Date(Date.now() + 3600000),
      });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.resetPassword({
        token: 'valid-token',
        newPassword: 'N3wP@ss!',
      });

      expect(result.message).toBe('Password reset successfully');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: {
          userPswd: expect.stringMatching(/^\$2[aby]\$/),
          pswdRstTkn: null,
          pswdRstExprDt: null,
        },
      });
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
        data: { rvkdYn: 'Y' },
      });
    });
  });
});

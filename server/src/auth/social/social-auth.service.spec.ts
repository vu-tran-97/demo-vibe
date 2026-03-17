import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpStatus } from '@nestjs/common';
import { SocialAuthService } from './social-auth.service';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/filters/business.exception';
import { GoogleProvider } from './providers/google.provider';
import { KakaoProvider } from './providers/kakao.provider';
import { NaverProvider } from './providers/naver.provider';

describe('SocialAuthService', () => {
  let service: SocialAuthService;

  const mockPrisma = {
    socialAccount: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
    },
    loginLog: {
      create: jest.fn(),
    },
  };

  const mockAuthService = {
    generateTokens: jest.fn(),
    hashToken: jest.fn().mockReturnValue('hashed-token'),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string | number) => {
      const config: Record<string, string | number> = {
        FRONTEND_URL: 'http://localhost:3000',
        JWT_REFRESH_EXPIRATION: 604800,
      };
      return config[key] ?? defaultValue;
    }),
  };

  const mockGoogleProvider = {
    getAuthorizationUrl: jest.fn().mockReturnValue('https://accounts.google.com/oauth?state=test'),
    exchangeCode: jest.fn(),
    getProfile: jest.fn(),
  };

  const mockKakaoProvider = {
    getAuthorizationUrl: jest.fn().mockReturnValue('https://kauth.kakao.com/oauth?state=test'),
    exchangeCode: jest.fn(),
    getProfile: jest.fn(),
  };

  const mockNaverProvider = {
    getAuthorizationUrl: jest.fn().mockReturnValue('https://nid.naver.com/oauth?state=test'),
    exchangeCode: jest.fn(),
    getProfile: jest.fn(),
  };

  const mockProfile = {
    provider: 'GOOGLE',
    providerId: 'google-123',
    email: 'user@example.com',
    name: 'Test User',
    profileImageUrl: 'https://example.com/photo.jpg',
  };

  const mockUser = {
    id: 'user-id-123',
    userEmail: 'user@example.com',
    userNm: 'Test User',
    userNcnm: 'testuser',
    emailVrfcYn: 'Y',
    prflImgUrl: null,
    useRoleCd: 'BUYER',
    userSttsCd: 'ACTV',
    delYn: 'N',
  };

  const mockTokens = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialAuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: GoogleProvider, useValue: mockGoogleProvider },
        { provide: KakaoProvider, useValue: mockKakaoProvider },
        { provide: NaverProvider, useValue: mockNaverProvider },
      ],
    }).compile();

    service = module.get<SocialAuthService>(SocialAuthService);
    jest.clearAllMocks();
    mockAuthService.hashToken.mockReturnValue('hashed-token');
  });

  // ============================================================
  // State generation
  // ============================================================
  describe('generateState', () => {
    it('should generate a random hex string', () => {
      const state = service.generateState();
      expect(state).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique states on each call', () => {
      const state1 = service.generateState();
      const state2 = service.generateState();
      expect(state1).not.toBe(state2);
    });
  });

  // ============================================================
  // Provider validation
  // ============================================================
  describe('validateProvider', () => {
    it('should accept google', () => {
      expect(service.validateProvider('google')).toBe('google');
    });

    it('should accept kakao', () => {
      expect(service.validateProvider('kakao')).toBe('kakao');
    });

    it('should accept naver', () => {
      expect(service.validateProvider('naver')).toBe('naver');
    });

    it('should reject unsupported provider', () => {
      expect(() => service.validateProvider('facebook')).toThrow(
        BusinessException,
      );
    });

    it('should reject empty provider', () => {
      expect(() => service.validateProvider('')).toThrow(BusinessException);
    });
  });

  // ============================================================
  // getAuthorizationUrl
  // ============================================================
  describe('getAuthorizationUrl', () => {
    it('should return Google authorization URL', () => {
      const url = service.getAuthorizationUrl('google', 'test-state');
      expect(mockGoogleProvider.getAuthorizationUrl).toHaveBeenCalledWith('test-state');
      expect(url).toContain('accounts.google.com');
    });

    it('should return Kakao authorization URL', () => {
      const url = service.getAuthorizationUrl('kakao', 'test-state');
      expect(mockKakaoProvider.getAuthorizationUrl).toHaveBeenCalledWith('test-state');
      expect(url).toContain('kauth.kakao.com');
    });

    it('should return Naver authorization URL', () => {
      const url = service.getAuthorizationUrl('naver', 'test-state');
      expect(mockNaverProvider.getAuthorizationUrl).toHaveBeenCalledWith('test-state');
      expect(url).toContain('nid.naver.com');
    });

    it('should throw for invalid provider', () => {
      expect(() => service.getAuthorizationUrl('facebook', 'state')).toThrow(
        BusinessException,
      );
    });
  });

  // ============================================================
  // handleCallback — Scenario 1: Existing social account found
  // ============================================================
  describe('handleCallback — existing social account', () => {
    beforeEach(() => {
      mockGoogleProvider.exchangeCode.mockResolvedValue({
        accessToken: 'oauth-access-token',
      });
      mockGoogleProvider.getProfile.mockResolvedValue(mockProfile);
      mockAuthService.generateTokens.mockResolvedValue(mockTokens);
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.loginLog.create.mockResolvedValue({});
    });

    it('should login existing social account user', async () => {
      mockPrisma.socialAccount.findFirst.mockResolvedValue({
        id: 'social-id',
        sclPrvdCd: 'GOOGLE',
        sclPrvdUserId: 'google-123',
        user: mockUser,
      });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.socialAccount.update.mockResolvedValue({});

      const result = await service.handleCallback('google', 'auth-code', '127.0.0.1');

      expect(result.accessToken).toBe('test-access-token');
      expect(result.refreshToken).toBe('test-refresh-token');
      expect(result.user.email).toBe('user@example.com');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-123' },
        data: { lstLgnDt: expect.any(Date) },
      });
    });

    it('should reject suspended user with existing social account', async () => {
      mockPrisma.socialAccount.findFirst.mockResolvedValue({
        id: 'social-id',
        user: { ...mockUser, userSttsCd: 'SUSP' },
      });

      await expect(
        service.handleCallback('google', 'auth-code', '127.0.0.1'),
      ).rejects.toMatchObject({ errorCode: 'ACCOUNT_SUSPENDED' });
    });

    it('should reject inactive user with existing social account', async () => {
      mockPrisma.socialAccount.findFirst.mockResolvedValue({
        id: 'social-id',
        user: { ...mockUser, userSttsCd: 'INAC' },
      });

      await expect(
        service.handleCallback('google', 'auth-code', '127.0.0.1'),
      ).rejects.toMatchObject({ errorCode: 'ACCOUNT_INACTIVE' });
    });

    it('should update social account profile on login', async () => {
      mockPrisma.socialAccount.findFirst.mockResolvedValue({
        id: 'social-id',
        sclPrvdCd: 'GOOGLE',
        sclPrvdUserId: 'google-123',
        user: mockUser,
      });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.socialAccount.update.mockResolvedValue({});

      await service.handleCallback('google', 'auth-code', '127.0.0.1');

      expect(mockPrisma.socialAccount.update).toHaveBeenCalledWith({
        where: { id: 'social-id' },
        data: {
          sclEml: 'user@example.com',
          sclPrflImgUrl: 'https://example.com/photo.jpg',
          mdfrId: 'user-id-123',
        },
      });
    });
  });

  // ============================================================
  // handleCallback — Scenario 2: Auto-link by email
  // ============================================================
  describe('handleCallback — auto-link by email', () => {
    beforeEach(() => {
      mockGoogleProvider.exchangeCode.mockResolvedValue({
        accessToken: 'oauth-access-token',
      });
      mockGoogleProvider.getProfile.mockResolvedValue(mockProfile);
      mockAuthService.generateTokens.mockResolvedValue(mockTokens);
      mockPrisma.socialAccount.findFirst.mockResolvedValue(null);
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.loginLog.create.mockResolvedValue({});
    });

    it('should auto-link social account to existing user by email', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.socialAccount.create.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.handleCallback('google', 'auth-code', '127.0.0.1');

      expect(result.user.email).toBe('user@example.com');
      expect(mockPrisma.socialAccount.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-id-123',
          sclPrvdCd: 'GOOGLE',
          sclPrvdUserId: 'google-123',
          sclEml: 'user@example.com',
        }),
      });
    });

    it('should update profile image if user has none', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ ...mockUser, prflImgUrl: null });
      mockPrisma.socialAccount.create.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});

      await service.handleCallback('google', 'auth-code', '127.0.0.1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-123' },
        data: {
          prflImgUrl: 'https://example.com/photo.jpg',
          lstLgnDt: expect.any(Date),
        },
      });
    });

    it('should not overwrite existing profile image', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        ...mockUser,
        prflImgUrl: 'https://existing.com/photo.jpg',
      });
      mockPrisma.socialAccount.create.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});

      await service.handleCallback('google', 'auth-code', '127.0.0.1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-123' },
        data: { lstLgnDt: expect.any(Date) },
      });
    });

    it('should reject suspended user on auto-link', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        ...mockUser,
        userSttsCd: 'SUSP',
      });

      await expect(
        service.handleCallback('google', 'auth-code', '127.0.0.1'),
      ).rejects.toMatchObject({ errorCode: 'ACCOUNT_SUSPENDED' });
    });
  });

  // ============================================================
  // handleCallback — Scenario 3: New user creation
  // ============================================================
  describe('handleCallback — new user creation', () => {
    beforeEach(() => {
      mockGoogleProvider.exchangeCode.mockResolvedValue({
        accessToken: 'oauth-access-token',
      });
      mockGoogleProvider.getProfile.mockResolvedValue(mockProfile);
      mockAuthService.generateTokens.mockResolvedValue(mockTokens);
      mockPrisma.socialAccount.findFirst.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.loginLog.create.mockResolvedValue({});
    });

    it('should create new user and social account', async () => {
      const newUser = {
        ...mockUser,
        id: 'new-user-id',
        prflImgUrl: 'https://example.com/photo.jpg',
      };
      mockPrisma.user.create.mockResolvedValue(newUser);
      mockPrisma.socialAccount.create.mockResolvedValue({});

      const result = await service.handleCallback('google', 'auth-code', '127.0.0.1');

      expect(result.user.email).toBe('user@example.com');
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userEmail: 'user@example.com',
          userNm: 'Test User',
          userPswd: null,
          useRoleCd: 'BUYER',
          userSttsCd: 'ACTV',
          emailVrfcYn: 'Y',
          prflImgUrl: 'https://example.com/photo.jpg',
        }),
      });
      expect(mockPrisma.socialAccount.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'new-user-id',
          sclPrvdCd: 'GOOGLE',
          sclPrvdUserId: 'google-123',
        }),
      });
    });

    it('should set emailVrfcYn to Y for social signup', async () => {
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockPrisma.socialAccount.create.mockResolvedValue({});

      await service.handleCallback('google', 'auth-code', '127.0.0.1');

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          emailVrfcYn: 'Y',
        }),
      });
    });
  });

  // ============================================================
  // handleCallback — Kakao provider
  // ============================================================
  describe('handleCallback — kakao provider', () => {
    it('should handle Kakao login flow', async () => {
      const kakaoProfile = {
        ...mockProfile,
        provider: 'KAKAO',
        providerId: 'kakao-456',
      };
      mockKakaoProvider.exchangeCode.mockResolvedValue({
        accessToken: 'kakao-token',
      });
      mockKakaoProvider.getProfile.mockResolvedValue(kakaoProfile);
      mockAuthService.generateTokens.mockResolvedValue(mockTokens);
      mockPrisma.socialAccount.findFirst.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockPrisma.socialAccount.create.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.loginLog.create.mockResolvedValue({});

      const result = await service.handleCallback('kakao', 'kakao-code', '127.0.0.1');

      expect(result.accessToken).toBe('test-access-token');
      expect(mockKakaoProvider.exchangeCode).toHaveBeenCalledWith('kakao-code');
    });
  });

  // ============================================================
  // handleCallback — Naver provider
  // ============================================================
  describe('handleCallback — naver provider', () => {
    it('should handle Naver login flow', async () => {
      const naverProfile = {
        ...mockProfile,
        provider: 'NAVER',
        providerId: 'naver-789',
      };
      mockNaverProvider.exchangeCode.mockResolvedValue({
        accessToken: 'naver-token',
      });
      mockNaverProvider.getProfile.mockResolvedValue(naverProfile);
      mockAuthService.generateTokens.mockResolvedValue(mockTokens);
      mockPrisma.socialAccount.findFirst.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockPrisma.socialAccount.create.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.loginLog.create.mockResolvedValue({});

      const result = await service.handleCallback('naver', 'naver-code', '127.0.0.1');

      expect(result.accessToken).toBe('test-access-token');
      expect(mockNaverProvider.exchangeCode).toHaveBeenCalledWith('naver-code');
    });
  });

  // ============================================================
  // handleCallback — Login logging
  // ============================================================
  describe('handleCallback — login logging', () => {
    it('should log successful login with provider method code', async () => {
      mockGoogleProvider.exchangeCode.mockResolvedValue({
        accessToken: 'oauth-access-token',
      });
      mockGoogleProvider.getProfile.mockResolvedValue(mockProfile);
      mockAuthService.generateTokens.mockResolvedValue(mockTokens);
      mockPrisma.socialAccount.findFirst.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockPrisma.socialAccount.create.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.loginLog.create.mockResolvedValue({});

      await service.handleCallback('google', 'auth-code', '192.168.1.1', 'Mozilla/5.0');

      expect(mockPrisma.loginLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          lgnMthdCd: 'GOOGLE',
          lgnRsltCd: 'SUCC',
          lgnIpAddr: '192.168.1.1',
          userAgnt: 'Mozilla/5.0',
        }),
      });
    });
  });

  // ============================================================
  // handleCallback — Error handling
  // ============================================================
  describe('handleCallback — error handling', () => {
    it('should propagate token exchange errors', async () => {
      mockGoogleProvider.exchangeCode.mockRejectedValue(
        new BusinessException(
          'OAUTH_TOKEN_EXCHANGE_FAILED',
          'Failed to exchange code',
          HttpStatus.BAD_REQUEST,
        ),
      );

      await expect(
        service.handleCallback('google', 'bad-code', '127.0.0.1'),
      ).rejects.toMatchObject({
        errorCode: 'OAUTH_TOKEN_EXCHANGE_FAILED',
      });
    });

    it('should propagate profile fetch errors', async () => {
      mockGoogleProvider.exchangeCode.mockResolvedValue({
        accessToken: 'oauth-access-token',
      });
      mockGoogleProvider.getProfile.mockRejectedValue(
        new BusinessException(
          'OAUTH_PROFILE_FETCH_FAILED',
          'Failed to fetch profile',
          HttpStatus.BAD_REQUEST,
        ),
      );

      await expect(
        service.handleCallback('google', 'auth-code', '127.0.0.1'),
      ).rejects.toMatchObject({
        errorCode: 'OAUTH_PROFILE_FETCH_FAILED',
      });
    });
  });
});

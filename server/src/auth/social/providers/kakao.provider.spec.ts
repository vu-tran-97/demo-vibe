import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { KakaoProvider } from './kakao.provider';
import { BusinessException } from '../../../common/filters/business.exception';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('KakaoProvider', () => {
  let provider: KakaoProvider;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        KAKAO_CLIENT_ID: 'kakao-test-client-id',
        KAKAO_CLIENT_SECRET: 'kakao-test-secret',
        KAKAO_CALLBACK_URL: 'http://localhost:4000/api/auth/social/kakao/callback',
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KakaoProvider,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    provider = module.get<KakaoProvider>(KakaoProvider);
    jest.clearAllMocks();
  });

  // ============================================================
  // getAuthorizationUrl
  // ============================================================
  describe('getAuthorizationUrl', () => {
    it('should build correct Kakao OAuth URL', () => {
      const url = provider.getAuthorizationUrl('test-state');
      expect(url).toContain('https://kauth.kakao.com/oauth/authorize');
      expect(url).toContain('client_id=kakao-test-client-id');
      expect(url).toContain('state=test-state');
      expect(url).toContain('response_type=code');
    });
  });

  // ============================================================
  // exchangeCode
  // ============================================================
  describe('exchangeCode', () => {
    it('should exchange authorization code for tokens', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'kakao-access-token',
          token_type: 'bearer',
          refresh_token: 'kakao-refresh-token',
          expires_in: 21599,
        }),
      });

      const result = await provider.exchangeCode('auth-code');

      expect(result.accessToken).toBe('kakao-access-token');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://kauth.kakao.com/oauth/token',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should throw on token exchange failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => '{"error":"invalid_grant"}',
      });

      await expect(provider.exchangeCode('bad-code')).rejects.toMatchObject({
        errorCode: 'OAUTH_TOKEN_EXCHANGE_FAILED',
      });
    });
  });

  // ============================================================
  // getProfile
  // ============================================================
  describe('getProfile', () => {
    it('should fetch and parse Kakao user profile', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 12345678,
          kakao_account: {
            email: 'user@kakao.com',
            profile: {
              nickname: 'KakaoUser',
              profile_image_url: 'https://kakao.com/photo.jpg',
            },
          },
        }),
      });

      const profile = await provider.getProfile('access-token');

      expect(profile.provider).toBe('KAKAO');
      expect(profile.providerId).toBe('12345678');
      expect(profile.email).toBe('user@kakao.com');
      expect(profile.name).toBe('KakaoUser');
      expect(profile.profileImageUrl).toBe('https://kakao.com/photo.jpg');
    });

    it('should use email prefix when nickname is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 12345678,
          kakao_account: {
            email: 'user@kakao.com',
            profile: {},
          },
        }),
      });

      const profile = await provider.getProfile('access-token');
      expect(profile.name).toBe('user');
    });

    it('should throw when email is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 12345678,
          kakao_account: {
            profile: { nickname: 'KakaoUser' },
          },
        }),
      });

      await expect(provider.getProfile('access-token')).rejects.toMatchObject({
        errorCode: 'OAUTH_EMAIL_REQUIRED',
      });
    });

    it('should handle missing kakao_account gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 12345678,
        }),
      });

      await expect(provider.getProfile('access-token')).rejects.toMatchObject({
        errorCode: 'OAUTH_EMAIL_REQUIRED',
      });
    });

    it('should throw on profile fetch failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Unauthorized',
      });

      await expect(provider.getProfile('bad-token')).rejects.toMatchObject({
        errorCode: 'OAUTH_PROFILE_FETCH_FAILED',
      });
    });
  });
});

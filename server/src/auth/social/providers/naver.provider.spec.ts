import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NaverProvider } from './naver.provider';
import { BusinessException } from '../../../common/filters/business.exception';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('NaverProvider', () => {
  let provider: NaverProvider;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        NAVER_CLIENT_ID: 'naver-test-client-id',
        NAVER_CLIENT_SECRET: 'naver-test-secret',
        NAVER_CALLBACK_URL: 'http://localhost:4000/api/auth/social/naver/callback',
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NaverProvider,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    provider = module.get<NaverProvider>(NaverProvider);
    jest.clearAllMocks();
  });

  // ============================================================
  // getAuthorizationUrl
  // ============================================================
  describe('getAuthorizationUrl', () => {
    it('should build correct Naver OAuth URL', () => {
      const url = provider.getAuthorizationUrl('test-state');
      expect(url).toContain('https://nid.naver.com/oauth2.0/authorize');
      expect(url).toContain('client_id=naver-test-client-id');
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
          access_token: 'naver-access-token',
          token_type: 'bearer',
          refresh_token: 'naver-refresh-token',
          expires_in: '3600',
        }),
      });

      const result = await provider.exchangeCode('auth-code');

      expect(result.accessToken).toBe('naver-access-token');
      expect(result.expiresIn).toBe(3600);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://nid.naver.com/oauth2.0/token',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should throw on HTTP failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Server Error',
      });

      await expect(provider.exchangeCode('bad-code')).rejects.toMatchObject({
        errorCode: 'OAUTH_TOKEN_EXCHANGE_FAILED',
      });
    });

    it('should throw on Naver error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          error: 'invalid_grant',
          error_description: 'Invalid authorization code',
        }),
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
    it('should fetch and parse Naver user profile', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          resultcode: '00',
          message: 'success',
          response: {
            id: 'naver-user-id',
            email: 'user@naver.com',
            name: 'NaverUser',
            nickname: 'naver_nick',
            profile_image: 'https://naver.com/photo.jpg',
          },
        }),
      });

      const profile = await provider.getProfile('access-token');

      expect(profile.provider).toBe('NAVER');
      expect(profile.providerId).toBe('naver-user-id');
      expect(profile.email).toBe('user@naver.com');
      expect(profile.name).toBe('NaverUser');
      expect(profile.profileImageUrl).toBe('https://naver.com/photo.jpg');
    });

    it('should fallback to nickname when name is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          resultcode: '00',
          message: 'success',
          response: {
            id: 'naver-user-id',
            email: 'user@naver.com',
            nickname: 'naver_nick',
          },
        }),
      });

      const profile = await provider.getProfile('access-token');
      expect(profile.name).toBe('naver_nick');
    });

    it('should fallback to email prefix when name and nickname missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          resultcode: '00',
          message: 'success',
          response: {
            id: 'naver-user-id',
            email: 'user@naver.com',
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
          resultcode: '00',
          message: 'success',
          response: {
            id: 'naver-user-id',
            name: 'NaverUser',
          },
        }),
      });

      await expect(provider.getProfile('access-token')).rejects.toMatchObject({
        errorCode: 'OAUTH_EMAIL_REQUIRED',
      });
    });

    it('should throw on non-00 result code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          resultcode: '024',
          message: 'Authentication failed',
        }),
      });

      await expect(provider.getProfile('access-token')).rejects.toMatchObject({
        errorCode: 'OAUTH_PROFILE_FETCH_FAILED',
      });
    });

    it('should throw on HTTP failure', async () => {
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

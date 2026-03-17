import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GoogleProvider } from './google.provider';
import { BusinessException } from '../../../common/filters/business.exception';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('GoogleProvider', () => {
  let provider: GoogleProvider;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        GOOGLE_CLIENT_ID: 'google-test-client-id',
        GOOGLE_CLIENT_SECRET: 'google-test-secret',
        GOOGLE_CALLBACK_URL: 'http://localhost:4000/api/auth/social/google/callback',
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleProvider,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    provider = module.get<GoogleProvider>(GoogleProvider);
    jest.clearAllMocks();
  });

  // ============================================================
  // getAuthorizationUrl
  // ============================================================
  describe('getAuthorizationUrl', () => {
    it('should build correct Google OAuth URL', () => {
      const url = provider.getAuthorizationUrl('test-state');
      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain('client_id=google-test-client-id');
      expect(url).toContain('state=test-state');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=openid+email+profile');
      expect(url).toContain('redirect_uri=');
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
          access_token: 'google-access-token',
          token_type: 'Bearer',
          refresh_token: 'google-refresh-token',
          expires_in: 3600,
        }),
      });

      const result = await provider.exchangeCode('auth-code-123');

      expect(result.accessToken).toBe('google-access-token');
      expect(result.tokenType).toBe('Bearer');
      expect(result.refreshToken).toBe('google-refresh-token');
      expect(result.expiresIn).toBe(3600);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      );
    });

    it('should throw on token exchange failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        text: async () => '{"error":"invalid_grant"}',
      });

      await expect(provider.exchangeCode('bad-code')).rejects.toThrow(
        BusinessException,
      );

      await expect(provider.exchangeCode('bad-code')).rejects.toMatchObject({
        errorCode: 'OAUTH_TOKEN_EXCHANGE_FAILED',
      });
    });
  });

  // ============================================================
  // getProfile
  // ============================================================
  describe('getProfile', () => {
    it('should fetch and parse Google user profile', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: '123456789',
          email: 'user@gmail.com',
          name: 'Test User',
          picture: 'https://lh3.googleusercontent.com/photo.jpg',
        }),
      });

      const profile = await provider.getProfile('access-token');

      expect(profile.provider).toBe('GOOGLE');
      expect(profile.providerId).toBe('123456789');
      expect(profile.email).toBe('user@gmail.com');
      expect(profile.name).toBe('Test User');
      expect(profile.profileImageUrl).toBe('https://lh3.googleusercontent.com/photo.jpg');
    });

    it('should use email prefix as name when name is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: '123456789',
          email: 'user@gmail.com',
          name: '',
          picture: null,
        }),
      });

      const profile = await provider.getProfile('access-token');

      expect(profile.name).toBe('user');
      expect(profile.profileImageUrl).toBeNull();
    });

    it('should throw when email is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: '123456789',
          name: 'Test User',
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

import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OAuthProvider,
  OAuthProfile,
  OAuthTokenResponse,
} from '../../interfaces/oauth-profile.interface';
import { BusinessException } from '../../../common/filters/business.exception';

@Injectable()
export class NaverProvider implements OAuthProvider {
  private readonly logger = new Logger(NaverProvider.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly callbackUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('NAVER_CLIENT_ID', '');
    this.clientSecret = this.configService.get<string>('NAVER_CLIENT_SECRET', '');
    this.callbackUrl = this.configService.get<string>(
      'NAVER_CALLBACK_URL',
      'http://localhost:4000/api/auth/social/naver/callback',
    );
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      response_type: 'code',
      state,
    });
    return `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthTokenResponse> {
    const response = await fetch('https://nid.naver.com/oauth2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
      }).toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Naver token exchange failed: ${errorBody}`);
      throw new BusinessException(
        'OAUTH_TOKEN_EXCHANGE_FAILED',
        'Failed to exchange authorization code with Naver',
        HttpStatus.BAD_REQUEST,
      );
    }

    const data = await response.json();

    if (data.error) {
      this.logger.error(`Naver token error: ${data.error_description}`);
      throw new BusinessException(
        'OAUTH_TOKEN_EXCHANGE_FAILED',
        `Naver OAuth error: ${data.error_description}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      refreshToken: data.refresh_token,
      expiresIn: Number(data.expires_in),
    };
  }

  async getProfile(accessToken: string): Promise<OAuthProfile> {
    const response = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Naver profile fetch failed: ${errorBody}`);
      throw new BusinessException(
        'OAUTH_PROFILE_FETCH_FAILED',
        'Failed to fetch profile from Naver',
        HttpStatus.BAD_REQUEST,
      );
    }

    const data = await response.json();

    if (data.resultcode !== '00') {
      throw new BusinessException(
        'OAUTH_PROFILE_FETCH_FAILED',
        `Naver profile error: ${data.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const naverResponse = data.response || {};

    if (!naverResponse.email) {
      throw new BusinessException(
        'OAUTH_EMAIL_REQUIRED',
        'Email is required for social login. Please allow email access in Naver settings.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      provider: 'NAVER',
      providerId: naverResponse.id,
      email: naverResponse.email,
      name: naverResponse.name || naverResponse.nickname || naverResponse.email.split('@')[0],
      profileImageUrl: naverResponse.profile_image || null,
    };
  }
}

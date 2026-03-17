import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OAuthProvider,
  OAuthProfile,
  OAuthTokenResponse,
} from '../../interfaces/oauth-profile.interface';
import { BusinessException } from '../../../common/filters/business.exception';

@Injectable()
export class GoogleProvider implements OAuthProvider {
  private readonly logger = new Logger(GoogleProvider.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly callbackUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('GOOGLE_CLIENT_ID', '');
    this.clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET', '');
    this.callbackUrl = this.configService.get<string>(
      'GOOGLE_CALLBACK_URL',
      'http://localhost:4000/api/auth/social/google/callback',
    );
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'offline',
      prompt: 'consent',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthTokenResponse> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.callbackUrl,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Google token exchange failed: ${errorBody}`);
      throw new BusinessException(
        'OAUTH_TOKEN_EXCHANGE_FAILED',
        'Failed to exchange authorization code with Google',
        HttpStatus.BAD_REQUEST,
      );
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  async getProfile(accessToken: string): Promise<OAuthProfile> {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Google profile fetch failed: ${errorBody}`);
      throw new BusinessException(
        'OAUTH_PROFILE_FETCH_FAILED',
        'Failed to fetch profile from Google',
        HttpStatus.BAD_REQUEST,
      );
    }

    const data = await response.json();

    if (!data.email) {
      throw new BusinessException(
        'OAUTH_EMAIL_REQUIRED',
        'Email is required for social login',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      provider: 'GOOGLE',
      providerId: data.id,
      email: data.email,
      name: data.name || data.email.split('@')[0],
      profileImageUrl: data.picture || null,
    };
  }
}

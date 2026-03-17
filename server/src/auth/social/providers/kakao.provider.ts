import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OAuthProvider,
  OAuthProfile,
  OAuthTokenResponse,
} from '../../interfaces/oauth-profile.interface';
import { BusinessException } from '../../../common/filters/business.exception';

@Injectable()
export class KakaoProvider implements OAuthProvider {
  private readonly logger = new Logger(KakaoProvider.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly callbackUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('KAKAO_CLIENT_ID', '');
    this.clientSecret = this.configService.get<string>('KAKAO_CLIENT_SECRET', '');
    this.callbackUrl = this.configService.get<string>(
      'KAKAO_CALLBACK_URL',
      'http://localhost:4000/api/auth/social/kakao/callback',
    );
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      response_type: 'code',
      state,
      scope: 'profile_nickname profile_image account_email',
    });
    return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthTokenResponse> {
    const response = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.callbackUrl,
        code,
      }).toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Kakao token exchange failed: ${errorBody}`);
      throw new BusinessException(
        'OAUTH_TOKEN_EXCHANGE_FAILED',
        'Failed to exchange authorization code with Kakao',
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
    const response = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Kakao profile fetch failed: ${errorBody}`);
      throw new BusinessException(
        'OAUTH_PROFILE_FETCH_FAILED',
        'Failed to fetch profile from Kakao',
        HttpStatus.BAD_REQUEST,
      );
    }

    const data = await response.json();
    const kakaoAccount = data.kakao_account || {};
    const profile = kakaoAccount.profile || {};

    if (!kakaoAccount.email) {
      throw new BusinessException(
        'OAUTH_EMAIL_REQUIRED',
        'Email is required for social login. Please allow email access in Kakao settings.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      provider: 'KAKAO',
      providerId: String(data.id),
      email: kakaoAccount.email,
      name: profile.nickname || kakaoAccount.email.split('@')[0],
      profileImageUrl: profile.profile_image_url || null,
    };
  }
}

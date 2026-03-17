import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth.service';
import { BusinessException } from '../../common/filters/business.exception';
import { OAuthProfile, OAuthProvider } from '../interfaces/oauth-profile.interface';
import { GoogleProvider } from './providers/google.provider';
import { KakaoProvider } from './providers/kakao.provider';
import { NaverProvider } from './providers/naver.provider';

const SUPPORTED_PROVIDERS = ['google', 'kakao', 'naver'] as const;
type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

@Injectable()
export class SocialAuthService {
  private readonly logger = new Logger(SocialAuthService.name);
  private readonly providers: Map<string, OAuthProvider>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly googleProvider: GoogleProvider,
    private readonly kakaoProvider: KakaoProvider,
    private readonly naverProvider: NaverProvider,
  ) {
    this.providers = new Map<string, OAuthProvider>([
      ['google', this.googleProvider],
      ['kakao', this.kakaoProvider],
      ['naver', this.naverProvider],
    ]);
  }

  generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  validateProvider(provider: string): SupportedProvider {
    if (!SUPPORTED_PROVIDERS.includes(provider as SupportedProvider)) {
      throw new BusinessException(
        'INVALID_PROVIDER',
        `Unsupported OAuth provider: ${provider}. Supported: ${SUPPORTED_PROVIDERS.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return provider as SupportedProvider;
  }

  getAuthorizationUrl(provider: string, state: string): string {
    const validProvider = this.validateProvider(provider);
    const oauthProvider = this.providers.get(validProvider);
    if (!oauthProvider) {
      throw new BusinessException(
        'PROVIDER_NOT_CONFIGURED',
        `Provider ${provider} is not configured`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return oauthProvider.getAuthorizationUrl(state);
  }

  async handleCallback(
    provider: string,
    code: string,
    ip: string,
    userAgent?: string,
  ) {
    const validProvider = this.validateProvider(provider);
    const oauthProvider = this.providers.get(validProvider);
    if (!oauthProvider) {
      throw new BusinessException(
        'PROVIDER_NOT_CONFIGURED',
        `Provider ${provider} is not configured`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Step 1: Exchange code for token
    const tokenResponse = await oauthProvider.exchangeCode(code);

    // Step 2: Fetch user profile
    const profile = await oauthProvider.getProfile(tokenResponse.accessToken);

    // Step 3: Account linking logic
    return this.linkAccountAndLogin(profile, ip, userAgent);
  }

  private async linkAccountAndLogin(
    profile: OAuthProfile,
    ip: string,
    userAgent?: string,
  ) {
    const providerCode = profile.provider.toUpperCase();

    // 1. Find existing social account by (provider, providerId)
    const existingSocialAccount = await this.prisma.socialAccount.findFirst({
      where: {
        sclPrvdCd: providerCode,
        sclPrvdUserId: profile.providerId,
        delYn: 'N',
      },
      include: { user: true },
    });

    if (existingSocialAccount) {
      const user = existingSocialAccount.user;

      // Check user status
      if (user.userSttsCd === 'SUSP') {
        await this.logLoginAttempt(user.id, providerCode, 'FAIL', ip, userAgent, 'Account suspended');
        throw new BusinessException(
          'ACCOUNT_SUSPENDED',
          'Your account has been suspended',
          HttpStatus.FORBIDDEN,
        );
      }

      if (user.userSttsCd === 'INAC') {
        await this.logLoginAttempt(user.id, providerCode, 'FAIL', ip, userAgent, 'Account inactive');
        throw new BusinessException(
          'ACCOUNT_INACTIVE',
          'Your account is inactive',
          HttpStatus.FORBIDDEN,
        );
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lstLgnDt: new Date() },
      });

      // Update social account profile if changed
      await this.prisma.socialAccount.update({
        where: { id: existingSocialAccount.id },
        data: {
          sclEml: profile.email,
          sclPrflImgUrl: profile.profileImageUrl,
          mdfrId: user.id,
        },
      });

      const tokens = await this.authService.generateTokens(
        user.id,
        user.userEmail,
        user.useRoleCd,
      );
      await this.storeRefreshToken(user.id, tokens.refreshToken, ip, userAgent);
      await this.logLoginAttempt(user.id, providerCode, 'SUCC', ip, userAgent);

      return {
        user: this.formatUserResponse(user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    }

    // 2. Find user by email (auto-link)
    const existingUser = await this.prisma.user.findFirst({
      where: { userEmail: profile.email, delYn: 'N' },
    });

    if (existingUser) {
      // Check user status
      if (existingUser.userSttsCd === 'SUSP') {
        await this.logLoginAttempt(existingUser.id, providerCode, 'FAIL', ip, userAgent, 'Account suspended');
        throw new BusinessException(
          'ACCOUNT_SUSPENDED',
          'Your account has been suspended',
          HttpStatus.FORBIDDEN,
        );
      }

      if (existingUser.userSttsCd === 'INAC') {
        await this.logLoginAttempt(existingUser.id, providerCode, 'FAIL', ip, userAgent, 'Account inactive');
        throw new BusinessException(
          'ACCOUNT_INACTIVE',
          'Your account is inactive',
          HttpStatus.FORBIDDEN,
        );
      }

      // Auto-link: create social account for existing user
      await this.prisma.socialAccount.create({
        data: {
          userId: existingUser.id,
          sclPrvdCd: providerCode,
          sclPrvdUserId: profile.providerId,
          sclEml: profile.email,
          sclPrflImgUrl: profile.profileImageUrl,
          lnkdDt: new Date(),
          rgtrId: existingUser.id,
          mdfrId: existingUser.id,
        },
      });

      // Update profile image if not set
      if (!existingUser.prflImgUrl && profile.profileImageUrl) {
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            prflImgUrl: profile.profileImageUrl,
            lstLgnDt: new Date(),
          },
        });
      } else {
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { lstLgnDt: new Date() },
        });
      }

      const tokens = await this.authService.generateTokens(
        existingUser.id,
        existingUser.userEmail,
        existingUser.useRoleCd,
      );
      await this.storeRefreshToken(existingUser.id, tokens.refreshToken, ip, userAgent);
      await this.logLoginAttempt(existingUser.id, providerCode, 'SUCC', ip, userAgent);

      return {
        user: this.formatUserResponse(existingUser),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    }

    // 3. Create new user + social account
    const newUser = await this.prisma.user.create({
      data: {
        userEmail: profile.email,
        userPswd: null,
        userNm: profile.name,
        userNcnm: null,
        prflImgUrl: profile.profileImageUrl,
        useRoleCd: 'BUYER',
        userSttsCd: 'ACTV',
        emailVrfcYn: 'Y', // Social login implies verified email
        lstLgnDt: new Date(),
        rgtrId: 'SYSTEM',
        mdfrId: 'SYSTEM',
      },
    });

    await this.prisma.socialAccount.create({
      data: {
        userId: newUser.id,
        sclPrvdCd: providerCode,
        sclPrvdUserId: profile.providerId,
        sclEml: profile.email,
        sclPrflImgUrl: profile.profileImageUrl,
        lnkdDt: new Date(),
        rgtrId: newUser.id,
        mdfrId: newUser.id,
      },
    });

    const tokens = await this.authService.generateTokens(
      newUser.id,
      newUser.userEmail,
      newUser.useRoleCd,
    );
    await this.storeRefreshToken(newUser.id, tokens.refreshToken, ip, userAgent);
    await this.logLoginAttempt(newUser.id, providerCode, 'SUCC', ip, userAgent);

    return {
      user: this.formatUserResponse(newUser),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private async storeRefreshToken(
    userId: string,
    token: string,
    ip: string,
    userAgent?: string,
  ): Promise<void> {
    const tokenHash = this.authService.hashToken(token);
    const refreshExpiration = Number(
      this.configService.get('JWT_REFRESH_EXPIRATION', 604800),
    );
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + refreshExpiration);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tknVal: tokenHash,
        exprDt: expiresAt,
        clntIpAddr: ip,
        userAgnt: userAgent ?? null,
        rvkdYn: 'N',
        rgtrId: userId,
        mdfrId: userId,
      },
    });
  }

  private async logLoginAttempt(
    userId: string,
    method: string,
    result: string,
    ip: string,
    userAgent?: string,
    failReason?: string,
  ): Promise<void> {
    await this.prisma.loginLog.create({
      data: {
        userId,
        lgnMthdCd: method,
        lgnDt: new Date(),
        lgnIpAddr: ip,
        lgnRsltCd: result,
        failRsn: failReason ?? null,
        userAgnt: userAgent ?? null,
        rgtrId: userId,
      },
    });
  }

  private formatUserResponse(user: {
    id: string;
    userEmail: string;
    userNm: string;
    userNcnm: string | null;
    emailVrfcYn: string;
    prflImgUrl: string | null;
    useRoleCd: string;
  }) {
    return {
      id: user.id,
      email: user.userEmail,
      name: user.userNm,
      nickname: user.userNcnm,
      emailVerified: user.emailVrfcYn === 'Y',
      profileImageUrl: user.prflImgUrl,
      role: user.useRoleCd,
    };
  }
}

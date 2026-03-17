import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Public } from '../decorators/public.decorator';
import { SocialAuthService } from './social-auth.service';
import { ConfigService } from '@nestjs/config';
import { BusinessException } from '../../common/filters/business.exception';

@Controller('api/auth/social')
export class SocialAuthController {
  private readonly logger = new Logger(SocialAuthController.name);

  constructor(
    private readonly socialAuthService: SocialAuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get(':provider')
  async authorize(
    @Param('provider') provider: string,
    @Res() res: Response,
  ) {
    this.socialAuthService.validateProvider(provider);

    const state = this.socialAuthService.generateState();

    // Store state in cookie for CSRF validation
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: false, // set to true in production
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
      path: '/',
    });

    const authorizationUrl = this.socialAuthService.getAuthorizationUrl(
      provider,
      state,
    );

    res.redirect(authorizationUrl);
  }

  @Public()
  @Get(':provider/callback')
  async callback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );

    try {
      // Check for OAuth error
      if (error) {
        this.logger.warn(`OAuth error from ${provider}: ${error}`);
        res.redirect(
          `${frontendUrl}/auth/social/callback?error=OAUTH_DENIED&message=${encodeURIComponent('OAuth authorization was denied')}`,
        );
        return;
      }

      if (!code) {
        res.redirect(
          `${frontendUrl}/auth/social/callback?error=MISSING_CODE&message=${encodeURIComponent('Authorization code is missing')}`,
        );
        return;
      }

      // Validate CSRF state
      const storedState = req.cookies?.oauth_state;
      if (!storedState || storedState !== state) {
        this.logger.warn(
          `CSRF state mismatch for ${provider}: expected=${storedState}, received=${state}`,
        );
        res.redirect(
          `${frontendUrl}/auth/social/callback?error=INVALID_STATE&message=${encodeURIComponent('Invalid state parameter. Please try again.')}`,
        );
        return;
      }

      // Clear the state cookie
      res.clearCookie('oauth_state', { path: '/' });

      const ip = this.getClientIp(req);
      const userAgent = req.headers['user-agent'];

      const result = await this.socialAuthService.handleCallback(
        provider,
        code,
        ip,
        userAgent,
      );

      // Redirect to frontend with tokens
      const params = new URLSearchParams({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: JSON.stringify(result.user),
      });

      res.redirect(
        `${frontendUrl}/auth/social/callback?${params.toString()}`,
      );
    } catch (err) {
      this.logger.error(
        `Social auth callback error for ${provider}: ${err instanceof Error ? err.message : String(err)}`,
      );

      const errorCode =
        err instanceof BusinessException ? err.errorCode : 'SOCIAL_AUTH_FAILED';
      const errorMessage =
        err instanceof Error ? err.message : 'Social login failed';

      res.redirect(
        `${frontendUrl}/auth/social/callback?error=${encodeURIComponent(errorCode)}&message=${encodeURIComponent(errorMessage)}`,
      );
    }
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || '127.0.0.1';
  }
}

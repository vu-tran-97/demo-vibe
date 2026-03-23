import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './auth.guard';
import { SocialAuthController } from './social/social-auth.controller';
import { SocialAuthService } from './social/social-auth.service';
import { GoogleProvider } from './social/providers/google.provider';
import { KakaoProvider } from './social/providers/kakao.provider';
import { NaverProvider } from './social/providers/naver.provider';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: Number(configService.get('JWT_ACCESS_EXPIRATION') || configService.get('JWT_EXPIRATION') || 2592000),
        },
      }),
    }),
  ],
  controllers: [AuthController, SocialAuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    SocialAuthService,
    GoogleProvider,
    KakaoProvider,
    NaverProvider,
  ],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}

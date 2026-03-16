import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    signup(dto: SignupDto, ip: string, userAgent?: string): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            nickname: string | null;
            emailVerified: boolean;
            profileImageUrl: string | null;
        };
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    login(dto: LoginDto, ip: string, userAgent?: string): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            nickname: string | null;
            emailVerified: boolean;
            profileImageUrl: string | null;
        };
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    logout(refreshToken: string): Promise<void>;
    refresh(refreshToken: string, ip: string, userAgent?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    verifyEmail(token: string): Promise<{
        message: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    generateTokens(userId: string, email: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    private storeRefreshToken;
    hashToken(token: string): string;
    private getAccessExpiration;
    private getRefreshExpiration;
    private logLoginAttempt;
    private logLoginAttemptByEmail;
    private formatUserResponse;
}

import { Request } from 'express';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signup(dto: SignupDto, req: Request): Promise<{
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
    login(dto: LoginDto, req: Request): Promise<{
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
    logout(dto: RefreshTokenDto): Promise<null>;
    refresh(dto: RefreshTokenDto, req: Request): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    verifyEmail(dto: VerifyEmailDto): Promise<{
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    private getClientIp;
}

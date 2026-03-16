"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const uuid_1 = require("uuid");
const prisma_service_1 = require("../prisma/prisma.service");
const business_exception_1 = require("../common/filters/business.exception");
const BCRYPT_SALT_ROUNDS = 12;
const EMAIL_VERIFICATION_HOURS = 24;
const PASSWORD_RESET_HOURS = 1;
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async signup(dto, ip, userAgent) {
        const existingEmail = await this.prisma.user.findFirst({
            where: { userEmail: dto.email, delYn: 'N' },
        });
        if (existingEmail) {
            throw new business_exception_1.BusinessException('EMAIL_ALREADY_EXISTS', 'Email is already registered', common_1.HttpStatus.CONFLICT);
        }
        if (dto.nickname) {
            const existingNickname = await this.prisma.user.findFirst({
                where: { userNcnm: dto.nickname, delYn: 'N' },
            });
            if (existingNickname) {
                throw new business_exception_1.BusinessException('NICKNAME_ALREADY_EXISTS', 'Nickname is already taken', common_1.HttpStatus.CONFLICT);
            }
        }
        const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
        const verificationToken = (0, uuid_1.v4)();
        const verificationExpiry = new Date();
        verificationExpiry.setHours(verificationExpiry.getHours() + EMAIL_VERIFICATION_HOURS);
        const user = await this.prisma.user.create({
            data: {
                userEmail: dto.email,
                userPswd: hashedPassword,
                userNm: dto.name,
                userNcnm: dto.nickname ?? null,
                userSttsCd: 'ACTV',
                emailVrfcYn: 'N',
                emailVrfcTkn: verificationToken,
                emailVrfcExprDt: verificationExpiry,
                lstLgnDt: new Date(),
                rgtrId: 'SYSTEM',
                mdfrId: 'SYSTEM',
            },
        });
        const tokens = await this.generateTokens(user.id, user.userEmail);
        await this.storeRefreshToken(user.id, tokens.refreshToken, ip, userAgent);
        await this.logLoginAttempt(user.id, 'EMAIL', 'SUCC', ip, userAgent);
        return {
            user: this.formatUserResponse(user),
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: this.getAccessExpiration(),
        };
    }
    async login(dto, ip, userAgent) {
        const user = await this.prisma.user.findFirst({
            where: { userEmail: dto.email, delYn: 'N' },
        });
        if (!user || !user.userPswd) {
            await this.logLoginAttemptByEmail(dto.email, 'EMAIL', 'FAIL', ip, userAgent, 'Invalid credentials');
            throw new business_exception_1.BusinessException('INVALID_CREDENTIALS', 'Invalid email or password', common_1.HttpStatus.UNAUTHORIZED);
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.userPswd);
        if (!isPasswordValid) {
            await this.logLoginAttempt(user.id, 'EMAIL', 'FAIL', ip, userAgent, 'Invalid credentials');
            throw new business_exception_1.BusinessException('INVALID_CREDENTIALS', 'Invalid email or password', common_1.HttpStatus.UNAUTHORIZED);
        }
        if (user.userSttsCd === 'SUSP') {
            await this.logLoginAttempt(user.id, 'EMAIL', 'FAIL', ip, userAgent, 'Account suspended');
            throw new business_exception_1.BusinessException('ACCOUNT_SUSPENDED', 'Your account has been suspended', common_1.HttpStatus.FORBIDDEN);
        }
        if (user.userSttsCd === 'INAC') {
            await this.logLoginAttempt(user.id, 'EMAIL', 'FAIL', ip, userAgent, 'Account inactive');
            throw new business_exception_1.BusinessException('ACCOUNT_INACTIVE', 'Your account is inactive', common_1.HttpStatus.FORBIDDEN);
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lstLgnDt: new Date() },
        });
        const tokens = await this.generateTokens(user.id, user.userEmail);
        await this.storeRefreshToken(user.id, tokens.refreshToken, ip, userAgent);
        await this.logLoginAttempt(user.id, 'EMAIL', 'SUCC', ip, userAgent);
        return {
            user: this.formatUserResponse(user),
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: this.getAccessExpiration(),
        };
    }
    async logout(refreshToken) {
        const tokenHash = this.hashToken(refreshToken);
        await this.prisma.refreshToken.updateMany({
            where: { tknVal: tokenHash, rvkdYn: 'N' },
            data: { rvkdYn: 'Y' },
        });
    }
    async refresh(refreshToken, ip, userAgent) {
        let payload;
        try {
            payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('JWT_SECRET'),
            });
        }
        catch {
            throw new business_exception_1.BusinessException('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token', common_1.HttpStatus.UNAUTHORIZED);
        }
        if (payload.type !== 'refresh') {
            throw new business_exception_1.BusinessException('INVALID_REFRESH_TOKEN', 'Invalid token type', common_1.HttpStatus.UNAUTHORIZED);
        }
        const tokenHash = this.hashToken(refreshToken);
        const storedToken = await this.prisma.refreshToken.findFirst({
            where: { tknVal: tokenHash },
        });
        if (!storedToken) {
            throw new business_exception_1.BusinessException('INVALID_REFRESH_TOKEN', 'Refresh token not found', common_1.HttpStatus.UNAUTHORIZED);
        }
        if (storedToken.rvkdYn === 'Y') {
            this.logger.warn(`Token reuse detected for user ${storedToken.userId}. Revoking all tokens.`);
            await this.prisma.refreshToken.updateMany({
                where: { userId: storedToken.userId },
                data: { rvkdYn: 'Y' },
            });
            throw new business_exception_1.BusinessException('TOKEN_REUSE_DETECTED', 'Potential security breach detected. All sessions have been revoked.', common_1.HttpStatus.UNAUTHORIZED);
        }
        await this.prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { rvkdYn: 'Y' },
        });
        const user = await this.prisma.user.findUnique({
            where: { id: storedToken.userId },
        });
        if (!user || user.delYn === 'Y') {
            throw new business_exception_1.BusinessException('INVALID_REFRESH_TOKEN', 'User not found', common_1.HttpStatus.UNAUTHORIZED);
        }
        const tokens = await this.generateTokens(user.id, user.userEmail);
        await this.storeRefreshToken(user.id, tokens.refreshToken, ip, userAgent);
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: this.getAccessExpiration(),
        };
    }
    async verifyEmail(token) {
        const user = await this.prisma.user.findFirst({
            where: { emailVrfcTkn: token, delYn: 'N' },
        });
        if (!user) {
            throw new business_exception_1.BusinessException('INVALID_VERIFICATION_TOKEN', 'Invalid verification token', common_1.HttpStatus.BAD_REQUEST);
        }
        if (user.emailVrfcYn === 'Y') {
            throw new business_exception_1.BusinessException('EMAIL_ALREADY_VERIFIED', 'Email is already verified', common_1.HttpStatus.BAD_REQUEST);
        }
        if (!user.emailVrfcExprDt || user.emailVrfcExprDt < new Date()) {
            throw new business_exception_1.BusinessException('VERIFICATION_TOKEN_EXPIRED', 'Verification token has expired', common_1.HttpStatus.BAD_REQUEST);
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                emailVrfcYn: 'Y',
                emailVrfcTkn: null,
                emailVrfcExprDt: null,
            },
        });
        return { message: 'Email verified successfully' };
    }
    async forgotPassword(email) {
        const responseMessage = 'If an account with that email exists, a reset link has been sent';
        const user = await this.prisma.user.findFirst({
            where: { userEmail: email, delYn: 'N' },
        });
        if (!user || !user.userPswd) {
            return { message: responseMessage };
        }
        const resetToken = (0, uuid_1.v4)();
        const resetExpiry = new Date();
        resetExpiry.setHours(resetExpiry.getHours() + PASSWORD_RESET_HOURS);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                pswdRstTkn: resetToken,
                pswdRstExprDt: resetExpiry,
            },
        });
        this.logger.log(`Password reset token generated for user ${user.id}`);
        return { message: responseMessage };
    }
    async resetPassword(dto) {
        const user = await this.prisma.user.findFirst({
            where: { pswdRstTkn: dto.token, delYn: 'N' },
        });
        if (!user) {
            throw new business_exception_1.BusinessException('INVALID_RESET_TOKEN', 'Invalid reset token', common_1.HttpStatus.BAD_REQUEST);
        }
        if (!user.pswdRstExprDt || user.pswdRstExprDt < new Date()) {
            throw new business_exception_1.BusinessException('RESET_TOKEN_EXPIRED', 'Reset token has expired', common_1.HttpStatus.BAD_REQUEST);
        }
        const hashedPassword = await bcrypt.hash(dto.newPassword, BCRYPT_SALT_ROUNDS);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                userPswd: hashedPassword,
                pswdRstTkn: null,
                pswdRstExprDt: null,
            },
        });
        await this.prisma.refreshToken.updateMany({
            where: { userId: user.id },
            data: { rvkdYn: 'Y' },
        });
        return { message: 'Password reset successfully' };
    }
    async generateTokens(userId, email) {
        const accessPayload = {
            sub: userId,
            email,
            type: 'access',
        };
        const refreshPayload = {
            sub: userId,
            email,
            type: 'refresh',
        };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(accessPayload, {
                expiresIn: this.getAccessExpiration(),
            }),
            this.jwtService.signAsync(refreshPayload, {
                expiresIn: this.getRefreshExpiration(),
            }),
        ]);
        return { accessToken, refreshToken };
    }
    async storeRefreshToken(userId, token, ip, userAgent) {
        const tokenHash = this.hashToken(token);
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + this.getRefreshExpiration());
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
    hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
    getAccessExpiration() {
        return this.configService.get('JWT_ACCESS_EXPIRATION', 900);
    }
    getRefreshExpiration() {
        return this.configService.get('JWT_REFRESH_EXPIRATION', 604800);
    }
    async logLoginAttempt(userId, method, result, ip, userAgent, failReason) {
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
    async logLoginAttemptByEmail(_email, method, result, ip, userAgent, failReason) {
        this.logger.warn(`Failed login attempt for unknown email from IP ${ip}: ${failReason}`);
        void method;
        void result;
        void userAgent;
        void failReason;
    }
    formatUserResponse(user) {
        return {
            id: user.id,
            email: user.userEmail,
            name: user.userNm,
            nickname: user.userNcnm,
            emailVerified: user.emailVrfcYn === 'Y',
            profileImageUrl: user.prflImgUrl,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/filters/business.exception';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { MailService } from '../mail/mail.service';

const BCRYPT_SALT_ROUNDS = 12;
const EMAIL_VERIFICATION_HOURS = 24;
const PASSWORD_RESET_HOURS = 1;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async signup(dto: SignupDto, ip: string, userAgent?: string) {
    const existingEmail = await this.prisma.user.findFirst({
      where: { userEmail: dto.email, delYn: 'N' },
    });
    if (existingEmail) {
      throw new BusinessException(
        'EMAIL_ALREADY_EXISTS',
        'Email is already registered',
        HttpStatus.CONFLICT,
      );
    }

    if (dto.nickname) {
      const existingNickname = await this.prisma.user.findFirst({
        where: { userNcnm: dto.nickname, delYn: 'N' },
      });
      if (existingNickname) {
        throw new BusinessException(
          'NICKNAME_ALREADY_EXISTS',
          'Nickname is already taken',
          HttpStatus.CONFLICT,
        );
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const verificationToken = uuidv4();
    const verificationExpiry = new Date();
    verificationExpiry.setHours(
      verificationExpiry.getHours() + EMAIL_VERIFICATION_HOURS,
    );

    const generatedNickname = dto.nickname || `user_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

    const user = await this.prisma.user.create({
      data: {
        userEmail: dto.email,
        userPswd: hashedPassword,
        userNm: dto.name,
        userNcnm: generatedNickname,
        useRoleCd: dto.role || 'BUYER',
        userSttsCd: 'ACTV',
        emailVrfcYn: 'N',
        emlVrfcTkn: verificationToken,
        emlVrfcExprDt: verificationExpiry,
        lstLgnDt: new Date(),
        rgtrId: 'SYSTEM',
        mdfrId: 'SYSTEM',
      },
    });

    const tokens = await this.generateTokens(user.id, user.userEmail, user.useRoleCd);
    await this.storeRefreshToken(user.id, tokens.refreshToken, ip, userAgent);
    await this.logLoginAttempt(user.id, 'EMAIL', 'SUCC', ip, userAgent);

    // Send welcome email (non-blocking)
    void this.mailService.sendWelcomeEmail(
      user.userEmail,
      user.userNm,
    );

    return {
      user: this.formatUserResponse(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: this.getAccessExpiration(),
    };
  }

  async login(dto: LoginDto, ip: string, userAgent?: string) {
    const user = await this.prisma.user.findFirst({
      where: { userEmail: dto.email, delYn: 'N' },
    });

    if (!user || !user.userPswd) {
      await this.logLoginAttemptByEmail(dto.email, 'EMAIL', 'FAIL', ip, userAgent, 'Invalid credentials');
      throw new BusinessException(
        'INVALID_CREDENTIALS',
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.userPswd);
    if (!isPasswordValid) {
      await this.logLoginAttempt(user.id, 'EMAIL', 'FAIL', ip, userAgent, 'Invalid credentials');
      throw new BusinessException(
        'INVALID_CREDENTIALS',
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.userSttsCd === 'SUSP') {
      await this.logLoginAttempt(user.id, 'EMAIL', 'FAIL', ip, userAgent, 'Account suspended');
      throw new BusinessException(
        'ACCOUNT_SUSPENDED',
        'Your account has been suspended',
        HttpStatus.FORBIDDEN,
      );
    }

    if (user.userSttsCd === 'INAC') {
      await this.logLoginAttempt(user.id, 'EMAIL', 'FAIL', ip, userAgent, 'Account inactive');
      throw new BusinessException(
        'ACCOUNT_INACTIVE',
        'Your account is inactive',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lstLgnDt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.userEmail, user.useRoleCd);
    await this.storeRefreshToken(user.id, tokens.refreshToken, ip, userAgent);
    await this.logLoginAttempt(user.id, 'EMAIL', 'SUCC', ip, userAgent);

    return {
      user: this.formatUserResponse(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: this.getAccessExpiration(),
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tknVal: tokenHash, rvkdYn: 'N' },
      data: { rvkdYn: 'Y' },
    });
  }

  async refresh(refreshToken: string, ip: string, userAgent?: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new BusinessException(
        'INVALID_REFRESH_TOKEN',
        'Invalid or expired refresh token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (payload.type !== 'refresh') {
      throw new BusinessException(
        'INVALID_REFRESH_TOKEN',
        'Invalid token type',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: { tknVal: tokenHash },
    });

    if (!storedToken) {
      throw new BusinessException(
        'INVALID_REFRESH_TOKEN',
        'Refresh token not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (storedToken.rvkdYn === 'Y') {
      this.logger.warn(
        `Token reuse detected for user ${storedToken.userId}. Revoking all tokens.`,
      );
      await this.prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { rvkdYn: 'Y' },
      });
      throw new BusinessException(
        'TOKEN_REUSE_DETECTED',
        'Potential security breach detected. All sessions have been revoked.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Revoke old token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { rvkdYn: 'Y' },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: storedToken.userId },
    });
    if (!user || user.delYn === 'Y') {
      throw new BusinessException(
        'INVALID_REFRESH_TOKEN',
        'User not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const tokens = await this.generateTokens(user.id, user.userEmail, user.useRoleCd);
    await this.storeRefreshToken(user.id, tokens.refreshToken, ip, userAgent);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: this.getAccessExpiration(),
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: { emlVrfcTkn: token, delYn: 'N' },
    });

    if (!user) {
      throw new BusinessException(
        'INVALID_VERIFICATION_TOKEN',
        'Invalid verification token',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (user.emailVrfcYn === 'Y') {
      throw new BusinessException(
        'EMAIL_ALREADY_VERIFIED',
        'Email is already verified',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!user.emlVrfcExprDt || user.emlVrfcExprDt < new Date()) {
      throw new BusinessException(
        'VERIFICATION_TOKEN_EXPIRED',
        'Verification token has expired',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVrfcYn: 'Y',
        emlVrfcTkn: null,
        emlVrfcExprDt: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const responseMessage =
      'If an account with that email exists, a reset link has been sent';

    const user = await this.prisma.user.findFirst({
      where: { userEmail: email, delYn: 'N' },
    });

    if (!user || !user.userPswd) {
      return { message: responseMessage };
    }

    const resetToken = uuidv4();
    const resetExpiry = new Date();
    resetExpiry.setHours(resetExpiry.getHours() + PASSWORD_RESET_HOURS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        pswdRstTkn: resetToken,
        pswdRstExprDt: resetExpiry,
      },
    });

    // Send reset email (non-blocking)
    void this.mailService.sendPasswordResetEmail(
      user.userEmail,
      user.userNm,
      resetToken,
    );
    this.logger.log(`Password reset token generated for user ${user.id}`);

    return { message: responseMessage };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: { pswdRstTkn: dto.token, delYn: 'N' },
    });

    if (!user) {
      throw new BusinessException(
        'INVALID_RESET_TOKEN',
        'Invalid reset token',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!user.pswdRstExprDt || user.pswdRstExprDt < new Date()) {
      throw new BusinessException(
        'RESET_TOKEN_EXPIRED',
        'Reset token has expired',
        HttpStatus.BAD_REQUEST,
      );
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

    // Revoke all refresh tokens for security
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { rvkdYn: 'Y' },
    });

    return { message: 'Password reset successfully' };
  }

  // --- User Settings ---

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, delYn: 'N' },
    });

    if (!user) {
      throw new BusinessException(
        'USER_NOT_FOUND',
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check nickname uniqueness (exclude self and soft-deleted users)
    if (dto.nickname && dto.nickname !== user.userNcnm) {
      const existingNickname = await this.prisma.user.findFirst({
        where: {
          userNcnm: dto.nickname,
          delYn: 'N',
          id: { not: userId },
        },
      });
      if (existingNickname) {
        throw new BusinessException(
          'NICKNAME_ALREADY_EXISTS',
          'Nickname is already taken',
          HttpStatus.CONFLICT,
        );
      }
    }

    const updateData: Record<string, unknown> = { mdfrId: userId };
    if (dto.name !== undefined) updateData.userNm = dto.name;
    if (dto.nickname !== undefined) updateData.userNcnm = dto.nickname;
    if (dto.profileImageUrl !== undefined)
      updateData.prflImgUrl = dto.profileImageUrl;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return this.formatUserResponse(updated);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, delYn: 'N' },
    });

    if (!user || !user.userPswd) {
      throw new BusinessException(
        'USER_NOT_FOUND',
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const isCurrentValid = await bcrypt.compare(
      dto.currentPassword,
      user.userPswd,
    );
    if (!isCurrentValid) {
      throw new BusinessException(
        'INVALID_CURRENT_PASSWORD',
        'Current password is incorrect',
        HttpStatus.BAD_REQUEST,
      );
    }

    const isSamePassword = await bcrypt.compare(
      dto.newPassword,
      user.userPswd,
    );
    if (isSamePassword) {
      throw new BusinessException(
        'SAME_PASSWORD',
        'New password must be different from current password',
        HttpStatus.BAD_REQUEST,
      );
    }

    const hashedPassword = await bcrypt.hash(
      dto.newPassword,
      BCRYPT_SALT_ROUNDS,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { userPswd: hashedPassword, mdfrId: userId },
    });

    // Revoke all refresh tokens for security
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { rvkdYn: 'Y' },
    });

    return { message: 'Password changed successfully' };
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, delYn: 'N' },
    });

    if (!user) {
      throw new BusinessException(
        'USER_NOT_FOUND',
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        delYn: 'Y',
        userSttsCd: 'INAC',
        mdfrId: userId,
      },
    });

    // Revoke all refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { rvkdYn: 'Y' },
    });

    return { message: 'Account deleted successfully' };
  }

  // --- Token helpers ---

  async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessPayload: JwtPayload = {
      sub: userId,
      email,
      role,
      type: 'access',
    };
    const refreshPayload: JwtPayload = {
      sub: userId,
      email,
      role,
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

  private async storeRefreshToken(
    userId: string,
    token: string,
    ip: string,
    userAgent?: string,
  ): Promise<void> {
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

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private getAccessExpiration(): number {
    return Number(
      this.configService.get('JWT_ACCESS_EXPIRATION')
      || 900, // 15 minutes
    );
  }

  private getRefreshExpiration(): number {
    return Number(this.configService.get('JWT_REFRESH_EXPIRATION') || 259200); // 3 days
  }

  // --- Login log helpers ---

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

  private async logLoginAttemptByEmail(
    _email: string,
    method: string,
    result: string,
    ip: string,
    userAgent?: string,
    failReason?: string,
  ): Promise<void> {
    // When user is not found, we cannot log with userId.
    // Create a log entry with a placeholder userId for audit purposes.
    this.logger.warn(
      `Failed login attempt for unknown email from IP ${ip}: ${failReason}`,
    );
    // We skip DB logging for unknown users to avoid FK constraint issues
    // The rate limiter handles brute force protection at the IP level
    void method;
    void result;
    void userAgent;
    void failReason;
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

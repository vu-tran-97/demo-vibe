import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/filters/business.exception';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async findOrCreateUser(
    firebaseUid: string,
    email: string,
    name?: string,
    picture?: string,
  ) {
    let user = await this.prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          firebaseUid,
          userEmail: email,
          userNm: name || email.split('@')[0],
          userNcnm: `user_${Date.now().toString(36)}`,
          prflImgUrl: picture || null,
          useRoleCd: 'BUYER',
          userSttsCd: 'ACTV',
          rgtrId: 'SYSTEM',
          mdfrId: 'SYSTEM',
        },
      });

      // Send welcome email (non-blocking)
      void this.mailService.sendWelcomeEmail(email, user.userNm);
    }

    return this.formatUserResponse(user);
  }

  async getProfile(userId: number) {
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

    return this.formatUserResponse(user);
  }

  async setRole(userId: number, role: 'BUYER' | 'SELLER') {
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

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { useRoleCd: role, mdfrId: String(userId) },
    });

    return this.formatUserResponse(updated);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
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

    const updateData: Record<string, unknown> = { mdfrId: String(userId) };
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

  async deleteAccount(userId: number) {
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
        mdfrId: String(userId),
      },
    });

    return { message: 'Account deleted successfully' };
  }

  private formatUserResponse(user: {
    id: number;
    firebaseUid: string;
    userEmail: string;
    userNm: string;
    userNcnm: string | null;
    prflImgUrl: string | null;
    useRoleCd: string;
  }) {
    return {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.userEmail,
      name: user.userNm,
      nickname: user.userNcnm,
      profileImageUrl: user.prflImgUrl,
      role: user.useRoleCd,
    };
  }
}

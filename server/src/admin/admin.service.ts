import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/filters/business.exception';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createUser(dto: CreateUserDto, adminId: string) {
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

    const user = await this.prisma.user.create({
      data: {
        userEmail: dto.email,
        userPswd: hashedPassword,
        userNm: dto.name,
        userNcnm: dto.nickname ?? null,
        useRoleCd: dto.role,
        userSttsCd: 'ACTV',
        emailVrfcYn: 'Y',
        lstLgnDt: null,
        rgtrId: adminId,
        mdfrId: adminId,
      },
    });

    this.logger.log(`Admin ${adminId} created user ${user.id} with role ${dto.role}`);

    return this.formatUserResponse(user);
  }

  async listUsers(query: ListUsersQueryDto) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { delYn: 'N' };

    if (query.role) {
      where.useRoleCd = query.role;
    }
    if (query.status) {
      where.userSttsCd = query.status;
    }
    if (query.search) {
      where.OR = [
        { userEmail: { contains: query.search, mode: 'insensitive' } },
        { userNm: { contains: query.search, mode: 'insensitive' } },
        { userNcnm: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { rgstDt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users.map((u) => this.formatUserResponse(u)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId: string) {
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

  async changeRole(targetUserId: string, newRole: string, adminId: string) {
    if (targetUserId === adminId) {
      throw new BusinessException(
        'CANNOT_CHANGE_OWN_ROLE',
        'Cannot change your own role',
        HttpStatus.BAD_REQUEST,
      );
    }

    const targetUser = await this.prisma.user.findFirst({
      where: { id: targetUserId, delYn: 'N' },
    });
    if (!targetUser) {
      throw new BusinessException(
        'USER_NOT_FOUND',
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (targetUser.useRoleCd === 'SUPER_ADMIN') {
      throw new BusinessException(
        'CANNOT_DEMOTE_SUPER_ADMIN',
        'Cannot change the role of a SUPER_ADMIN',
        HttpStatus.FORBIDDEN,
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { useRoleCd: newRole, mdfrId: adminId },
    });

    this.logger.log(
      `Admin ${adminId} changed user ${targetUserId} role from ${targetUser.useRoleCd} to ${newRole}`,
    );

    return this.formatUserResponse(updated);
  }

  async changeStatus(targetUserId: string, newStatus: string, adminId: string) {
    if (targetUserId === adminId) {
      throw new BusinessException(
        'CANNOT_CHANGE_OWN_STATUS',
        'Cannot change your own status',
        HttpStatus.BAD_REQUEST,
      );
    }

    const targetUser = await this.prisma.user.findFirst({
      where: { id: targetUserId, delYn: 'N' },
    });
    if (!targetUser) {
      throw new BusinessException(
        'USER_NOT_FOUND',
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (targetUser.useRoleCd === 'SUPER_ADMIN') {
      throw new BusinessException(
        'CANNOT_SUSPEND_SUPER_ADMIN',
        'Cannot change the status of a SUPER_ADMIN',
        HttpStatus.FORBIDDEN,
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { userSttsCd: newStatus, mdfrId: adminId },
    });

    this.logger.log(
      `Admin ${adminId} changed user ${targetUserId} status from ${targetUser.userSttsCd} to ${newStatus}`,
    );

    return this.formatUserResponse(updated);
  }

  private formatUserResponse(user: {
    id: string;
    userEmail: string;
    userNm: string;
    userNcnm: string | null;
    emailVrfcYn: string;
    prflImgUrl: string | null;
    useRoleCd: string;
    userSttsCd: string;
    lstLgnDt: Date | null;
    rgstDt: Date;
  }) {
    return {
      id: user.id,
      email: user.userEmail,
      name: user.userNm,
      nickname: user.userNcnm,
      emailVerified: user.emailVrfcYn === 'Y',
      profileImageUrl: user.prflImgUrl,
      role: user.useRoleCd,
      status: user.userSttsCd,
      lastLoginAt: user.lstLgnDt,
      createdAt: user.rgstDt,
    };
  }
}

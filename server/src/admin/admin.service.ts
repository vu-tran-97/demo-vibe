import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/filters/business.exception';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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

    const generatedNickname = dto.nickname || `user_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

    const user = await this.prisma.user.create({
      data: {
        userEmail: dto.email,
        userPswd: hashedPassword,
        userNm: dto.name,
        userNcnm: generatedNickname,
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

  async updateUser(userId: string, dto: UpdateUserDto, adminId: string) {
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

    if (dto.nickname) {
      const existingNickname = await this.prisma.user.findFirst({
        where: { userNcnm: dto.nickname, delYn: 'N', id: { not: userId } },
      });
      if (existingNickname) {
        throw new BusinessException(
          'NICKNAME_ALREADY_EXISTS',
          'Nickname is already taken',
          HttpStatus.CONFLICT,
        );
      }
    }

    const updateData: Record<string, unknown> = { mdfrId: adminId };
    if (dto.name !== undefined) updateData.userNm = dto.name;
    if (dto.nickname !== undefined) updateData.userNcnm = dto.nickname;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    this.logger.log(`Admin ${adminId} updated user ${userId} profile`);

    return this.formatUserResponse(updated);
  }

  async resetUserPassword(userId: string, newPassword: string, adminId: string) {
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

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: { userPswd: hashedPassword, mdfrId: adminId },
    });

    this.logger.log(`Admin ${adminId} reset password for user ${userId}`);

    await this.logActivity(
      userId,
      'PASSWORD_RESET',
      null,
      null,
      adminId,
    );

    return { success: true };
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

    await this.logActivity(
      targetUserId,
      'ROLE_CHANGE',
      targetUser.useRoleCd,
      newRole,
      adminId,
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

    await this.logActivity(
      targetUserId,
      'STATUS_CHANGE',
      targetUser.userSttsCd,
      newStatus,
      adminId,
    );

    return this.formatUserResponse(updated);
  }

  async getUserActivity(userId: string, page: number, limit: number) {
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    const [activities, total] = await Promise.all([
      this.prisma.userActivity.findMany({
        where: { userId },
        skip,
        take: safeLimit,
        orderBy: { actvDt: 'desc' },
      }),
      this.prisma.userActivity.count({ where: { userId } }),
    ]);

    return {
      items: activities.map((a) => ({
        id: a.id,
        userId: a.userId,
        type: a.actvTypeCd,
        previousValue: a.prevVal,
        newValue: a.newVal,
        performerId: a.prfmrId,
        clientIp: a.clntIpAddr,
        activityDate: a.actvDt,
      })),
      pagination: {
        page,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async logActivity(
    userId: string,
    type: string,
    prevVal: string | null,
    newVal: string | null,
    performerId: string,
    ip?: string,
  ) {
    await this.prisma.userActivity.create({
      data: {
        userId,
        actvTypeCd: type,
        prevVal,
        newVal,
        prfmrId: performerId,
        clntIpAddr: ip || null,
        actvDt: new Date(),
      },
    });
  }

  async bulkChangeStatus(
    userIds: string[],
    newStatus: string,
    adminId: string,
  ) {
    const results: { userId: string; success: boolean; error?: string }[] = [];

    for (const userId of userIds) {
      try {
        await this.changeStatus(userId, newStatus, adminId);
        results.push({ userId, success: true });
      } catch (error) {
        const message =
          error instanceof BusinessException
            ? error.message
            : 'Unexpected error';
        results.push({ userId, success: false, error: message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return {
      summary: {
        total: userIds.length,
        success: successCount,
        failure: failureCount,
      },
      results,
    };
  }

  async exportUsersAsCsv(query: ListUsersQueryDto): Promise<string> {
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

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { rgstDt: 'desc' },
    });

    const header = 'id,email,name,role,status,registered';
    const rows = users.map((u) => {
      const name = (u.userNm || '').replace(/,/g, ' ');
      const registered = u.rgstDt ? u.rgstDt.toISOString() : '';
      return `${u.id},${u.userEmail},${name},${u.useRoleCd},${u.userSttsCd},${registered}`;
    });

    return [header, ...rows].join('\n');
  }

  async getDashboard() {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, newUsersThisWeek, buyerCount, sellerCount, superAdminCount, recentActivities] =
      await Promise.all([
        this.prisma.user.count({ where: { delYn: 'N' } }),
        this.prisma.user.count({
          where: { delYn: 'N', rgstDt: { gte: oneWeekAgo } },
        }),
        this.prisma.user.count({
          where: { delYn: 'N', useRoleCd: 'BUYER' },
        }),
        this.prisma.user.count({
          where: { delYn: 'N', useRoleCd: 'SELLER' },
        }),
        this.prisma.user.count({
          where: { delYn: 'N', useRoleCd: 'SUPER_ADMIN' },
        }),
        this.prisma.userActivity.findMany({
          take: 10,
          orderBy: { actvDt: 'desc' },
          include: { user: true },
        }),
      ]);

    return {
      totalUsers,
      newUsersThisWeek,
      roleDistribution: {
        BUYER: buyerCount,
        SELLER: sellerCount,
        SUPER_ADMIN: superAdminCount,
      },
      recentActivity: recentActivities.map((a) => {
        const actionType = a.actvTypeCd;
        const userName = a.user?.userNm || a.user?.userNcnm || 'Unknown';
        let description = actionType.replace(/_/g, ' ').toLowerCase();
        if (a.prevVal && a.newVal) {
          description = `${description}: ${a.prevVal} → ${a.newVal}`;
        } else if (a.newVal) {
          description = `${description}: ${a.newVal}`;
        }
        return {
          id: a.id,
          userId: a.userId,
          userName,
          actionType,
          description,
          createdAt: a.actvDt,
        };
      }),
    };
  }

  async getUserSummary(userId: string) {
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

    const [orderCount, productCount, revenueResult] = await Promise.all([
      this.prisma.order.count({ where: { byrId: userId } }),
      this.prisma.product.count({ where: { sellerId: userId } }),
      this.prisma.orderItem.aggregate({
        _sum: { subtotAmt: true },
        where: {
          sllrId: userId,
          order: { ordrSttsCd: 'DELIVERED' },
        },
      }),
    ]);

    const totalRevenue = revenueResult._sum.subtotAmt || 0;

    return {
      ...this.formatUserResponse(user),
      stats: {
        orderCount,
        productCount,
        totalRevenue,
      },
    };
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

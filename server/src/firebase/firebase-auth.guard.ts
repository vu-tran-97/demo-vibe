import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';
import { FirebaseService } from './firebase.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

export interface RequestUser {
  id: number;
  firebaseUid: string;
  email: string;
  role: string;
  name: string;
}

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly firebaseService: FirebaseService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      if (isPublic) {
        return true;
      }
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      const decoded = await this.firebaseService.verifyIdToken(token);

      let user = await this.prisma.user.findUnique({
        where: { firebaseUid: decoded.uid },
      });

      if (!user) {
        // Check if user exists by email (e.g. Firebase UID changed after re-registration)
        const existingByEmail = await this.prisma.user.findUnique({
          where: { userEmail: decoded.email },
        });

        if (existingByEmail) {
          // Link existing account to new Firebase UID
          user = await this.prisma.user.update({
            where: { id: existingByEmail.id },
            data: { firebaseUid: decoded.uid, mdfrId: 'SYSTEM' },
          });
        } else {
          // Auto-create user profile on first login
          user = await this.prisma.user.create({
            data: {
              firebaseUid: decoded.uid,
              userEmail: decoded.email,
              userNm: decoded.name || decoded.email.split('@')[0],
              userNcnm: `user_${Date.now().toString(36)}`,
              useRoleCd: 'BUYER',
              userSttsCd: 'ACTV',
              rgtrId: 'SYSTEM',
              mdfrId: 'SYSTEM',
            },
          });

          // Send welcome email (non-blocking)
          void this.mailService.sendWelcomeEmail(
            user.userEmail,
            user.userNm,
          );
        }
      }

      if (user.delYn === 'Y' || user.userSttsCd === 'INAC') {
        throw new UnauthorizedException('Account is inactive or deleted');
      }

      if (user.userSttsCd === 'SUSP') {
        throw new UnauthorizedException('Account has been suspended');
      }

      // Attach user to request
      request.user = {
        id: user.id,
        firebaseUid: user.firebaseUid,
        email: user.userEmail,
        role: user.useRoleCd,
        name: user.userNm,
      } satisfies RequestUser;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      if (isPublic) {
        // For public routes, silently fail token verification
        return true;
      }

      this.logger.warn(
        `Firebase token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }
}

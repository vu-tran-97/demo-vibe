import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';

describe('AuthController (Integration)', () => {
  let app: INestApplication;

  const mockAuthService = {
    signup: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refresh: jest.fn(),
    verifyEmail: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Signup ---

  describe('POST /api/auth/signup', () => {
    const validSignup = {
      email: 'test@example.com',
      password: 'StrongP@ss1',
      name: 'Test User',
      nickname: 'testuser',
    };

    it('TC-I-001: should return 201 with tokens on valid signup', async () => {
      const serviceResult = {
        user: { id: 'user-1', email: 'test@example.com', name: 'Test User', nickname: 'testuser', emailVerified: false, profileImageUrl: null },
        accessToken: 'access-jwt',
        refreshToken: 'refresh-jwt',
        expiresIn: 900,
      };
      mockAuthService.signup.mockResolvedValue(serviceResult);

      const res = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send(validSignup)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBe('access-jwt');
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(mockAuthService.signup).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com', password: 'StrongP@ss1' }),
        expect.any(String),
        undefined,
      );
    });

    it('TC-U-020: should reject invalid email format', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ ...validSignup, email: 'not-an-email' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(mockAuthService.signup).not.toHaveBeenCalled();
    });

    it('TC-U-021: should reject email exceeding 100 characters', async () => {
      const longEmail = 'a'.repeat(92) + '@test.com'; // 101 chars
      const res = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ ...validSignup, email: longEmail })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('TC-U-030: should reject password shorter than 8 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ ...validSignup, password: 'Ab1!' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('TC-U-031: should reject password without uppercase letter', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ ...validSignup, password: 'abcdefg1!' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('TC-U-032: should reject password without lowercase letter', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ ...validSignup, password: 'ABCDEFG1!' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('TC-U-033: should reject password without number', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ ...validSignup, password: 'Abcdefgh!' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('TC-U-034: should reject password without special character', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ ...validSignup, password: 'Abcdefg1' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('TC-U-040: should reject nickname with special characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ ...validSignup, nickname: 'bad@nick!' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('TC-U-041: should reject nickname shorter than 2 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ ...validSignup, nickname: 'a' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('TC-U-042: should reject nickname exceeding 30 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ ...validSignup, nickname: 'a'.repeat(31) })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should allow signup without optional nickname', async () => {
      mockAuthService.signup.mockResolvedValue({
        user: { id: 'u1', email: 'test@example.com', name: 'Test', nickname: null, emailVerified: false, profileImageUrl: null },
        accessToken: 'at', refreshToken: 'rt', expiresIn: 900,
      });

      const { nickname: _, ...withoutNickname } = validSignup;
      await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send(withoutNickname)
        .expect(201);
    });

    it('should reject extra/unknown fields (forbidNonWhitelisted)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ ...validSignup, admin: true })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject empty body', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({})
        .expect(400);
    });
  });

  // --- Login ---

  describe('POST /api/auth/login', () => {
    const validLogin = { email: 'test@example.com', password: 'StrongP@ss1' };

    it('TC-I-010: should return 200 with tokens on valid login', async () => {
      mockAuthService.login.mockResolvedValue({
        user: { id: 'u1', email: 'test@example.com' },
        accessToken: 'at', refreshToken: 'rt', expiresIn: 900,
      });

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(validLogin)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBe('at');
    });

    it('should reject invalid email in login', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'bad', password: 'x' })
        .expect(400);
    });

    it('should reject empty body for login', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(400);
    });
  });

  // --- Logout ---

  describe('POST /api/auth/logout', () => {
    it('TC-I-030: should return 200 on valid logout', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .send({ refreshToken: 'some-token' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull();
    });

    it('should reject logout without refreshToken', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .send({})
        .expect(400);
    });
  });

  // --- Refresh ---

  describe('POST /api/auth/refresh', () => {
    it('TC-I-020: should return 200 with new tokens on valid refresh', async () => {
      mockAuthService.refresh.mockResolvedValue({
        accessToken: 'new-at', refreshToken: 'new-rt', expiresIn: 900,
      });

      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'old-rt' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBe('new-at');
    });
  });

  // --- Verify Email ---

  describe('POST /api/auth/verify-email', () => {
    it('TC-I-040: should return 200 on valid token', async () => {
      mockAuthService.verifyEmail.mockResolvedValue({ message: 'Email verified successfully' });

      const res = await request(app.getHttpServer())
        .post('/api/auth/verify-email')
        .send({ token: 'valid-token' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Email verified successfully');
    });

    it('should reject verify-email without token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/verify-email')
        .send({})
        .expect(400);
    });
  });

  // --- Forgot Password ---

  describe('POST /api/auth/forgot-password', () => {
    it('TC-I-050: should return 200 with message', async () => {
      mockAuthService.forgotPassword.mockResolvedValue({
        message: 'If an account with that email exists, a reset link has been sent',
      });

      const res = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should reject invalid email format for forgot-password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'not-email' })
        .expect(400);
    });
  });

  // --- Reset Password ---

  describe('POST /api/auth/reset-password', () => {
    it('TC-I-051: should return 200 on valid reset', async () => {
      mockAuthService.resetPassword.mockResolvedValue({ message: 'Password reset successfully' });

      const res = await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ token: 'valid-token', newPassword: 'NewStr0ng!Pass' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should reject weak password in reset', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ token: 'valid-token', newPassword: 'weak' })
        .expect(400);
    });
  });

  // --- Response Format ---

  describe('API Response Format', () => {
    it('should wrap successful responses in { success: true, data }', async () => {
      mockAuthService.verifyEmail.mockResolvedValue({ message: 'ok' });

      const res = await request(app.getHttpServer())
        .post('/api/auth/verify-email')
        .send({ token: 'tok' })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
    });

    it('should wrap validation errors in { success: false, error }', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
  });

  // --- Client IP extraction ---

  describe('Client IP extraction', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      mockAuthService.signup.mockResolvedValue({
        user: { id: 'u1' }, accessToken: 'at', refreshToken: 'rt', expiresIn: 900,
      });

      await request(app.getHttpServer())
        .post('/api/auth/signup')
        .set('x-forwarded-for', '203.0.113.50, 70.41.3.18')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ss1',
          name: 'Test User',
        })
        .expect(201);

      const call = mockAuthService.signup.mock.calls[0];
      expect(call[1]).toBe('203.0.113.50');
    });
  });
});

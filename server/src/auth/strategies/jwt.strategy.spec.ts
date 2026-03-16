import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    const configService = {
      get: jest.fn().mockReturnValue('test-jwt-secret'),
    } as unknown as ConfigService;

    strategy = new JwtStrategy(configService);
  });

  it('should accept valid access token payload', () => {
    const payload: JwtPayload = { sub: 'user-1', email: 'test@example.com', role: 'BUYER', type: 'access' };
    const result = strategy.validate(payload);

    expect(result).toEqual(payload);
  });

  it('should reject refresh token payload', () => {
    const payload: JwtPayload = { sub: 'user-1', email: 'test@example.com', role: 'BUYER', type: 'refresh' };

    expect(() => strategy.validate(payload)).toThrow(UnauthorizedException);
    expect(() => strategy.validate(payload)).toThrow('Invalid token type');
  });

  it('should throw if JWT_SECRET is not configured', () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;

    expect(() => new JwtStrategy(configService)).toThrow('JWT_SECRET is not configured');
  });
});

import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  function createMockContext(): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
        getResponse: jest.fn().mockReturnValue({}),
      }),
      getType: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    } as unknown as ExecutionContext;
  }

  it('should return true for routes marked as @Public()', () => {
    const context = createMockContext();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should call super.canActivate for non-public routes', () => {
    const context = createMockContext();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    // Mock the parent class canActivate to prevent actual passport invocation
    const superCanActivate = jest.fn().mockReturnValue(true);
    Object.getPrototypeOf(Object.getPrototypeOf(guard)).canActivate = superCanActivate;

    const result = guard.canActivate(context);
    expect(superCanActivate).toHaveBeenCalledWith(context);
    expect(result).toBe(true);
  });

  it('should return false when reflector returns undefined (no decorator)', () => {
    const context = createMockContext();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const superCanActivate = jest.fn().mockReturnValue(false);
    Object.getPrototypeOf(Object.getPrototypeOf(guard)).canActivate = superCanActivate;

    const result = guard.canActivate(context);
    expect(result).toBe(false);
  });
});

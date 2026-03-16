import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user?: { role: string }): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  // TC-U-RBAC-001
  it('should allow access when route is public', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key: string) => {
        if (key === IS_PUBLIC_KEY) return true;
        return undefined;
      });

    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(true);
  });

  // TC-U-RBAC-002
  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key: string) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return undefined;
        return undefined;
      });

    const context = createMockContext({ role: 'BUYER' });
    expect(guard.canActivate(context)).toBe(true);
  });

  // TC-U-RBAC-003
  it('should allow access when user has required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key: string) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return ['SUPER_ADMIN'];
        return undefined;
      });

    const context = createMockContext({ role: 'SUPER_ADMIN' });
    expect(guard.canActivate(context)).toBe(true);
  });

  // TC-U-RBAC-004
  it('should deny access when user does not have required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key: string) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return ['SUPER_ADMIN'];
        return undefined;
      });

    const context = createMockContext({ role: 'BUYER' });
    expect(guard.canActivate(context)).toBe(false);
  });

  // TC-U-RBAC-005
  it('should deny access when user has no role', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key: string) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return ['SUPER_ADMIN'];
        return undefined;
      });

    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(false);
  });

  // TC-U-RBAC-006
  it('should allow access when user has one of multiple required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key: string) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return ['SUPER_ADMIN', 'SELLER'];
        return undefined;
      });

    const context = createMockContext({ role: 'SELLER' });
    expect(guard.canActivate(context)).toBe(true);
  });

  // TC-U-RBAC-007
  it('should allow when empty roles array is specified', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key: string) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return [];
        return undefined;
      });

    const context = createMockContext({ role: 'BUYER' });
    expect(guard.canActivate(context)).toBe(true);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/filters/business.exception';

describe('AdminService', () => {
  let service: AdminService;

  const mockPrisma = {
    user: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    userActivity: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const adminId = 'admin-id-123';

  const mockUser = {
    id: 'user-id-456',
    userEmail: 'seller@example.com',
    userNm: 'Seller User',
    userNcnm: 'seller1',
    emailVrfcYn: 'Y',
    prflImgUrl: null,
    useRoleCd: 'SELLER',
    userSttsCd: 'ACTV',
    lstLgnDt: new Date(),
    rgstDt: new Date(),
    delYn: 'N',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    jest.clearAllMocks();
  });

  // ============================================================
  // Create User
  // ============================================================
  describe('createUser', () => {
    const createDto = {
      email: 'newuser@example.com',
      password: 'P@ssw0rd123',
      name: 'New User',
      nickname: 'newuser',
      role: 'SELLER',
    };

    // TC-I-RBAC-001
    it('should create a new user with specified role', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        ...mockUser,
        id: 'new-user-id',
        userEmail: createDto.email,
        userNm: createDto.name,
        userNcnm: createDto.nickname,
        useRoleCd: 'SELLER',
      });

      const result = await service.createUser(createDto, adminId);

      expect(result.email).toBe(createDto.email);
      expect(result.role).toBe('SELLER');
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userEmail: createDto.email,
          useRoleCd: 'SELLER',
          rgtrId: adminId,
        }),
      });
    });

    // TC-E-RBAC-001
    it('should throw EMAIL_ALREADY_EXISTS for duplicate email', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.createUser(createDto, adminId)).rejects.toMatchObject({
        errorCode: 'EMAIL_ALREADY_EXISTS',
      });
    });

    // TC-E-RBAC-002
    it('should throw NICKNAME_ALREADY_EXISTS for duplicate nickname', async () => {
      mockPrisma.user.findFirst
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce({ id: 'existing' }); // nickname check

      await expect(service.createUser(createDto, adminId)).rejects.toThrow(
        BusinessException,
      );
    });
  });

  // ============================================================
  // List Users
  // ============================================================
  describe('listUsers', () => {
    // TC-I-RBAC-002
    it('should return paginated user list', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockUser]);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.listUsers({ page: '1', limit: '20' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].email).toBe(mockUser.userEmail);
      expect(result.pagination.total).toBe(1);
    });

    // TC-I-RBAC-003
    it('should filter by role', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.listUsers({ role: 'SELLER' });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ useRoleCd: 'SELLER' }),
        }),
      );
    });

    // TC-I-RBAC-004
    it('should filter by status', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.listUsers({ status: 'SUSP' });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userSttsCd: 'SUSP' }),
        }),
      );
    });

    // TC-I-RBAC-005
    it('should limit page size to 100', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.listUsers({ limit: '999' });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });
  });

  // ============================================================
  // Get User By Id
  // ============================================================
  describe('getUserById', () => {
    // TC-I-RBAC-006
    it('should return user details', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.getUserById(mockUser.id);

      expect(result.id).toBe(mockUser.id);
      expect(result.role).toBe('SELLER');
    });

    // TC-E-RBAC-003
    it('should throw USER_NOT_FOUND for nonexistent user', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.getUserById('nonexistent')).rejects.toMatchObject({
        errorCode: 'USER_NOT_FOUND',
      });
    });
  });

  // ============================================================
  // Change Role
  // ============================================================
  describe('changeRole', () => {
    // TC-I-RBAC-007
    it('should change user role', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        useRoleCd: 'BUYER',
      });

      const result = await service.changeRole(mockUser.id, 'BUYER', adminId);

      expect(result.role).toBe('BUYER');
    });

    // TC-E-RBAC-004
    it('should throw CANNOT_CHANGE_OWN_ROLE when admin changes own role', async () => {
      await expect(
        service.changeRole(adminId, 'BUYER', adminId),
      ).rejects.toMatchObject({
        errorCode: 'CANNOT_CHANGE_OWN_ROLE',
      });
    });

    // TC-E-RBAC-005
    it('should throw CANNOT_DEMOTE_SUPER_ADMIN', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        ...mockUser,
        useRoleCd: 'SUPER_ADMIN',
      });

      await expect(
        service.changeRole(mockUser.id, 'BUYER', adminId),
      ).rejects.toMatchObject({
        errorCode: 'CANNOT_DEMOTE_SUPER_ADMIN',
      });
    });

    // TC-E-RBAC-006
    it('should throw USER_NOT_FOUND for nonexistent target', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.changeRole('nonexistent', 'BUYER', adminId),
      ).rejects.toMatchObject({
        errorCode: 'USER_NOT_FOUND',
      });
    });
  });

  // ============================================================
  // Change Status
  // ============================================================
  describe('changeStatus', () => {
    // TC-I-RBAC-008
    it('should change user status', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        userSttsCd: 'SUSP',
      });

      const result = await service.changeStatus(mockUser.id, 'SUSP', adminId);

      expect(result.status).toBe('SUSP');
    });

    // TC-E-RBAC-007
    it('should throw CANNOT_CHANGE_OWN_STATUS', async () => {
      await expect(
        service.changeStatus(adminId, 'SUSP', adminId),
      ).rejects.toMatchObject({
        errorCode: 'CANNOT_CHANGE_OWN_STATUS',
      });
    });

    // TC-E-RBAC-008
    it('should throw CANNOT_SUSPEND_SUPER_ADMIN', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        ...mockUser,
        useRoleCd: 'SUPER_ADMIN',
      });

      await expect(
        service.changeStatus(mockUser.id, 'SUSP', adminId),
      ).rejects.toMatchObject({
        errorCode: 'CANNOT_SUSPEND_SUPER_ADMIN',
      });
    });
  });
});

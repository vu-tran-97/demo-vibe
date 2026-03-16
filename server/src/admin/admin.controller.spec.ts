import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

describe('AdminController', () => {
  let controller: AdminController;

  const mockAdminService = {
    createUser: jest.fn(),
    listUsers: jest.fn(),
    getUserById: jest.fn(),
    changeRole: jest.fn(),
    changeStatus: jest.fn(),
  };

  const adminPayload: JwtPayload = {
    sub: 'admin-id-123',
    email: 'admin@astratech.vn',
    role: 'SUPER_ADMIN',
    type: 'access',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: mockAdminService },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should call adminService.createUser with dto and admin id', async () => {
      const dto = { email: 'new@example.com', password: 'P@ss1234', name: 'New', role: 'SELLER' };
      const expected = { id: 'new-id', email: dto.email, role: 'SELLER' };
      mockAdminService.createUser.mockResolvedValue(expected);

      const result = await controller.createUser(dto, { user: adminPayload });

      expect(result).toEqual(expected);
      expect(mockAdminService.createUser).toHaveBeenCalledWith(dto, adminPayload.sub);
    });
  });

  describe('listUsers', () => {
    it('should call adminService.listUsers with query params', async () => {
      const query = { page: '1', limit: '20', role: 'SELLER' };
      const expected = { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
      mockAdminService.listUsers.mockResolvedValue(expected);

      const result = await controller.listUsers(query);

      expect(result).toEqual(expected);
      expect(mockAdminService.listUsers).toHaveBeenCalledWith(query);
    });
  });

  describe('getUserById', () => {
    it('should call adminService.getUserById', async () => {
      const expected = { id: 'user-id', email: 'user@example.com' };
      mockAdminService.getUserById.mockResolvedValue(expected);

      const result = await controller.getUserById('user-id');

      expect(result).toEqual(expected);
    });
  });

  describe('changeRole', () => {
    it('should call adminService.changeRole with id, role, and admin id', async () => {
      const expected = { id: 'user-id', role: 'BUYER' };
      mockAdminService.changeRole.mockResolvedValue(expected);

      const result = await controller.changeRole('user-id', { role: 'BUYER' }, { user: adminPayload });

      expect(result).toEqual(expected);
      expect(mockAdminService.changeRole).toHaveBeenCalledWith('user-id', 'BUYER', adminPayload.sub);
    });
  });

  describe('changeStatus', () => {
    it('should call adminService.changeStatus with id, status, and admin id', async () => {
      const expected = { id: 'user-id', status: 'SUSP' };
      mockAdminService.changeStatus.mockResolvedValue(expected);

      const result = await controller.changeStatus('user-id', { status: 'SUSP' }, { user: adminPayload });

      expect(result).toEqual(expected);
      expect(mockAdminService.changeStatus).toHaveBeenCalledWith('user-id', 'SUSP', adminPayload.sub);
    });
  });
});

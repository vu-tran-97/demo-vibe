import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Request,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { BulkStatusDto } from './dto/bulk-status.dto';
import { ActivityQueryDto } from './dto/activity-query.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('api/admin')
@Roles('SUPER_ADMIN')
export class AdminDashboardController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboard();
  }
}

@Controller('api/admin/users')
@Roles('SUPER_ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  async createUser(
    @Body() dto: CreateUserDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.adminService.createUser(dto, req.user.sub);
  }

  @Get()
  async listUsers(@Query() query: ListUsersQueryDto) {
    return this.adminService.listUsers(query);
  }

  // Static routes must be placed before parameterized /:id routes
  @Get('export')
  async exportUsers(
    @Query() query: ListUsersQueryDto,
    @Res() res: Response,
  ) {
    const csv = await this.adminService.exportUsersAsCsv(query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.send(csv);
  }

  @Post('bulk/status')
  async bulkChangeStatus(
    @Body() dto: BulkStatusDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.adminService.bulkChangeStatus(
      dto.userIds,
      dto.status,
      req.user.sub,
    );
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Get(':id/activity')
  async getUserActivity(
    @Param('id') id: string,
    @Query() query: ActivityQueryDto,
  ) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    return this.adminService.getUserActivity(id, page, limit);
  }

  @Get(':id/summary')
  async getUserSummary(@Param('id') id: string) {
    return this.adminService.getUserSummary(id);
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.adminService.updateUser(id, dto, req.user.sub);
  }

  @Patch(':id/role')
  async changeRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.adminService.changeRole(id, dto.role, req.user.sub);
  }

  @Patch(':id/status')
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.adminService.changeStatus(id, dto.status, req.user.sub);
  }

  @Patch(':id/password')
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.adminService.resetUserPassword(id, dto.password, req.user.sub);
  }
}

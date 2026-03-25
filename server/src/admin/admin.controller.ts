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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { BulkStatusDto } from './dto/bulk-status.dto';
import { ActivityQueryDto } from './dto/activity-query.dto';
import { RequestUser } from '../firebase/firebase-auth.guard';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('api/admin')
@Roles('SUPER_ADMIN')
export class AdminDashboardController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard overview' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async getDashboard() {
    return this.adminService.getDashboard();
  }
}

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('api/admin/users')
@Roles('SUPER_ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user (admin)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async createUser(
    @Body() dto: CreateUserDto,
    @Request() req: { user: RequestUser },
  ) {
    return this.adminService.createUser(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all users with filtering' })
  @ApiResponse({ status: 200, description: 'Users retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listUsers(@Query() query: ListUsersQueryDto) {
    return this.adminService.listUsers(query);
  }

  // Static routes must be placed before parameterized /:id routes
  @Get('export')
  @ApiOperation({ summary: 'Export users as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file downloaded' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Bulk change user statuses' })
  @ApiBody({ type: BulkStatusDto })
  @ApiResponse({ status: 201, description: 'Bulk status update completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async bulkChangeStatus(
    @Body() dto: BulkStatusDto,
    @Request() req: { user: RequestUser },
  ) {
    return this.adminService.bulkChangeStatus(
      dto.userIds,
      dto.status,
      req.user.id,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User details retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get user activity log' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Activity log retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserActivity(
    @Param('id') id: string,
    @Query() query: ActivityQueryDto,
  ) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    return this.adminService.getUserActivity(id, page, limit);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get user summary statistics' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User summary retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserSummary(@Param('id') id: string) {
    return this.adminService.getUserSummary(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user details' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Request() req: { user: RequestUser },
  ) {
    return this.adminService.updateUser(id, dto, req.user.id);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Change user role' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async changeRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @Request() req: { user: RequestUser },
  ) {
    return this.adminService.changeRole(id, dto.role, req.user.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change user status' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: UpdateStatusDto })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Request() req: { user: RequestUser },
  ) {
    return this.adminService.changeStatus(id, dto.status, req.user.id);
  }

  // Password reset removed — Firebase handles authentication
}

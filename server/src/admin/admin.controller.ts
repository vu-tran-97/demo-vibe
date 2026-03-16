import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Request,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

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

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
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
}

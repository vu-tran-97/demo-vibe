import { Module } from '@nestjs/common';
import { AdminController, AdminDashboardController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminDashboardController, AdminController],
  providers: [AdminService],
})
export class AdminModule {}

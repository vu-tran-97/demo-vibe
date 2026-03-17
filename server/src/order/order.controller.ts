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
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('api/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async createOrder(
    @Body() dto: CreateOrderDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.orderService.createOrder(dto, req.user.sub);
  }

  @Get('sales')
  @Roles('SELLER', 'SUPER_ADMIN')
  async listSellerSales(
    @Query() query: ListOrdersQueryDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.orderService.listSellerSales(req.user.sub, query);
  }

  @Get('sales/summary')
  @Roles('SELLER', 'SUPER_ADMIN')
  async getSellerSummary(@Request() req: { user: JwtPayload }) {
    return this.orderService.getSellerSummary(req.user.sub);
  }

  @Get()
  async listBuyerOrders(
    @Query() query: ListOrdersQueryDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.orderService.listBuyerOrders(req.user.sub, query);
  }

  @Get(':id')
  async getOrderById(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.orderService.getOrderById(id, req.user.sub, req.user.role);
  }

  @Patch(':id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.orderService.updateOrderStatus(
      id,
      dto.status,
      dto.reason,
      req.user.sub,
      req.user.role,
    );
  }
}

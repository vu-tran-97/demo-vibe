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
import { Public } from '../auth/decorators/public.decorator';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { PayOrderDto } from './dto/pay-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateItemStatusDto } from './dto/update-item-status.dto';
import { BulkStatusDto } from './dto/bulk-status.dto';
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

  @Public()
  @Post('checkout')
  async checkoutOrder(
    @Body() dto: CheckoutOrderDto,
    @Request() req: { user?: JwtPayload },
  ) {
    const buyerId = req.user?.sub || null;
    return this.orderService.checkoutOrder(dto, buyerId);
  }

  @Patch(':id/pay')
  async payOrder(
    @Param('id') id: string,
    @Body() dto: PayOrderDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.orderService.payOrder(id, dto.paymentMethod, req.user.sub);
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

  @Get('sales/:id')
  @Roles('SELLER', 'SUPER_ADMIN')
  async getSellerOrderDetail(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.orderService.getSellerOrderDetail(id, req.user.sub);
  }

  @Patch('sales/:orderId/items/:itemId/payment')
  @Roles('SELLER', 'SUPER_ADMIN')
  async confirmItemPayment(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.orderService.confirmItemPayment(orderId, itemId, req.user.sub);
  }

  @Patch('sales/:orderId/items/:itemId/status')
  @Roles('SELLER', 'SUPER_ADMIN')
  async updateItemStatus(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateItemStatusDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.orderService.updateItemStatus(
      orderId,
      itemId,
      dto.status,
      dto.trackingNumber,
      req.user.sub,
    );
  }

  @Post('sales/bulk-status')
  @Roles('SELLER', 'SUPER_ADMIN')
  async bulkUpdateStatus(
    @Body() dto: BulkStatusDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.orderService.bulkUpdateItemStatus(
      dto.itemIds,
      dto.status,
      dto.trackingNumber,
      req.user.sub,
    );
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

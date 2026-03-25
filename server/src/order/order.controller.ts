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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
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

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller('api/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createOrder(
    @Body() dto: CreateOrderDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.orderService.createOrder(dto, req.user.sub);
  }

  @Public()
  @Post('checkout')
  @ApiOperation({ summary: 'Guest or authenticated checkout' })
  @ApiBody({ type: CheckoutOrderDto })
  @ApiResponse({ status: 201, description: 'Checkout completed' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async checkoutOrder(
    @Body() dto: CheckoutOrderDto,
    @Request() req: { user?: JwtPayload },
  ) {
    const buyerId = req.user?.sub || null;
    return this.orderService.checkoutOrder(dto, buyerId);
  }

  @Patch(':id/pay')
  @ApiOperation({ summary: 'Pay for an order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({ type: PayOrderDto })
  @ApiResponse({ status: 200, description: 'Payment recorded' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async payOrder(
    @Param('id') id: string,
    @Body() dto: PayOrderDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.orderService.payOrder(id, dto.paymentMethod, req.user.sub);
  }

  @Get('sales')
  @Roles('SELLER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List seller sales orders' })
  @ApiResponse({ status: 200, description: 'Sales orders retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listSellerSales(
    @Query() query: ListOrdersQueryDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.orderService.listSellerSales(req.user.sub, query);
  }

  @Get('sales/summary')
  @Roles('SELLER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get seller sales summary' })
  @ApiResponse({ status: 200, description: 'Sales summary retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSellerSummary(@Request() req: { user: JwtPayload }) {
    return this.orderService.getSellerSummary(req.user.sub);
  }

  @Get('sales/:id')
  @Roles('SELLER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get seller order detail' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order detail retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getSellerOrderDetail(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.orderService.getSellerOrderDetail(id, req.user.sub);
  }

  @Patch('sales/:orderId/items/:itemId/payment')
  @Roles('SELLER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Confirm item payment' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiParam({ name: 'itemId', description: 'Item ID' })
  @ApiResponse({ status: 200, description: 'Payment confirmed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order or item not found' })
  async confirmItemPayment(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.orderService.confirmItemPayment(orderId, itemId, req.user.sub);
  }

  @Patch('sales/:orderId/items/:itemId/status')
  @Roles('SELLER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update order item status' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiParam({ name: 'itemId', description: 'Item ID' })
  @ApiBody({ type: UpdateItemStatusDto })
  @ApiResponse({ status: 200, description: 'Item status updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order or item not found' })
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
  @ApiOperation({ summary: 'Bulk update item statuses' })
  @ApiBody({ type: BulkStatusDto })
  @ApiResponse({ status: 201, description: 'Bulk status update completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'List buyer orders' })
  @ApiResponse({ status: 200, description: 'Buyer orders retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listBuyerOrders(
    @Query() query: ListOrdersQueryDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.orderService.listBuyerOrders(req.user.sub, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order details retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderById(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.orderService.getOrderById(id, req.user.sub, req.user.role);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
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

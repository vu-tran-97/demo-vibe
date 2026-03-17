import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/filters/business.exception';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createOrder(dto: CreateOrderDto, buyerId: string) {
    // Validate all products and calculate totals
    const orderItems: {
      prdId: string;
      sllrId: string;
      prdNm: string;
      prdImgUrl: string;
      unitPrc: number;
      ordrQty: number;
      subtotAmt: number;
    }[] = [];

    for (const item of dto.items) {
      const product = await this.prisma.product.findFirst({
        where: { id: item.productId, delYn: 'N' },
      });

      if (!product) {
        throw new BusinessException(
          'PRODUCT_NOT_FOUND',
          `Product ${item.productId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      if (product.prdSttsCd !== 'ACTV') {
        throw new BusinessException(
          'PRODUCT_NOT_ACTIVE',
          `Product "${product.prdNm}" is not available for purchase`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (product.stckQty < item.quantity) {
        throw new BusinessException(
          'INSUFFICIENT_STOCK',
          `Product "${product.prdNm}" has insufficient stock (available: ${product.stckQty}, requested: ${item.quantity})`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const unitPrice = product.prdSalePrc ?? product.prdPrc;
      const subtotal = unitPrice * item.quantity;

      orderItems.push({
        prdId: product.id,
        sllrId: product.sellerId,
        prdNm: product.prdNm,
        prdImgUrl: product.prdImgUrl,
        unitPrc: unitPrice,
        ordrQty: item.quantity,
        subtotAmt: subtotal,
      });
    }

    const totalAmount = orderItems.reduce((sum, i) => sum + i.subtotAmt, 0);

    // Generate order number: VB-YYYY-MMDD-NNN
    const orderNumber = await this.generateOrderNumber();

    // Create order
    const order = await this.prisma.order.create({
      data: {
        ordrNo: orderNumber,
        byrId: buyerId,
        ordrTotAmt: totalAmount,
        ordrSttsCd: 'PENDING',
        shipAddr: dto.shipAddr,
        shipRcvrNm: dto.shipRcvrNm,
        shipTelno: dto.shipTelno,
        shipMemo: dto.shipMemo,
        rgtrId: buyerId,
        mdfrId: buyerId,
      },
    });

    // Create order items
    for (const item of orderItems) {
      await this.prisma.orderItem.create({
        data: {
          ordrId: order.id,
          prdId: item.prdId,
          sllrId: item.sllrId,
          prdNm: item.prdNm,
          prdImgUrl: item.prdImgUrl,
          unitPrc: item.unitPrc,
          ordrQty: item.ordrQty,
          subtotAmt: item.subtotAmt,
          rgtrId: buyerId,
          mdfrId: buyerId,
        },
      });
    }

    // Deduct stock for each product
    for (const item of orderItems) {
      const updated = await this.prisma.product.update({
        where: { id: item.prdId },
        data: {
          stckQty: { decrement: item.ordrQty },
          soldCnt: { increment: item.ordrQty },
        },
      });

      // Auto-set to SOLD_OUT if stock reaches 0
      if (updated.stckQty <= 0) {
        await this.prisma.product.update({
          where: { id: item.prdId },
          data: { prdSttsCd: 'SOLD_OUT' },
        });
      }
    }

    // Create initial status history entry
    await this.prisma.orderStatusHistory.create({
      data: {
        ordrId: order.id,
        prevSttsCd: '',
        newSttsCd: 'PENDING',
        chngRsn: 'Order created',
        chngrId: buyerId,
        chngDt: new Date(),
        rgtrId: buyerId,
      },
    });

    this.logger.log(`Order ${orderNumber} created by buyer ${buyerId}`);

    return this.getOrderById(order.id, buyerId, 'BUYER');
  }

  async listBuyerOrders(buyerId: string, query: ListOrdersQueryDto) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { byrId: buyerId, delYn: 'N' };

    if (query.status) {
      where.ordrSttsCd = query.status;
    }

    if (query.startDate || query.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (query.startDate) {
        dateFilter.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        dateFilter.lte = new Date(query.endDate);
      }
      where.rgstDt = dateFilter;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { rgstDt: 'desc' },
        include: {
          items: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: orders.map((order) => this.formatOrderResponse(order)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(orderId: string, userId: string, userRole: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, delYn: 'N' },
      include: {
        items: true,
        statusHistory: {
          orderBy: { chngDt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new BusinessException(
        'ORDER_NOT_FOUND',
        'Order not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Authorization check: buyer owns order, seller has items, or SUPER_ADMIN
    if (userRole !== 'SUPER_ADMIN') {
      const isBuyer = order.byrId === userId;
      const isSeller = order.items.some((item) => item.sllrId === userId);

      if (!isBuyer && !isSeller) {
        throw new BusinessException(
          'ORDER_ACCESS_DENIED',
          'You do not have access to this order',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    return this.formatOrderDetailResponse(order);
  }

  async updateOrderStatus(
    orderId: string,
    newStatus: string,
    reason: string | undefined,
    userId: string,
    userRole: string,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, delYn: 'N' },
      include: { items: true },
    });

    if (!order) {
      throw new BusinessException(
        'ORDER_NOT_FOUND',
        'Order not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const currentStatus = order.ordrSttsCd;

    // Validate transition based on role
    if (userRole === 'SUPER_ADMIN') {
      // SUPER_ADMIN can make any valid transition
      this.validateStatusTransition(currentStatus, newStatus);
    } else if (userRole === 'BUYER' || order.byrId === userId) {
      // Buyer can only CANCEL if status is PENDING
      if (newStatus !== 'CANCELLED') {
        throw new BusinessException(
          'INVALID_STATUS_TRANSITION',
          'Buyer can only cancel orders',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (currentStatus !== 'PENDING') {
        throw new BusinessException(
          'INVALID_STATUS_TRANSITION',
          'Order can only be cancelled when status is PENDING',
          HttpStatus.BAD_REQUEST,
        );
      }
    } else if (userRole === 'SELLER') {
      // Seller can change PENDING->SHIPPED, SHIPPED->DELIVERED
      const sellerHasItems = order.items.some((item) => item.sllrId === userId);
      if (!sellerHasItems) {
        throw new BusinessException(
          'ORDER_ACCESS_DENIED',
          'You do not have items in this order',
          HttpStatus.FORBIDDEN,
        );
      }

      const allowedSellerTransitions: Record<string, string[]> = {
        PENDING: ['SHIPPED'],
        SHIPPED: ['DELIVERED'],
      };

      const allowed = allowedSellerTransitions[currentStatus] || [];
      if (!allowed.includes(newStatus)) {
        throw new BusinessException(
          'INVALID_STATUS_TRANSITION',
          `Seller cannot change status from ${currentStatus} to ${newStatus}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    } else {
      throw new BusinessException(
        'ORDER_ACCESS_DENIED',
        'You do not have permission to update this order',
        HttpStatus.FORBIDDEN,
      );
    }

    // If cancelling, restore stock
    if (newStatus === 'CANCELLED') {
      for (const item of order.items) {
        const updated = await this.prisma.product.update({
          where: { id: item.prdId },
          data: {
            stckQty: { increment: item.ordrQty },
            soldCnt: { decrement: item.ordrQty },
          },
        });

        // Restore from SOLD_OUT if stock is now positive
        if (updated.prdSttsCd === 'SOLD_OUT' && updated.stckQty > 0) {
          await this.prisma.product.update({
            where: { id: item.prdId },
            data: { prdSttsCd: 'ACTV' },
          });
        }
      }
    }

    // Update order status
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        ordrSttsCd: newStatus,
        mdfrId: userId,
      },
    });

    // Record status history
    await this.prisma.orderStatusHistory.create({
      data: {
        ordrId: orderId,
        prevSttsCd: currentStatus,
        newSttsCd: newStatus,
        chngRsn: reason,
        chngrId: userId,
        chngDt: new Date(),
        rgtrId: userId,
      },
    });

    this.logger.log(
      `Order ${order.ordrNo} status changed from ${currentStatus} to ${newStatus} by user ${userId}`,
    );

    return this.getOrderById(orderId, userId, userRole);
  }

  async listSellerSales(sellerId: string, query: ListOrdersQueryDto) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { sllrId: sellerId, delYn: 'N' };

    // Build order-level filters
    const orderWhere: Record<string, unknown> = { delYn: 'N' };
    if (query.status) {
      orderWhere.ordrSttsCd = query.status;
    }
    if (query.startDate || query.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (query.startDate) {
        dateFilter.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        dateFilter.lte = new Date(query.endDate);
      }
      orderWhere.rgstDt = dateFilter;
    }

    if (Object.keys(orderWhere).length > 1) {
      where.order = orderWhere;
    }

    const [orderItems, total] = await Promise.all([
      this.prisma.orderItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { rgstDt: 'desc' },
        include: {
          order: true,
        },
      }),
      this.prisma.orderItem.count({ where }),
    ]);

    return {
      items: orderItems.map((item) => ({
        id: item.id,
        orderId: item.ordrId,
        orderNo: item.order.ordrNo,
        orderStatus: item.order.ordrSttsCd,
        productId: item.prdId,
        productName: item.prdNm,
        productImageUrl: item.prdImgUrl,
        unitPrice: item.unitPrc,
        quantity: item.ordrQty,
        subtotalAmount: item.subtotAmt,
        buyerId: item.order.byrId,
        shipAddr: item.order.shipAddr,
        shipReceiverName: item.order.shipRcvrNm,
        shipPhone: item.order.shipTelno,
        orderedAt: item.order.rgstDt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSellerSummary(sellerId: string) {
    // Get all delivered order items for this seller
    const deliveredItems = await this.prisma.orderItem.findMany({
      where: {
        sllrId: sellerId,
        delYn: 'N',
        order: {
          ordrSttsCd: 'DELIVERED',
          delYn: 'N',
        },
      },
      include: {
        order: true,
      },
    });

    // Total revenue
    const totalRevenue = deliveredItems.reduce(
      (sum, item) => sum + item.subtotAmt,
      0,
    );

    // Unique delivered orders
    const uniqueOrderIds = new Set(deliveredItems.map((item) => item.ordrId));
    const totalOrders = uniqueOrderIds.size;

    // Monthly breakdown
    const monthlyMap = new Map<
      string,
      { revenue: number; orderCount: number; itemCount: number }
    >();
    for (const item of deliveredItems) {
      const month = item.order.rgstDt.toISOString().slice(0, 7); // YYYY-MM
      const existing = monthlyMap.get(month) || {
        revenue: 0,
        orderCount: 0,
        itemCount: 0,
      };
      existing.revenue += item.subtotAmt;
      existing.itemCount += item.ordrQty;
      monthlyMap.set(month, existing);
    }

    // Count unique orders per month
    const monthlyOrderIds = new Map<string, Set<string>>();
    for (const item of deliveredItems) {
      const month = item.order.rgstDt.toISOString().slice(0, 7);
      if (!monthlyOrderIds.has(month)) {
        monthlyOrderIds.set(month, new Set());
      }
      monthlyOrderIds.get(month)!.add(item.ordrId);
    }

    const monthlyBreakdown = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        orderCount: monthlyOrderIds.get(month)?.size || 0,
        itemCount: data.itemCount,
      }))
      .sort((a, b) => b.month.localeCompare(a.month));

    return {
      totalRevenue,
      totalOrders,
      totalItemsSold: deliveredItems.reduce(
        (sum, item) => sum + item.ordrQty,
        0,
      ),
      monthlyBreakdown,
    };
  }

  private async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const prefix = `VB-${yyyy}-${mm}${dd}`;

    // Count today's orders to get sequential number
    const startOfDay = new Date(yyyy, now.getMonth(), now.getDate());
    const endOfDay = new Date(yyyy, now.getMonth(), now.getDate() + 1);

    const todayCount = await this.prisma.order.count({
      where: {
        rgstDt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    const sequence = String(todayCount + 1).padStart(3, '0');
    return `${prefix}-${sequence}`;
  }

  private validateStatusTransition(current: string, next: string) {
    const validTransitions: Record<string, string[]> = {
      PENDING: ['PAID', 'SHIPPED', 'CANCELLED'],
      PAID: ['SHIPPED', 'CANCELLED', 'REFUNDED'],
      SHIPPED: ['DELIVERED', 'REFUNDED'],
      DELIVERED: ['REFUNDED'],
      CANCELLED: [],
      REFUNDED: [],
    };

    const allowed = validTransitions[current] || [];
    if (!allowed.includes(next)) {
      throw new BusinessException(
        'INVALID_STATUS_TRANSITION',
        `Cannot transition from ${current} to ${next}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private formatOrderResponse(order: {
    id: string;
    ordrNo: string;
    byrId: string;
    ordrTotAmt: number;
    ordrSttsCd: string;
    shipAddr: string | null;
    shipRcvrNm: string | null;
    shipTelno: string | null;
    shipMemo: string | null;
    trckgNo: string | null;
    rgstDt: Date;
    items: {
      id: string;
      prdId: string;
      prdNm: string;
      prdImgUrl: string;
      unitPrc: number;
      ordrQty: number;
      subtotAmt: number;
    }[];
  }) {
    return {
      id: order.id,
      orderNo: order.ordrNo,
      buyerId: order.byrId,
      totalAmount: order.ordrTotAmt,
      status: order.ordrSttsCd,
      shippingAddress: order.shipAddr,
      receiverName: order.shipRcvrNm,
      receiverPhone: order.shipTelno,
      shippingMemo: order.shipMemo,
      trackingNumber: order.trckgNo,
      createdAt: order.rgstDt,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.prdId,
        productName: item.prdNm,
        productImageUrl: item.prdImgUrl,
        unitPrice: item.unitPrc,
        quantity: item.ordrQty,
        subtotalAmount: item.subtotAmt,
      })),
    };
  }

  private formatOrderDetailResponse(order: {
    id: string;
    ordrNo: string;
    byrId: string;
    ordrTotAmt: number;
    ordrSttsCd: string;
    shipAddr: string | null;
    shipRcvrNm: string | null;
    shipTelno: string | null;
    shipMemo: string | null;
    trckgNo: string | null;
    rgstDt: Date;
    items: {
      id: string;
      prdId: string;
      sllrId: string;
      prdNm: string;
      prdImgUrl: string;
      unitPrc: number;
      ordrQty: number;
      subtotAmt: number;
    }[];
    statusHistory: {
      id: string;
      prevSttsCd: string;
      newSttsCd: string;
      chngRsn: string | null;
      chngrId: string;
      chngDt: Date;
    }[];
  }) {
    return {
      id: order.id,
      orderNo: order.ordrNo,
      buyerId: order.byrId,
      totalAmount: order.ordrTotAmt,
      status: order.ordrSttsCd,
      shippingAddress: order.shipAddr,
      receiverName: order.shipRcvrNm,
      receiverPhone: order.shipTelno,
      shippingMemo: order.shipMemo,
      trackingNumber: order.trckgNo,
      createdAt: order.rgstDt,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.prdId,
        sellerId: item.sllrId,
        productName: item.prdNm,
        productImageUrl: item.prdImgUrl,
        unitPrice: item.unitPrc,
        quantity: item.ordrQty,
        subtotalAmount: item.subtotAmt,
      })),
      statusHistory: order.statusHistory.map((h) => ({
        id: h.id,
        previousStatus: h.prevSttsCd,
        newStatus: h.newSttsCd,
        reason: h.chngRsn,
        changedBy: h.chngrId,
        changedAt: h.chngDt,
      })),
    };
  }
}

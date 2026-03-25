import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/filters/business.exception';
import { CreateOrderDto } from './dto/create-order.dto';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { MailService } from '../mail/mail.service';
import { OrderConfirmData } from '../mail/templates/order-confirm';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async createOrder(dto: CreateOrderDto, buyerId: number) {
    // Validate all products and calculate totals
    const orderItems: {
      prdId: number;
      sllrId: number;
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
        rgtrId: String(buyerId),
        mdfrId: String(buyerId),
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
          itemSttsCd: 'PENDING',
          rgtrId: String(buyerId),
          mdfrId: String(buyerId),
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
        rgtrId: String(buyerId),
      },
    });

    this.logger.log(`Order ${orderNumber} created by buyer ${buyerId}`);

    // Send order confirmation email (non-blocking)
    void this.sendOrderConfirmEmail(buyerId, orderNumber, orderItems, totalAmount, dto);

    return this.getOrderById(order.id, buyerId, 'BUYER');
  }

  private async sendOrderConfirmEmail(
    buyerId: number,
    orderNumber: string,
    orderItems: { prdNm: string; prdImgUrl: string; unitPrc: number; ordrQty: number; subtotAmt: number }[],
    totalAmount: number,
    dto: CreateOrderDto,
  ): Promise<void> {
    try {
      const buyer = await this.prisma.user.findUnique({ where: { id: buyerId } });
      if (!buyer) return;

      const orderData: OrderConfirmData = {
        orderNumber,
        items: orderItems.map((i) => ({
          prdNm: i.prdNm,
          prdImgUrl: i.prdImgUrl,
          unitPrc: i.unitPrc,
          ordrQty: i.ordrQty,
          subtotAmt: i.subtotAmt,
        })),
        totalAmount,
        shippingAddress: dto.shipAddr,
        recipientName: dto.shipRcvrNm,
      };

      await this.mailService.sendOrderConfirmation(
        buyer.userEmail,
        buyer.userNm,
        orderData,
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send order confirmation email: ${msg}`);
    }
  }

  async checkoutOrder(dto: CheckoutOrderDto, buyerId: number | null) {
    const isGuest = !buyerId;
    // For guest orders, byrId=0 is used as placeholder (system user)
    const effectiveBuyerId: number = buyerId || 0;
    // Validate all products and calculate totals
    const orderItems: {
      prdId: number;
      sllrId: number;
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
    const orderNumber = await this.generateOrderNumber();

    // Create order with payment method
    const order = await this.prisma.order.create({
      data: {
        ordrNo: orderNumber,
        byrId: effectiveBuyerId,
        ordrTotAmt: totalAmount,
        ordrSttsCd: 'PENDING',
        payMthdCd: dto.paymentMethod,
        shipAddr: dto.shipAddr,
        shipRcvrNm: dto.shipRcvrNm,
        shipTelno: dto.shipTelno,
        shipMemo: dto.shipMemo,
        rgtrId: String(effectiveBuyerId),
        mdfrId: String(effectiveBuyerId),
      },
    });

    // Create order items with PENDING item status
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
          itemSttsCd: 'PENDING',
          rgtrId: String(effectiveBuyerId),
          mdfrId: String(effectiveBuyerId),
        },
      });
    }

    // Deduct stock
    for (const item of orderItems) {
      const updated = await this.prisma.product.update({
        where: { id: item.prdId },
        data: {
          stckQty: { decrement: item.ordrQty },
          soldCnt: { increment: item.ordrQty },
        },
      });

      if (updated.stckQty <= 0) {
        await this.prisma.product.update({
          where: { id: item.prdId },
          data: { prdSttsCd: 'SOLD_OUT' },
        });
      }
    }

    // Record initial status history
    await this.prisma.orderStatusHistory.create({
      data: {
        ordrId: order.id,
        prevSttsCd: '',
        newSttsCd: 'PENDING',
        chngRsn: isGuest
          ? `Guest order created with payment method: ${dto.paymentMethod}`
          : `Order created with payment method: ${dto.paymentMethod}`,
        chngrId: effectiveBuyerId,
        chngDt: new Date(),
        rgtrId: String(effectiveBuyerId),
      },
    });

    this.logger.log(
      `Checkout order ${orderNumber} created by ${isGuest ? 'guest' : `buyer ${effectiveBuyerId}`} with ${dto.paymentMethod}`,
    );

    // Send order confirmation email (non-blocking)
    if (!isGuest) {
      try {
        const buyer = await this.prisma.user.findUnique({ where: { id: effectiveBuyerId } });
        if (buyer) {
          const orderData = {
            orderNumber,
            items: orderItems.map((i) => ({
              prdNm: i.prdNm,
              prdImgUrl: i.prdImgUrl,
              unitPrc: i.unitPrc,
              ordrQty: i.ordrQty,
              subtotAmt: i.subtotAmt,
            })),
            totalAmount,
            shippingAddress: dto.shipAddr,
            recipientName: dto.shipRcvrNm,
          };
          void this.mailService.sendOrderConfirmation(buyer.userEmail, buyer.userNm, orderData);
        }
      } catch (emailError: unknown) {
        const msg = emailError instanceof Error ? emailError.message : 'Unknown error';
        this.logger.error(`Failed to send checkout confirmation email: ${msg}`);
      }
    }

    // For guest orders, return formatted response directly (no ownership check needed)
    if (isGuest) {
      return this.formatGuestOrderResponse(order.id);
    }

    return this.getOrderById(order.id, effectiveBuyerId, 'BUYER');
  }

  async payOrder(orderId: number, paymentMethod: string, buyerId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, delYn: 'N' },
    });

    if (!order) {
      throw new BusinessException(
        'ORDER_NOT_FOUND',
        'Order not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Only the buyer who owns the order can pay
    if (order.byrId !== buyerId) {
      throw new BusinessException(
        'ORDER_ACCESS_DENIED',
        'You do not have access to this order',
        HttpStatus.FORBIDDEN,
      );
    }

    // Only PENDING orders can be paid
    if (order.ordrSttsCd !== 'PENDING') {
      throw new BusinessException(
        'INVALID_STATUS_TRANSITION',
        `Cannot pay an order with status ${order.ordrSttsCd}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Update order to PAID
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        ordrSttsCd: 'PAID',
        payMthdCd: paymentMethod,
        mdfrId: String(buyerId),
      },
    });

    // Sync item-level payment status
    const itemsToSync = await this.prisma.orderItem.findMany({
      where: { ordrId: orderId },
      select: { id: true, payStts: true },
    });
    for (const it of itemsToSync) {
      if (it.payStts !== 'PAID') {
        await this.prisma.orderItem.update({
          where: { id: it.id },
          data: { payStts: 'PAID', mdfrId: String(buyerId) },
        });
      }
    }

    // Record status history
    await this.prisma.orderStatusHistory.create({
      data: {
        ordrId: orderId,
        prevSttsCd: 'PENDING',
        newSttsCd: 'PAID',
        chngRsn: `Payment via ${paymentMethod}`,
        chngrId: buyerId,
        chngDt: new Date(),
        rgtrId: String(buyerId),
      },
    });

    this.logger.log(
      `Order ${order.ordrNo} paid by buyer ${buyerId} via ${paymentMethod}`,
    );

    return this.getOrderById(orderId, buyerId, 'BUYER');
  }

  async confirmItemPayment(orderId: number, itemId: number, sellerId: number) {
    const item = await this.prisma.orderItem.findFirst({
      where: { id: itemId, ordrId: orderId, delYn: 'N' },
      include: { order: true },
    });

    if (!item) {
      throw new BusinessException(
        'ORDER_ITEM_NOT_FOUND',
        'Order item not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (item.sllrId !== sellerId) {
      throw new BusinessException(
        'ORDER_ACCESS_DENIED',
        'You do not have access to this order item',
        HttpStatus.FORBIDDEN,
      );
    }

    if (item.payStts === 'PAID') {
      throw new BusinessException(
        'ALREADY_PAID',
        'Payment already confirmed for this item',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.orderItem.update({
      where: { id: itemId },
      data: { payStts: 'PAID', mdfrId: String(sellerId) },
    });

    // Record in status history
    await this.prisma.orderStatusHistory.create({
      data: {
        ordrId: orderId,
        prevSttsCd: 'UNPAID',
        newSttsCd: 'PAID',
        chngRsn: `Payment confirmed by seller for "${item.prdNm}"`,
        chngrId: sellerId,
        chngDt: new Date(),
        rgtrId: String(sellerId),
      },
    });

    // If all items are paid, update order status to PAID
    const allItems = await this.prisma.orderItem.findMany({
      where: { ordrId: orderId, delYn: 'N' },
    });
    const allPaid = allItems.every((i) => i.payStts === 'PAID' || i.id === itemId);
    if (allPaid && item.order.ordrSttsCd === 'PENDING') {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { ordrSttsCd: 'PAID', mdfrId: String(sellerId) },
      });
    }

    this.logger.log(`Seller ${sellerId} confirmed payment for item ${itemId} in order ${orderId}`);

    return { success: true, message: 'Payment confirmed' };
  }

  async updateItemStatus(
    orderId: number,
    itemId: number,
    newStatus: string,
    trackingNumber: string | undefined,
    sellerId: number,
  ) {
    const item = await this.prisma.orderItem.findFirst({
      where: { id: itemId, ordrId: orderId, delYn: 'N' },
      include: { order: true },
    });

    if (!item) {
      throw new BusinessException(
        'ORDER_ITEM_NOT_FOUND',
        'Order item not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Verify seller owns this item
    if (item.sllrId !== sellerId) {
      throw new BusinessException(
        'ORDER_ACCESS_DENIED',
        'You do not have access to this order item',
        HttpStatus.FORBIDDEN,
      );
    }

    // Validate item status transition
    const currentStatus = item.itemSttsCd;
    this.validateItemStatusTransition(currentStatus, newStatus);

    // Update item status and optionally tracking number
    const updateData: Record<string, unknown> = {
      itemSttsCd: newStatus,
      mdfrId: String(sellerId),
    };

    if (trackingNumber !== undefined && newStatus === 'SHIPPED') {
      updateData.trckgNo = trackingNumber;
    }

    await this.prisma.orderItem.update({
      where: { id: itemId },
      data: updateData,
    });

    // Record status history (using order ID for the history entry)
    await this.prisma.orderStatusHistory.create({
      data: {
        ordrId: orderId,
        prevSttsCd: currentStatus,
        newSttsCd: newStatus,
        chngRsn: `Item "${item.prdNm}" status updated${trackingNumber ? ` (tracking: ${trackingNumber})` : ''}`,
        chngrId: sellerId,
        chngDt: new Date(),
        rgtrId: String(sellerId),
      },
    });

    this.logger.log(
      `Order item ${itemId} status changed from ${currentStatus} to ${newStatus} by seller ${sellerId}`,
    );

    // Return updated item with order info
    const updatedItem = await this.prisma.orderItem.findFirst({
      where: { id: itemId },
      include: { order: true },
    });

    return {
      id: updatedItem!.id,
      orderId: updatedItem!.ordrId,
      orderNo: updatedItem!.order.ordrNo,
      productId: updatedItem!.prdId,
      productName: updatedItem!.prdNm,
      productImageUrl: updatedItem!.prdImgUrl,
      unitPrice: updatedItem!.unitPrc,
      quantity: updatedItem!.ordrQty,
      subtotalAmount: updatedItem!.subtotAmt,
      itemStatus: updatedItem!.itemSttsCd,
      trackingNumber: updatedItem!.trckgNo,
    };
  }

  async bulkUpdateItemStatus(
    itemIds: string[],
    newStatus: string,
    trackingNumber: string | undefined,
    sellerId: number,
  ) {
    let updated = 0;
    let failed = 0;

    for (const rawItemId of itemIds) {
      const itemId = Number(rawItemId);
      try {
        const item = await this.prisma.orderItem.findFirst({
          where: { id: itemId, delYn: 'N' },
        });

        if (!item) {
          failed++;
          continue;
        }

        // Check ownership
        if (item.sllrId !== sellerId) {
          failed++;
          continue;
        }

        // Validate transition
        const validTransitions: Record<string, string[]> = {
          PENDING: ['CONFIRMED'],
          CONFIRMED: ['SHIPPED'],
          SHIPPED: ['DELIVERED'],
          DELIVERED: [],
        };

        const allowed = validTransitions[item.itemSttsCd] || [];
        if (!allowed.includes(newStatus)) {
          failed++;
          continue;
        }

        const updateData: Record<string, unknown> = {
          itemSttsCd: newStatus,
          mdfrId: String(sellerId),
        };

        if (trackingNumber !== undefined && newStatus === 'SHIPPED') {
          updateData.trckgNo = trackingNumber;
        }

        await this.prisma.orderItem.update({
          where: { id: itemId },
          data: updateData,
        });

        // Record status history
        await this.prisma.orderStatusHistory.create({
          data: {
            ordrId: item.ordrId,
            prevSttsCd: item.itemSttsCd,
            newSttsCd: newStatus,
            chngRsn: `Bulk update: item "${item.prdNm}"${trackingNumber ? ` (tracking: ${trackingNumber})` : ''}`,
            chngrId: sellerId,
            chngDt: new Date(),
            rgtrId: String(sellerId),
          },
        });

        updated++;
      } catch {
        failed++;
      }
    }

    this.logger.log(
      `Bulk status update by seller ${sellerId}: ${updated} updated, ${failed} failed`,
    );

    return { updated, failed };
  }

  async getSellerOrderDetail(orderId: number, sellerId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, delYn: 'N' },
      include: {
        items: {
          where: { delYn: 'N' },
        },
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

    // Check that seller has items in this order
    const sellerItems = order.items.filter((item) => item.sllrId === sellerId);
    if (sellerItems.length === 0) {
      throw new BusinessException(
        'ORDER_ACCESS_DENIED',
        'You do not have items in this order',
        HttpStatus.FORBIDDEN,
      );
    }

    // Get buyer info
    const buyer = await this.prisma.user.findFirst({
      where: { id: order.byrId },
      select: { id: true, userNm: true, userEmail: true },
    });

    return {
      id: order.id,
      orderNo: order.ordrNo,
      buyer: buyer
        ? { id: buyer.id, name: buyer.userNm, email: buyer.userEmail }
        : null,
      totalAmount: order.ordrTotAmt,
      status: order.ordrSttsCd,
      paymentMethod: order.payMthdCd,
      shippingAddress: order.shipAddr,
      receiverName: order.shipRcvrNm,
      receiverPhone: order.shipTelno,
      shippingMemo: order.shipMemo,
      createdAt: order.rgstDt,
      items: sellerItems.map((item) => ({
        id: item.id,
        productId: item.prdId,
        productName: item.prdNm,
        productImageUrl: item.prdImgUrl,
        unitPrice: item.unitPrc,
        quantity: item.ordrQty,
        subtotalAmount: item.subtotAmt,
        itemStatus: item.itemSttsCd,
        trackingNumber: item.trckgNo,
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

  async listBuyerOrders(buyerId: number, query: ListOrdersQueryDto) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { byrId: buyerId, delYn: 'N' };

    if (query.status) {
      where.ordrSttsCd = query.status;
    }

    // Filter by item-level fulfillment status
    if (query.itemStatus) {
      where.items = { some: { itemSttsCd: query.itemStatus, delYn: 'N' } };
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

    // If filtering by payment status, we need post-query filtering
    // because MongoDB may have documents without the payStts field
    if (query.paymentStatus) {
      const allOrders = await this.prisma.order.findMany({
        where,
        orderBy: { rgstDt: 'desc' },
        include: { items: true },
      });

      const filtered = allOrders.filter((order) => {
        const targetPaid = query.paymentStatus === 'PAID';
        return order.items.some((item) => {
          const itemPaid = item.payStts === 'PAID';
          return targetPaid ? itemPaid : !itemPaid;
        });
      });

      const total = filtered.length;
      const paged = filtered.slice(skip, skip + limit);

      return {
        items: paged.map((order) => this.formatOrderResponse(order)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
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

  async getOrderById(orderId: number, userId: number, userRole: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, delYn: 'N' },
      include: {
        items: {
          include: {
            seller: { select: { id: true, userNm: true, userNcnm: true } },
          },
        },
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
    orderId: number,
    newStatus: string,
    reason: string | undefined,
    userId: number,
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
        PENDING: ['PAID', 'SHIPPED'],
        PAID: ['SHIPPED'],
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
        mdfrId: String(userId),
      },
    });

    // Sync item-level payment status when order is marked PAID
    if (newStatus === 'PAID') {
      const itemsToSync = await this.prisma.orderItem.findMany({
        where: { ordrId: orderId },
        select: { id: true, payStts: true },
      });
      for (const it of itemsToSync) {
        if (it.payStts !== 'PAID') {
          await this.prisma.orderItem.update({
            where: { id: it.id },
            data: { payStts: 'PAID', mdfrId: String(userId) },
          });
        }
      }
    }

    // Record status history
    await this.prisma.orderStatusHistory.create({
      data: {
        ordrId: orderId,
        prevSttsCd: currentStatus,
        newSttsCd: newStatus,
        chngRsn: reason,
        chngrId: userId,
        chngDt: new Date(),
        rgtrId: String(userId),
      },
    });

    this.logger.log(
      `Order ${order.ordrNo} status changed from ${currentStatus} to ${newStatus} by user ${userId}`,
    );

    return this.getOrderById(orderId, userId, userRole);
  }

  async listSellerSales(sellerId: number, query: ListOrdersQueryDto) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { sllrId: sellerId, delYn: 'N' };

    // Build order-level filters
    const orderWhere: Record<string, unknown> = { delYn: 'N' };
    if (query.status) {
      // Filter by item status instead of order status for seller view
      where.itemSttsCd = query.status;
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
        itemStatus: item.itemSttsCd,
        paymentStatus: item.payStts,
        trackingNumber: item.trckgNo,
        buyerId: item.order.byrId,
        paymentMethod: item.order.payMthdCd,
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

  async getSellerSummary(sellerId: number) {
    // Get all delivered order items for this seller
    const deliveredItems = await this.prisma.orderItem.findMany({
      where: {
        sllrId: sellerId,
        delYn: 'N',
        itemSttsCd: 'DELIVERED',
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
    const monthlyOrderIds = new Map<string, Set<number>>();
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

  private async formatGuestOrderResponse(orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId },
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

    return {
      id: order.id,
      orderNo: order.ordrNo,
      buyerId: order.byrId,
      totalAmount: order.ordrTotAmt,
      status: order.ordrSttsCd,
      paymentMethod: order.payMthdCd,
      shippingAddress: order.shipAddr,
      receiverName: order.shipRcvrNm,
      receiverPhone: order.shipTelno,
      shippingMemo: order.shipMemo,
      createdAt: order.rgstDt,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.prdId,
        productName: item.prdNm,
        productImageUrl: item.prdImgUrl,
        unitPrice: item.unitPrc,
        quantity: item.ordrQty,
        subtotalAmount: item.subtotAmt,
        itemStatus: item.itemSttsCd,
        paymentStatus: item.payStts || 'UNPAID',
        trackingNumber: item.trckgNo,
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

  private validateItemStatusTransition(current: string, next: string) {
    const validTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED'],
      CONFIRMED: ['SHIPPED'],
      SHIPPED: ['DELIVERED'],
      DELIVERED: [],
    };

    const allowed = validTransitions[current] || [];
    if (!allowed.includes(next)) {
      throw new BusinessException(
        'INVALID_STATUS_TRANSITION',
        `Cannot transition item from ${current} to ${next}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private formatOrderResponse(order: {
    id: number;
    ordrNo: string;
    byrId: number;
    ordrTotAmt: number;
    ordrSttsCd: string;
    payMthdCd: string | null;
    shipAddr: string | null;
    shipRcvrNm: string | null;
    shipTelno: string | null;
    shipMemo: string | null;
    trckgNo: string | null;
    rgstDt: Date;
    items: {
      id: number;
      prdId: number;
      prdNm: string;
      prdImgUrl: string;
      unitPrc: number;
      ordrQty: number;
      subtotAmt: number;
      itemSttsCd: string;
      payStts?: string;
      trckgNo: string | null;
    }[];
  }) {
    return {
      id: order.id,
      orderNo: order.ordrNo,
      buyerId: order.byrId,
      totalAmount: order.ordrTotAmt,
      status: order.ordrSttsCd,
      paymentMethod: order.payMthdCd,
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
        itemStatus: item.itemSttsCd,
        paymentStatus: item.payStts || 'UNPAID',
        trackingNumber: item.trckgNo,
      })),
    };
  }

  private formatOrderDetailResponse(order: {
    id: number;
    ordrNo: string;
    byrId: number;
    ordrTotAmt: number;
    ordrSttsCd: string;
    payMthdCd: string | null;
    shipAddr: string | null;
    shipRcvrNm: string | null;
    shipTelno: string | null;
    shipMemo: string | null;
    trckgNo: string | null;
    rgstDt: Date;
    items: {
      id: number;
      prdId: number;
      sllrId: number;
      prdNm: string;
      prdImgUrl: string;
      unitPrc: number;
      ordrQty: number;
      subtotAmt: number;
      itemSttsCd: string;
      payStts?: string;
      trckgNo: string | null;
      seller?: { id: number; userNm: string; userNcnm: string | null } | null;
    }[];
    statusHistory: {
      id: number;
      prevSttsCd: string;
      newSttsCd: string;
      chngRsn: string | null;
      chngrId: number;
      chngDt: Date;
    }[];
  }) {
    return {
      id: order.id,
      orderNo: order.ordrNo,
      buyerId: order.byrId,
      totalAmount: order.ordrTotAmt,
      status: order.ordrSttsCd,
      paymentMethod: order.payMthdCd,
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
        sellerName: item.seller?.userNcnm || item.seller?.userNm || 'Unknown',
        productName: item.prdNm,
        productImageUrl: item.prdImgUrl,
        unitPrice: item.unitPrc,
        quantity: item.ordrQty,
        subtotalAmount: item.subtotAmt,
        itemStatus: item.itemSttsCd,
        paymentStatus: item.payStts || 'UNPAID',
        trackingNumber: item.trckgNo,
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

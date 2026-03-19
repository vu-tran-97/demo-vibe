import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/filters/business.exception';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createProduct(dto: CreateProductDto, user: JwtPayload) {
    if (user.role !== 'SELLER' && user.role !== 'SUPER_ADMIN') {
      throw new BusinessException(
        'INSUFFICIENT_ROLE',
        'Only sellers can create products',
        HttpStatus.FORBIDDEN,
      );
    }

    const product = await this.prisma.product.create({
      data: {
        sellerId: user.sub,
        prdNm: dto.prdNm,
        prdDc: dto.prdDc,
        prdPrc: dto.prdPrc,
        prdSalePrc: dto.prdSalePrc ?? null,
        prdCtgrCd: dto.prdCtgrCd,
        prdSttsCd: dto.prdSttsCd || 'DRAFT',
        prdImgUrl: dto.prdImgUrl,
        prdImgUrls: dto.prdImgUrls || [],
        stckQty: dto.stckQty,
        soldCnt: 0,
        viewCnt: 0,
        avgRtng: 0,
        rvwCnt: 0,
        srchTags: dto.srchTags || [],
        rgtrId: user.sub,
        mdfrId: user.sub,
      },
    });

    this.logger.log(`User ${user.sub} created product ${product.id}`);

    return this.formatProductResponse(product);
  }

  async listProducts(query: ListProductsQueryDto) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { delYn: 'N' };

    // Public listing only shows active products
    where.prdSttsCd = 'ACTV';

    // Single category filter (backward compatible)
    if (query.category) {
      where.prdCtgrCd = query.category;
    }

    // Multi-category filter (comma-separated)
    if (query.categories) {
      const categoryList = query.categories.split(',').map((c) => c.trim()).filter(Boolean);
      if (categoryList.length > 0) {
        where.prdCtgrCd = { in: categoryList };
      }
    }

    if (query.search) {
      where.prdNm = { contains: query.search, mode: 'insensitive' };
    }

    if (query.minPrice || query.maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (query.minPrice) {
        priceFilter.gte = parseFloat(query.minPrice);
      }
      if (query.maxPrice) {
        priceFilter.lte = parseFloat(query.maxPrice);
      }
      where.prdPrc = priceFilter;
    }

    // Rating filter
    if (query.minRating) {
      where.avgRtng = { gte: parseFloat(query.minRating) };
    }

    // In-stock filter
    if (query.inStock === 'true') {
      where.stckQty = { gt: 0 };
    }

    let orderBy: Record<string, string>;
    switch (query.sort) {
      case 'price-low':
        orderBy = { prdPrc: 'asc' };
        break;
      case 'price-high':
        orderBy = { prdPrc: 'desc' };
        break;
      case 'popular':
        orderBy = { soldCnt: 'desc' };
        break;
      case 'rating':
        orderBy = { avgRtng: 'desc' };
        break;
      default:
        orderBy = { rgstDt: 'desc' };
        break;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { seller: { select: { id: true, userNm: true, userNcnm: true } } },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: products.map((p) => this.formatProductResponse(p)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMyProducts(query: ListProductsQueryDto, user: JwtPayload) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      delYn: 'N',
    };

    // SUPER_ADMIN sees all products; sellers see only their own
    if (user.role !== 'SUPER_ADMIN') {
      where.sellerId = user.sub;
    }

    if (query.category) {
      where.prdCtgrCd = query.category;
    }
    if (query.status) {
      where.prdSttsCd = query.status;
    }
    if (query.search) {
      if (user.role === 'SUPER_ADMIN') {
        where.OR = [
          { prdNm: { contains: query.search, mode: 'insensitive' } },
          { seller: { userNm: { contains: query.search, mode: 'insensitive' } } },
          { seller: { userNcnm: { contains: query.search, mode: 'insensitive' } } },
        ];
      } else {
        where.prdNm = { contains: query.search, mode: 'insensitive' };
      }
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { rgstDt: 'desc' },
        include: { seller: { select: { id: true, userNm: true, userNcnm: true } } },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: products.map((p) => this.formatProductResponse(p)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProductById(productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, delYn: 'N' },
      include: { seller: { select: { id: true, userNm: true, userNcnm: true } } },
    });
    if (!product) {
      throw new BusinessException(
        'PRODUCT_NOT_FOUND',
        'Product not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Increment view count
    await this.prisma.product.update({
      where: { id: productId },
      data: { viewCnt: { increment: 1 } },
    });

    return this.formatProductResponse({
      ...product,
      viewCnt: product.viewCnt + 1,
    });
  }

  async updateProduct(
    productId: string,
    dto: UpdateProductDto,
    user: JwtPayload,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, delYn: 'N' },
    });
    if (!product) {
      throw new BusinessException(
        'PRODUCT_NOT_FOUND',
        'Product not found',
        HttpStatus.NOT_FOUND,
      );
    }

    this.verifyOwnership(product.sellerId, user);

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        ...dto,
        mdfrId: user.sub,
      },
    });

    this.logger.log(`User ${user.sub} updated product ${productId}`);

    return this.formatProductResponse(updated);
  }

  async changeStatus(
    productId: string,
    newStatus: string,
    user: JwtPayload,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, delYn: 'N' },
    });
    if (!product) {
      throw new BusinessException(
        'PRODUCT_NOT_FOUND',
        'Product not found',
        HttpStatus.NOT_FOUND,
      );
    }

    this.verifyOwnership(product.sellerId, user);

    // When hiding, check for pending/unpaid orders and warn
    if (newStatus === 'HIDDEN') {
      const pendingItems = await this.prisma.orderItem.count({
        where: {
          prdId: productId,
          delYn: 'N',
          itemSttsCd: { in: ['PENDING', 'CONFIRMED'] },
          order: { delYn: 'N', ordrSttsCd: { not: 'CANCELLED' } },
        },
      });
      if (pendingItems > 0) {
        this.logger.warn(
          `Product ${productId} hidden with ${pendingItems} unfulfilled order item(s). Existing orders remain valid.`,
        );
      }
    }

    const validTransitions: Record<string, string[]> = {
      DRAFT: ['ACTV'],
      ACTV: ['HIDDEN', 'SOLD_OUT'],
      HIDDEN: ['ACTV'],
      SOLD_OUT: ['ACTV'],
    };

    const allowed = validTransitions[product.prdSttsCd] || [];
    if (!allowed.includes(newStatus)) {
      throw new BusinessException(
        'INVALID_STATUS_TRANSITION',
        `Cannot transition from ${product.prdSttsCd} to ${newStatus}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { prdSttsCd: newStatus, mdfrId: user.sub },
    });

    this.logger.log(
      `User ${user.sub} changed product ${productId} status from ${product.prdSttsCd} to ${newStatus}`,
    );

    return this.formatProductResponse(updated);
  }

  async deleteProduct(productId: string, user: JwtPayload) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, delYn: 'N' },
    });
    if (!product) {
      throw new BusinessException(
        'PRODUCT_NOT_FOUND',
        'Product not found',
        HttpStatus.NOT_FOUND,
      );
    }

    this.verifyOwnership(product.sellerId, user);

    // Check for unfulfilled order items
    const pendingItems = await this.prisma.orderItem.findMany({
      where: {
        prdId: productId,
        delYn: 'N',
        itemSttsCd: { in: ['PENDING', 'CONFIRMED', 'SHIPPED'] },
        order: { delYn: 'N', ordrSttsCd: { not: 'CANCELLED' } },
      },
      include: { order: true },
    });

    // Block deletion if any items are already shipped (in transit)
    const shippedItems = pendingItems.filter((i) => i.itemSttsCd === 'SHIPPED');
    if (shippedItems.length > 0) {
      throw new BusinessException(
        'CANNOT_DELETE_SHIPPED',
        `Cannot delete product with ${shippedItems.length} item(s) currently in transit. Please wait until delivery is complete.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Auto-cancel pending/confirmed items and restore stock
    for (const item of pendingItems) {
      await this.prisma.orderItem.update({
        where: { id: item.id },
        data: { itemSttsCd: 'CANCELLED', mdfrId: user.sub },
      });

      // Restore stock
      await this.prisma.product.update({
        where: { id: productId },
        data: {
          stckQty: { increment: item.ordrQty },
          soldCnt: { decrement: item.ordrQty },
        },
      });

      // Log in status history
      await this.prisma.orderStatusHistory.create({
        data: {
          ordrId: item.ordrId,
          prevSttsCd: item.itemSttsCd,
          newSttsCd: 'CANCELLED',
          chngRsn: `Product "${product.prdNm}" deleted by seller. Item auto-cancelled.`,
          chngrId: user.sub,
          chngDt: new Date(),
          rgtrId: user.sub,
        },
      });

      // If all items in this order are now cancelled, cancel the order too
      const orderItems = await this.prisma.orderItem.findMany({
        where: { ordrId: item.ordrId, delYn: 'N' },
      });
      const allCancelled = orderItems.every(
        (oi) => oi.itemSttsCd === 'CANCELLED' || oi.id === item.id,
      );
      if (allCancelled) {
        await this.prisma.order.update({
          where: { id: item.ordrId },
          data: { ordrSttsCd: 'CANCELLED', mdfrId: user.sub },
        });
      }
    }

    if (pendingItems.length > 0) {
      this.logger.warn(
        `Product ${productId} deleted: ${pendingItems.length} order item(s) auto-cancelled`,
      );
    }

    // Soft-delete the product
    await this.prisma.product.update({
      where: { id: productId },
      data: { delYn: 'Y', mdfrId: user.sub },
    });

    this.logger.log(`User ${user.sub} soft-deleted product ${productId}`);

    return {
      id: productId,
      deleted: true,
      cancelledItems: pendingItems.length,
    };
  }

  private verifyOwnership(sellerId: string, user: JwtPayload) {
    if (user.role === 'SUPER_ADMIN') {
      return;
    }
    if (sellerId !== user.sub) {
      throw new BusinessException(
        'NOT_PRODUCT_OWNER',
        'You can only modify your own products',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private formatProductResponse(product: {
    id: string;
    sellerId: string;
    prdNm: string;
    prdDc: string;
    prdPrc: number;
    prdSalePrc: number | null;
    prdCtgrCd: string;
    prdSttsCd: string;
    prdImgUrl: string;
    prdImgUrls: string[];
    stckQty: number;
    soldCnt: number;
    viewCnt: number;
    avgRtng: number;
    rvwCnt: number;
    srchTags: string[];
    rgstDt: Date;
    seller?: { id: string; userNm: string; userNcnm: string | null } | null;
  }) {
    return {
      id: product.id,
      sellerId: product.sellerId,
      name: product.prdNm,
      description: product.prdDc,
      price: product.prdPrc,
      salePrice: product.prdSalePrc,
      category: product.prdCtgrCd,
      status: product.prdSttsCd,
      imageUrl: product.prdImgUrl,
      imageUrls: product.prdImgUrls,
      stockQuantity: product.stckQty,
      soldCount: product.soldCnt,
      viewCount: product.viewCnt,
      averageRating: product.avgRtng,
      reviewCount: product.rvwCnt,
      searchTags: product.srchTags,
      createdAt: product.rgstDt,
      seller: product.seller
        ? {
            id: product.seller.id,
            name: product.seller.userNm,
            nickname: product.seller.userNcnm || '',
          }
        : null,
    };
  }
}

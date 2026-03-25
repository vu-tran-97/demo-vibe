import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async search(q: string, page = 1, limit = 12) {
    const skip = (page - 1) * limit;

    const productWhere = {
      delYn: 'N',
      prdSttsCd: 'ACTV',
      OR: [
        { prdNm: { contains: q, mode: 'insensitive' as const } },
        { prdDc: { contains: q, mode: 'insensitive' as const } },
        { srchTags: { hasSome: [q.toLowerCase(), q, q.toUpperCase()] } },
      ],
    };

    const postWhere = {
      delYn: 'N',
      OR: [
        { postTtl: { contains: q, mode: 'insensitive' as const } },
        { postCn: { contains: q, mode: 'insensitive' as const } },
      ],
    };

    const [products, productTotal, posts, postTotal] = await Promise.all([
      this.prisma.product.findMany({
        where: productWhere,
        skip,
        take: limit,
        orderBy: { soldCnt: 'desc' },
        include: {
          seller: { select: { id: true, userNm: true, userNcnm: true } },
        },
      }),
      this.prisma.product.count({ where: productWhere }),
      this.prisma.boardPost.findMany({
        where: postWhere,
        skip,
        take: limit,
        orderBy: { rgstDt: 'desc' },
        include: {
          user: { select: { id: true, userNm: true, userNcnm: true } },
        },
      }),
      this.prisma.boardPost.count({ where: postWhere }),
    ]);

    this.logger.log(`Search "${q}" — ${productTotal} products, ${postTotal} posts`);

    return {
      products: {
        items: products.map((p) => this.formatProduct(p)),
        total: productTotal,
      },
      posts: {
        items: posts.map((p) => this.formatPost(p)),
        total: postTotal,
      },
    };
  }

  async suggest(q: string) {
    const [products, posts] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          delYn: 'N',
          prdSttsCd: 'ACTV',
          prdNm: { contains: q, mode: 'insensitive' },
        },
        take: 3,
        orderBy: { soldCnt: 'desc' },
        select: { id: true, prdNm: true },
      }),
      this.prisma.boardPost.findMany({
        where: {
          delYn: 'N',
          postTtl: { contains: q, mode: 'insensitive' },
        },
        take: 2,
        orderBy: { rgstDt: 'desc' },
        select: { id: true, postTtl: true },
      }),
    ]);

    const suggestions = [
      ...products.map((p) => ({ type: 'product' as const, id: p.id, title: p.prdNm })),
      ...posts.map((p) => ({ type: 'post' as const, id: p.id, title: p.postTtl })),
    ];

    return { suggestions: suggestions.slice(0, 5) };
  }

  private formatProduct(product: {
    id: number;
    sellerId: number;
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
    seller?: { id: number; userNm: string; userNcnm: string | null } | null;
  }) {
    return {
      id: product.id,
      name: product.prdNm,
      description: product.prdDc,
      price: product.prdPrc,
      salePrice: product.prdSalePrc,
      category: product.prdCtgrCd,
      imageUrl: product.prdImgUrl,
      stockQuantity: product.stckQty,
      soldCount: product.soldCnt,
      averageRating: product.avgRtng,
      reviewCount: product.rvwCnt,
      searchTags: product.srchTags,
      createdAt: product.rgstDt,
      seller: product.seller
        ? { id: product.seller.id, name: product.seller.userNm, nickname: product.seller.userNcnm || '' }
        : null,
    };
  }

  private formatPost(post: {
    id: number;
    userId: number;
    postTtl: string;
    postCn: string;
    postCtgrCd: string;
    inqrCnt: number;
    likeCnt: number;
    cmntCnt: number;
    pnndYn: string;
    rgstDt: Date;
    user?: { id: number; userNm: string; userNcnm: string | null } | null;
  }) {
    return {
      id: post.id,
      title: post.postTtl,
      content: post.postCn.length > 150 ? post.postCn.substring(0, 150) + '...' : post.postCn,
      category: post.postCtgrCd,
      views: post.inqrCnt,
      likes: post.likeCnt,
      comments: post.cmntCnt,
      pinned: post.pnndYn === 'Y',
      createdAt: post.rgstDt,
      author: post.user
        ? { id: post.user.id, name: post.user.userNm, nickname: post.user.userNcnm || '' }
        : null,
    };
  }
}

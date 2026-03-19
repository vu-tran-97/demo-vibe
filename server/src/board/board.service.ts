import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/filters/business.exception';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { ListPostsQueryDto } from './dto/list-posts-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class BoardService {
  private readonly logger = new Logger(BoardService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Banner ──

  async getBanner() {
    const banner = await this.prisma.boardBanner.findFirst({
      where: { useYn: 'Y' },
      orderBy: { rgstDt: 'desc' },
    });

    if (!banner) {
      return null;
    }

    return {
      id: banner.id,
      imageUrl: banner.imgUrl,
      title: banner.ttl || null,
      subtitle: banner.subTtl || null,
      linkUrl: banner.lnkUrl || null,
      enabled: banner.useYn === 'Y',
    };
  }

  async updateBanner(dto: UpdateBannerDto, userId: string) {
    const existing = await this.prisma.boardBanner.findFirst({
      orderBy: { rgstDt: 'desc' },
    });

    const data = {
      imgUrl: dto.imageUrl,
      ttl: dto.title || null,
      subTtl: dto.subtitle || null,
      lnkUrl: dto.linkUrl || null,
      useYn: dto.enabled ? 'Y' : 'N',
      mdfrId: userId,
    };

    let banner;
    if (existing) {
      banner = await this.prisma.boardBanner.update({
        where: { id: existing.id },
        data,
      });
    } else {
      banner = await this.prisma.boardBanner.create({
        data: {
          ...data,
          rgtrId: userId,
        },
      });
    }

    this.logger.log(`User ${userId} updated board banner ${banner.id}`);

    return {
      id: banner.id,
      imageUrl: banner.imgUrl,
      title: banner.ttl || null,
      subtitle: banner.subTtl || null,
      linkUrl: banner.lnkUrl || null,
      enabled: banner.useYn === 'Y',
    };
  }

  // ── Posts ──

  async createPost(dto: CreatePostDto, user: JwtPayload) {
    // Only SUPER_ADMIN can create NOTICE posts
    if (dto.postCtgrCd === 'NOTICE' && user.role !== 'SUPER_ADMIN') {
      throw new BusinessException(
        'NOTICE_ADMIN_ONLY',
        'Only administrators can create notice posts',
        HttpStatus.FORBIDDEN,
      );
    }

    const post = await this.prisma.boardPost.create({
      data: {
        userId: user.sub,
        postTtl: dto.postTtl,
        postCn: dto.postCn,
        postCtgrCd: dto.postCtgrCd,
        inqrCnt: 0,
        likeCnt: 0,
        cmntCnt: 0,
        pnndYn: 'N',
        srchTags: dto.srchTags || [],
        rgtrId: user.sub,
        mdfrId: user.sub,
      },
      include: {
        user: {
          select: { id: true, userNm: true, userNcnm: true, prflImgUrl: true },
        },
      },
    });

    this.logger.log(`User ${user.sub} created post ${post.id}`);

    return this.formatPostResponse(post);
  }

  async listPosts(query: ListPostsQueryDto) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '10', 10), 50);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { delYn: 'N' };

    if (query.category) {
      where.postCtgrCd = query.category;
    }

    if (query.search) {
      where.OR = [
        { postTtl: { contains: query.search, mode: 'insensitive' } },
        { postCn: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    let orderBy: Record<string, string>[];
    switch (query.sort) {
      case 'views':
        orderBy = [{ pnndYn: 'desc' }, { inqrCnt: 'desc' }, { rgstDt: 'desc' }];
        break;
      case 'comments':
        orderBy = [{ pnndYn: 'desc' }, { cmntCnt: 'desc' }, { rgstDt: 'desc' }];
        break;
      default: // newest
        orderBy = [{ pnndYn: 'desc' }, { rgstDt: 'desc' }];
        break;
    }

    const [posts, total] = await Promise.all([
      this.prisma.boardPost.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: { id: true, userNm: true, userNcnm: true, prflImgUrl: true },
          },
        },
      }),
      this.prisma.boardPost.count({ where }),
    ]);

    return {
      items: posts.map((p) => this.formatPostResponse(p)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPostById(postId: string) {
    const post = await this.prisma.boardPost.findFirst({
      where: { id: postId, delYn: 'N' },
      include: {
        user: {
          select: { id: true, userNm: true, userNcnm: true, prflImgUrl: true },
        },
      },
    });

    if (!post) {
      throw new BusinessException(
        'POST_NOT_FOUND',
        'Post not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Increment view count atomically
    await this.prisma.boardPost.update({
      where: { id: postId },
      data: { inqrCnt: { increment: 1 } },
    });

    return this.formatPostResponse({
      ...post,
      inqrCnt: post.inqrCnt + 1,
    });
  }

  async updatePost(postId: string, dto: UpdatePostDto, user: JwtPayload) {
    const post = await this.prisma.boardPost.findFirst({
      where: { id: postId, delYn: 'N' },
    });

    if (!post) {
      throw new BusinessException(
        'POST_NOT_FOUND',
        'Post not found',
        HttpStatus.NOT_FOUND,
      );
    }

    this.verifyPostOwnership(post.userId, user);

    // Only SUPER_ADMIN can change category to NOTICE
    if (dto.postCtgrCd === 'NOTICE' && user.role !== 'SUPER_ADMIN') {
      throw new BusinessException(
        'NOTICE_ADMIN_ONLY',
        'Only administrators can set notice category',
        HttpStatus.FORBIDDEN,
      );
    }

    const updateData: Record<string, unknown> = { mdfrId: user.sub };
    if (dto.postTtl !== undefined) updateData.postTtl = dto.postTtl;
    if (dto.postCn !== undefined) updateData.postCn = dto.postCn;
    if (dto.postCtgrCd !== undefined) updateData.postCtgrCd = dto.postCtgrCd;
    if (dto.srchTags !== undefined) updateData.srchTags = dto.srchTags;

    const updated = await this.prisma.boardPost.update({
      where: { id: postId },
      data: updateData,
      include: {
        user: {
          select: { id: true, userNm: true, userNcnm: true, prflImgUrl: true },
        },
      },
    });

    this.logger.log(`User ${user.sub} updated post ${postId}`);

    return this.formatPostResponse(updated);
  }

  async deletePost(postId: string, user: JwtPayload) {
    const post = await this.prisma.boardPost.findFirst({
      where: { id: postId, delYn: 'N' },
    });

    if (!post) {
      throw new BusinessException(
        'POST_NOT_FOUND',
        'Post not found',
        HttpStatus.NOT_FOUND,
      );
    }

    this.verifyPostOwnership(post.userId, user);

    await this.prisma.boardPost.update({
      where: { id: postId },
      data: { delYn: 'Y', mdfrId: user.sub },
    });

    this.logger.log(`User ${user.sub} soft-deleted post ${postId}`);

    return { id: postId, deleted: true };
  }

  // ── Comments ──

  async getComments(postId: string) {
    const post = await this.prisma.boardPost.findFirst({
      where: { id: postId, delYn: 'N' },
    });

    if (!post) {
      throw new BusinessException(
        'POST_NOT_FOUND',
        'Post not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // In the Prisma schema, BoardComment.post is the User relation (via userId)
    const comments = await this.prisma.boardComment.findMany({
      where: { postId, delYn: 'N' },
      orderBy: { rgstDt: 'asc' },
      include: {
        post: {
          select: { id: true, userNm: true, userNcnm: true, prflImgUrl: true },
        },
      },
    });

    return comments.map((c) => this.formatCommentResponse(c));
  }

  async createComment(
    postId: string,
    dto: CreateCommentDto,
    user: JwtPayload,
  ) {
    const post = await this.prisma.boardPost.findFirst({
      where: { id: postId, delYn: 'N' },
    });

    if (!post) {
      throw new BusinessException(
        'POST_NOT_FOUND',
        'Post not found',
        HttpStatus.NOT_FOUND,
      );
    }

    let cmntDpth = 0;

    if (dto.prntCmntId) {
      const parentComment = await this.prisma.boardComment.findFirst({
        where: { id: dto.prntCmntId, postId, delYn: 'N' },
      });

      if (!parentComment) {
        throw new BusinessException(
          'PARENT_COMMENT_NOT_FOUND',
          'Parent comment not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (parentComment.cmntDpth >= 1) {
        throw new BusinessException(
          'MAX_DEPTH_EXCEEDED',
          'Reply depth cannot exceed 1 level',
          HttpStatus.BAD_REQUEST,
        );
      }

      cmntDpth = 1;
    }

    const comment = await this.prisma.boardComment.create({
      data: {
        postId,
        userId: user.sub,
        cmntCn: dto.cmntCn,
        prntCmntId: dto.prntCmntId || null,
        cmntDpth,
        rgtrId: user.sub,
        mdfrId: user.sub,
      },
      include: {
        post: {
          select: { id: true, userNm: true, userNcnm: true, prflImgUrl: true },
        },
      },
    });

    // Increment comment count on post
    await this.prisma.boardPost.update({
      where: { id: postId },
      data: { cmntCnt: { increment: 1 } },
    });

    this.logger.log(
      `User ${user.sub} added comment ${comment.id} on post ${postId}`,
    );

    return this.formatCommentResponse(comment);
  }

  async updateComment(
    postId: string,
    commentId: string,
    dto: UpdateCommentDto,
    user: JwtPayload,
  ) {
    const comment = await this.prisma.boardComment.findFirst({
      where: { id: commentId, postId, delYn: 'N' },
    });

    if (!comment) {
      throw new BusinessException(
        'COMMENT_NOT_FOUND',
        'Comment not found',
        HttpStatus.NOT_FOUND,
      );
    }

    this.verifyCommentOwnership(comment.userId, user);

    const updated = await this.prisma.boardComment.update({
      where: { id: commentId },
      data: {
        cmntCn: dto.cmntCn,
        mdfrId: user.sub,
      },
      include: {
        post: {
          select: { id: true, userNm: true, userNcnm: true, prflImgUrl: true },
        },
      },
    });

    this.logger.log(`User ${user.sub} updated comment ${commentId}`);

    return this.formatCommentResponse(updated);
  }

  async deleteComment(
    postId: string,
    commentId: string,
    user: JwtPayload,
  ) {
    const comment = await this.prisma.boardComment.findFirst({
      where: { id: commentId, postId, delYn: 'N' },
    });

    if (!comment) {
      throw new BusinessException(
        'COMMENT_NOT_FOUND',
        'Comment not found',
        HttpStatus.NOT_FOUND,
      );
    }

    this.verifyCommentOwnership(comment.userId, user);

    await this.prisma.boardComment.update({
      where: { id: commentId },
      data: { delYn: 'Y', mdfrId: user.sub },
    });

    // Decrement comment count on post
    await this.prisma.boardPost.update({
      where: { id: postId },
      data: { cmntCnt: { decrement: 1 } },
    });

    this.logger.log(`User ${user.sub} soft-deleted comment ${commentId}`);

    return { id: commentId, deleted: true };
  }

  // ── Private Helpers ──

  private verifyPostOwnership(authorId: string, user: JwtPayload) {
    if (user.role === 'SUPER_ADMIN') return;
    if (authorId !== user.sub) {
      throw new BusinessException(
        'NOT_POST_OWNER',
        'You can only modify your own posts',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private verifyCommentOwnership(authorId: string, user: JwtPayload) {
    if (user.role === 'SUPER_ADMIN') return;
    if (authorId !== user.sub) {
      throw new BusinessException(
        'NOT_COMMENT_OWNER',
        'You can only modify your own comments',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private formatPostResponse(post: {
    id: string;
    userId: string;
    postTtl: string;
    postCn: string;
    postCtgrCd: string;
    inqrCnt: number;
    likeCnt: number;
    cmntCnt: number;
    pnndYn: string;
    srchTags: string[];
    rgstDt: Date;
    mdfcnDt: Date;
    user?: {
      id: string;
      userNm: string;
      userNcnm: string | null;
      prflImgUrl: string | null;
    } | null;
  }) {
    return {
      id: post.id,
      title: post.postTtl,
      content: post.postCn,
      category: post.postCtgrCd,
      viewCount: post.inqrCnt,
      likeCount: post.likeCnt,
      commentCount: post.cmntCnt,
      pinned: post.pnndYn === 'Y',
      tags: post.srchTags,
      createdAt: post.rgstDt,
      updatedAt: post.mdfcnDt,
      author: post.user
        ? {
            id: post.user.id,
            name: post.user.userNm,
            nickname: post.user.userNcnm || '',
            profileImageUrl: post.user.prflImgUrl || null,
          }
        : null,
    };
  }

  // In the Prisma schema, BoardComment.post = User relation (via userId)
  private formatCommentResponse(comment: {
    id: string;
    postId: string;
    userId: string;
    cmntCn: string;
    prntCmntId: string | null;
    cmntDpth: number;
    rgstDt: Date;
    mdfcnDt: Date;
    post?: {
      id: string;
      userNm: string;
      userNcnm: string | null;
      prflImgUrl: string | null;
    } | null;
  }) {
    return {
      id: comment.id,
      postId: comment.postId,
      userId: comment.userId,
      content: comment.cmntCn,
      parentCommentId: comment.prntCmntId,
      depth: comment.cmntDpth,
      createdAt: comment.rgstDt,
      updatedAt: comment.mdfcnDt,
      author: comment.post
        ? {
            id: comment.post.id,
            name: comment.post.userNm,
            nickname: comment.post.userNcnm || '',
            profileImageUrl: comment.post.prflImgUrl || null,
          }
        : null,
    };
  }
}

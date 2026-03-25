import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { BoardService } from './board.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { ListPostsQueryDto } from './dto/list-posts-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { RequestUser } from '../firebase/firebase-auth.guard';

@ApiTags('Board')
@Controller('api/posts')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  // ── Banner ──

  @Get('banner')
  @Public()
  @ApiOperation({ summary: 'Get current banner' })
  @ApiResponse({ status: 200, description: 'Banner retrieved' })
  async getBanner() {
    return this.boardService.getBanner();
  }

  @Put('banner')
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update banner (admin only)' })
  @ApiBody({ type: UpdateBannerDto })
  @ApiResponse({ status: 200, description: 'Banner updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async updateBanner(
    @Body() dto: UpdateBannerDto,
    @Request() req: { user: RequestUser },
  ) {
    return this.boardService.updateBanner(dto, req.user.id);
  }

  // ── Posts ──

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new post' })
  @ApiBody({ type: CreatePostDto })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPost(
    @Body() dto: CreatePostDto,
    @Request() req: { user: RequestUser },
  ) {
    return this.boardService.createPost(dto, req.user);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List posts with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Posts retrieved successfully' })
  async listPosts(@Query() query: ListPostsQueryDto) {
    return this.boardService.listPosts(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get post by ID' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post details retrieved' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getPostById(@Param('id') id: string) {
    return this.boardService.getPostById(Number(id));
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiBody({ type: UpdatePostDto })
  @ApiResponse({ status: 200, description: 'Post updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async updatePost(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @Request() req: { user: RequestUser },
  ) {
    return this.boardService.updatePost(Number(id), dto, req.user);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async deletePost(
    @Param('id') id: string,
    @Request() req: { user: RequestUser },
  ) {
    return this.boardService.deletePost(Number(id), req.user);
  }

  // ── Comments ──

  @Get(':id/comments')
  @Public()
  @ApiOperation({ summary: 'Get comments for a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Comments retrieved' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getComments(@Param('id') id: string) {
    return this.boardService.getComments(Number(id));
  }

  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a comment on a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({ status: 201, description: 'Comment created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async createComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @Request() req: { user: RequestUser },
  ) {
    return this.boardService.createComment(Number(id), dto, req.user);
  }

  @Patch(':postId/comments/:commentId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiBody({ type: UpdateCommentDto })
  @ApiResponse({ status: 200, description: 'Comment updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async updateComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
    @Request() req: { user: RequestUser },
  ) {
    return this.boardService.updateComment(Number(postId), Number(commentId), dto, req.user);
  }

  @Delete(':postId/comments/:commentId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Comment deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async deleteComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Request() req: { user: RequestUser },
  ) {
    return this.boardService.deleteComment(Number(postId), Number(commentId), req.user);
  }
}

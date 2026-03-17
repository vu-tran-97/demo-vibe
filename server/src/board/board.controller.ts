import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { BoardService } from './board.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ListPostsQueryDto } from './dto/list-posts-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('api/posts')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  // ── Posts ──

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPost(
    @Body() dto: CreatePostDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.boardService.createPost(dto, req.user);
  }

  @Get()
  @Public()
  async listPosts(@Query() query: ListPostsQueryDto) {
    return this.boardService.listPosts(query);
  }

  @Get(':id')
  @Public()
  async getPostById(@Param('id') id: string) {
    return this.boardService.getPostById(id);
  }

  @Patch(':id')
  async updatePost(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.boardService.updatePost(id, dto, req.user);
  }

  @Delete(':id')
  async deletePost(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.boardService.deletePost(id, req.user);
  }

  // ── Comments ──

  @Get(':id/comments')
  @Public()
  async getComments(@Param('id') id: string) {
    return this.boardService.getComments(id);
  }

  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.boardService.createComment(id, dto, req.user);
  }

  @Patch(':postId/comments/:commentId')
  async updateComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.boardService.updateComment(postId, commentId, dto, req.user);
  }

  @Delete(':postId/comments/:commentId')
  async deleteComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.boardService.deleteComment(postId, commentId, req.user);
  }
}

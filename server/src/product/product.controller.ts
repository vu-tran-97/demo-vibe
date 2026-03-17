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
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('api/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles('SELLER', 'SUPER_ADMIN')
  async createProduct(
    @Body() dto: CreateProductDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.productService.createProduct(dto, req.user);
  }

  @Get()
  @Public()
  async listProducts(@Query() query: ListProductsQueryDto) {
    return this.productService.listProducts(query);
  }

  @Get('my')
  @Roles('SELLER', 'SUPER_ADMIN')
  async getMyProducts(
    @Query() query: ListProductsQueryDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.productService.getMyProducts(query, req.user);
  }

  @Get(':id')
  @Public()
  async getProductById(@Param('id') id: string) {
    return this.productService.getProductById(id);
  }

  @Patch(':id')
  @Roles('SELLER', 'SUPER_ADMIN')
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.productService.updateProduct(id, dto, req.user);
  }

  @Patch(':id/status')
  @Roles('SELLER', 'SUPER_ADMIN')
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: UpdateProductStatusDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.productService.changeStatus(id, dto.status, req.user);
  }

  @Delete(':id')
  @Roles('SELLER', 'SUPER_ADMIN')
  async deleteProduct(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.productService.deleteProduct(id, req.user);
  }
}

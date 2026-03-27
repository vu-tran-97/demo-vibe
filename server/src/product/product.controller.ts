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
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { RequestUser } from '../firebase/firebase-auth.guard';

@ApiTags('Products')
@Controller('api/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles('SELLER', 'SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - seller or admin only' })
  async createProduct(
    @Body() dto: CreateProductDto,
    @Request() req: { user: RequestUser },
  ) {
    return this.productService.createProduct(dto, req.user);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List products with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async listProducts(@Query() query: ListProductsQueryDto) {
    return this.productService.listProducts(query);
  }

  @Get('my')
  @Roles('SELLER', 'SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List my products (seller view)' })
  @ApiResponse({ status: 200, description: 'Seller products retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyProducts(
    @Query() query: ListProductsQueryDto,
    @Request() req: { user: RequestUser },
  ) {
    return this.productService.getMyProducts(query, req.user);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product details retrieved' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductById(@Param('id') id: string) {
    return this.productService.getProductById(Number(id));
  }

  @Patch(':id')
  @Roles('SELLER', 'SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Request() req: { user: RequestUser },
  ) {
    return this.productService.updateProduct(Number(id), dto, req.user);
  }

  @Patch(':id/status')
  @Roles('SELLER', 'SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change product status' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiBody({ type: UpdateProductStatusDto })
  @ApiResponse({ status: 200, description: 'Product status updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: UpdateProductStatusDto,
    @Request() req: { user: RequestUser },
  ) {
    return this.productService.changeStatus(Number(id), dto.status, req.user);
  }

  @Delete(':id')
  @Roles('SELLER', 'SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async deleteProduct(
    @Param('id') id: string,
    @Request() req: { user: RequestUser },
  ) {
    return this.productService.deleteProduct(Number(id), req.user);
  }
}

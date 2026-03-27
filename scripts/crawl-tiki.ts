/**
 * Tiki Product Crawler — Crawls REAL product data from Tiki.vn API
 * and inserts into the database for a specific seller.
 *
 * Usage:
 *   DATABASE_URL='...' npx tsx scripts/crawl-tiki.ts [seller-email] [target-count]
 *
 * Example:
 *   DATABASE_URL='postgresql://...' npx tsx scripts/crawl-tiki.ts seller1000@yopmail.com 50000
 */

import { PrismaClient } from '.prisma/client';

const prisma = new PrismaClient();

const BATCH_SIZE = 500;
const TIKI_API = 'https://tiki.vn/api/personalish/v1/blocks/listings';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
  'Accept': 'application/json',
};

// Tiki categories → our product categories
const TIKI_CATEGORIES: Array<{ id: number; name: string; mapTo: string }> = [
  { id: 1789, name: 'Điện thoại', mapTo: 'HOME' },
  { id: 1815, name: 'Máy tính & Laptop', mapTo: 'HOME' },
  { id: 1520, name: 'Thời trang nữ', mapTo: 'TEXTILES' },
  { id: 1686, name: 'Thời trang nam', mapTo: 'TEXTILES' },
  { id: 1801, name: 'Máy ảnh', mapTo: 'HOME' },
  { id: 4384, name: 'Đồng hồ', mapTo: 'JEWELRY' },
  { id: 8322, name: 'Phụ kiện thời trang', mapTo: 'JEWELRY' },
  { id: 1883, name: 'Nhà cửa & Đời sống', mapTo: 'HOME' },
  { id: 2549, name: 'Sách', mapTo: 'ART' },
  { id: 1846, name: 'Làm đẹp & Sức khỏe', mapTo: 'CERAMICS' },
  { id: 1882, name: 'Điện gia dụng', mapTo: 'HOME' },
  { id: 4221, name: 'Thực phẩm & Đồ uống', mapTo: 'FOOD' },
  { id: 11312, name: 'Giày dép', mapTo: 'TEXTILES' },
  { id: 8594, name: 'Túi xách & Ví', mapTo: 'TEXTILES' },
  { id: 1975, name: 'Thể thao & Dã ngoại', mapTo: 'HOME' },
  { id: 17166, name: 'Mẹ và Bé', mapTo: 'HOME' },
  { id: 1703, name: 'Xe máy & Phụ kiện', mapTo: 'HOME' },
  { id: 8371, name: 'Đồ chơi', mapTo: 'HOME' },
  { id: 44792, name: 'NGON (Thực phẩm)', mapTo: 'FOOD' },
  { id: 27616, name: 'Balo & Vali', mapTo: 'TEXTILES' },
  { id: 27498, name: 'Thiết bị số', mapTo: 'HOME' },
  { id: 6000, name: 'Sức khỏe', mapTo: 'CERAMICS' },
  { id: 4400, name: 'Chăm sóc nhà cửa', mapTo: 'HOME' },
  { id: 15078, name: 'Voucher & Dịch vụ', mapTo: 'HOME' },
];

interface TikiProduct {
  id: number;
  name: string;
  short_description?: string;
  price: number;
  list_price?: number;
  discount_rate?: number;
  thumbnail_url?: string;
  brand_name?: string;
  rating_average?: number;
  review_count?: number;
  quantity_sold?: { value?: number };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function crawlCategory(
  categoryId: number,
  categoryName: string,
  mapTo: string,
  maxProducts: number,
): Promise<Array<{
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  category: string;
  imageUrl: string;
  imageUrls: string[];
  tags: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  soldCount: number;
  brand: string;
}>> {
  const products: Array<ReturnType<typeof crawlCategory> extends Promise<(infer T)[]> ? T : never> = [];
  const limit = 40;
  let page = 1;
  const maxPages = Math.ceil(maxProducts / limit);

  while (products.length < maxProducts) {
    try {
      const url = `${TIKI_API}?limit=${limit}&category=${categoryId}&page=${page}`;
      const res = await fetch(url, { headers: HEADERS });

      if (!res.ok) {
        console.warn(`    HTTP ${res.status} for category ${categoryId} page ${page}, stopping`);
        break;
      }

      const data = await res.json();
      const items: TikiProduct[] = data?.data || [];

      if (items.length === 0) break;

      for (const item of items) {
        if (!item.name || !item.price) continue;

        const price = item.price; // Keep VND
        const salePrice = item.list_price && item.list_price > price ? price : null;

        products.push({
          name: item.name.slice(0, 200),
          description: (item.short_description || `${item.name}. Brand: ${item.brand_name || 'N/A'}. Category: ${categoryName}.`).slice(0, 10000),
          price,
          salePrice,
          category: mapTo,
          imageUrl: item.thumbnail_url || `https://picsum.photos/seed/${item.id}/400/400`,
          imageUrls: item.thumbnail_url ? [item.thumbnail_url] : [],
          tags: [
            categoryName.toLowerCase(),
            item.brand_name?.toLowerCase() || '',
            mapTo.toLowerCase(),
          ].filter(Boolean),
          stock: 10 + Math.floor(Math.random() * 200),
          rating: item.rating_average || 0,
          reviewCount: item.review_count || 0,
          soldCount: item.quantity_sold?.value || 0,
          brand: item.brand_name || '',
        });
      }

      const totalPages = data?.paging?.last_page || maxPages;
      if (page >= totalPages || page >= maxPages) break;

      page++;
      // Rate limit: 200ms between requests
      await sleep(200);
    } catch (err) {
      console.warn(`    Error crawling category ${categoryId} page ${page}:`, (err as Error).message);
      break;
    }
  }

  return products;
}

async function main() {
  const sellerEmail = process.argv[2] || 'seller1000@yopmail.com';
  const targetCount = parseInt(process.argv[3] || '50000', 10);

  console.log(`=== Tiki Product Crawler ===`);
  console.log(`Seller: ${sellerEmail}`);
  console.log(`Target: ${targetCount.toLocaleString()} products\n`);

  // Find seller
  const seller = await prisma.user.findFirst({ where: { userEmail: sellerEmail } });
  if (!seller) {
    console.error(`Seller ${sellerEmail} not found!`);
    process.exit(1);
  }
  const sellerId = seller.id;
  console.log(`Seller ID: ${sellerId}\n`);

  // Check existing
  const existing = await prisma.product.count({ where: { sellerId } });
  const remaining = targetCount - existing;
  if (remaining <= 0) {
    console.log(`Already have ${existing} products. Done!`);
    process.exit(0);
  }
  console.log(`Existing: ${existing} | Need: ${remaining}\n`);

  // Delete old products for clean crawl
  if (existing > 0) {
    console.log(`Deleting ${existing} old products...`);
    await prisma.orderStatusHistory.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.product.deleteMany({ where: { sellerId } });
    console.log('Done.\n');
  }

  // Calculate how many products per category
  const perCategory = Math.ceil(targetCount / TIKI_CATEGORIES.length);
  console.log(`Crawling ~${perCategory} products from each of ${TIKI_CATEGORIES.length} categories\n`);

  // Crawl all categories
  console.log('Step 1: Crawling Tiki categories...');
  const allProducts: Array<{
    name: string; description: string; price: number; salePrice: number | null;
    category: string; imageUrl: string; imageUrls: string[]; tags: string[];
    stock: number; rating: number; reviewCount: number; soldCount: number; brand: string;
  }> = [];

  for (const cat of TIKI_CATEGORIES) {
    const products = await crawlCategory(cat.id, cat.name, cat.mapTo, perCategory);
    allProducts.push(...products);
    console.log(`  ${cat.name}: ${products.length} products (total: ${allProducts.length})`);

    if (allProducts.length >= targetCount) break;
  }

  // Trim to target
  const toInsert = allProducts.slice(0, targetCount);
  console.log(`\nTotal crawled: ${allProducts.length} → inserting ${toInsert.length}\n`);

  // Insert in batches
  console.log('Step 2: Inserting into database...');
  let inserted = 0;
  const startTime = Date.now();

  // Deduplicate by name
  const seen = new Set<string>();
  const unique = toInsert.filter((p) => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });
  console.log(`  Unique products after dedup: ${unique.length}`);

  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);
    const data = batch.map((p) => ({
      sellerId,
      prdNm: p.name,
      prdDc: p.description,
      prdPrc: p.price,
      prdSalePrc: p.salePrice,
      prdCtgrCd: p.category,
      prdSttsCd: 'ACTV' as const,
      prdImgUrl: p.imageUrl,
      prdImgUrls: p.imageUrls,
      stckQty: p.stock,
      soldCnt: p.soldCount,
      viewCnt: Math.floor(Math.random() * 1000),
      avgRtng: p.rating,
      rvwCnt: p.reviewCount,
      srchTags: p.tags,
      rgtrId: String(sellerId),
      mdfrId: String(sellerId),
    }));

    await prisma.product.createMany({ data });
    inserted += batch.length;

    if (inserted % 5000 === 0 || inserted >= unique.length) {
      const sec = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  ${inserted.toLocaleString()}/${unique.length.toLocaleString()} (${Math.round(inserted / unique.length * 100)}%) — ${sec}s`);
    }
  }

  // Summary
  const finalCount = await prisma.product.count({ where: { sellerId } });
  const byCategory = await prisma.product.groupBy({
    by: ['prdCtgrCd'],
    where: { sellerId },
    _count: true,
    orderBy: { _count: { prdCtgrCd: 'desc' } },
  });

  console.log('\n=== Summary ===');
  console.log(`Total products for ${sellerEmail}: ${finalCount.toLocaleString()}`);
  console.log('\nBy category:');
  for (const c of byCategory) {
    console.log(`  ${c.prdCtgrCd}: ${c._count.toLocaleString()}`);
  }

  await prisma.$disconnect();
  console.log('\nDone!');
}

main().catch((e) => {
  console.error('Failed:', e);
  process.exit(1);
});

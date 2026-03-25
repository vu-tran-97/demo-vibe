/**
 * Product Crawler Bot — Crawls product data from DummyJSON + Fakestoreapi
 * and inserts directly via Prisma to generate ~50,000 products for sellers.
 *
 * Data sources:
 *   - DummyJSON (https://dummyjson.com/products) — 194 products
 *   - FakeStore (https://fakestoreapi.com/products) — 20 products
 *   - Picsum Photos for extra images
 *
 * Strategy: Crawl real data, then multiply with variations to reach 50K.
 *
 * Usage: npx tsx scripts/crawl-products.ts
 *
 * Prerequisites:
 *   - PostgreSQL running
 *   - Seller users already seeded (run seed-users.ts first)
 */

import { PrismaClient } from '.prisma/client';

const prisma = new PrismaClient();

const TOTAL_TARGET = 50_000;
const BATCH_SIZE = 500;

// Category mapping to match our enum
const CATEGORY_MAP: Record<string, string> = {
  // DummyJSON categories
  beauty: 'CERAMICS',
  fragrances: 'CERAMICS',
  furniture: 'HOME',
  groceries: 'FOOD',
  'home-decoration': 'HOME',
  'kitchen-accessories': 'HOME',
  laptops: 'HOME',
  'mens-shirts': 'TEXTILES',
  'mens-shoes': 'TEXTILES',
  'mens-watches': 'JEWELRY',
  'mobile-accessories': 'HOME',
  motorcycle: 'HOME',
  'skin-care': 'CERAMICS',
  smartphones: 'HOME',
  'sports-accessories': 'HOME',
  sunglasses: 'JEWELRY',
  tablets: 'HOME',
  tops: 'TEXTILES',
  vehicle: 'HOME',
  'womens-bags': 'TEXTILES',
  'womens-dresses': 'TEXTILES',
  'womens-jewellery': 'JEWELRY',
  'womens-shoes': 'TEXTILES',
  'womens-watches': 'JEWELRY',
  // FakeStore categories
  electronics: 'HOME',
  jewelery: 'JEWELRY',
  "men's clothing": 'TEXTILES',
  "women's clothing": 'TEXTILES',
};

const CATEGORIES = ['CERAMICS', 'TEXTILES', 'ART', 'JEWELRY', 'HOME', 'FOOD'];

interface CrawledProduct {
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  category: string;
  imageUrl: string;
  imageUrls: string[];
  tags: string[];
  stock: number;
}

// ─── Data Sources ───────────────────────────────────────────

async function crawlDummyJSON(): Promise<CrawledProduct[]> {
  console.log('  Crawling DummyJSON...');
  const products: CrawledProduct[] = [];
  let skip = 0;
  const limit = 30;

  while (true) {
    const res = await fetch(`https://dummyjson.com/products?limit=${limit}&skip=${skip}`);
    const data = await res.json();

    if (!data.products || data.products.length === 0) break;

    for (const p of data.products) {
      products.push({
        name: p.title,
        description: p.description,
        price: Math.round(p.price * 1000), // Convert to KRW-like
        salePrice: p.discountPercentage > 10
          ? Math.round(p.price * 1000 * (1 - p.discountPercentage / 100))
          : null,
        category: CATEGORY_MAP[p.category] || 'HOME',
        imageUrl: p.thumbnail || p.images?.[0] || `https://picsum.photos/seed/${p.id}/400/400`,
        imageUrls: (p.images || []).slice(0, 5),
        tags: p.tags || [],
        stock: p.stock || Math.floor(Math.random() * 200) + 10,
      });
    }

    skip += limit;
    if (skip >= data.total) break;

    await sleep(200);
  }

  console.log(`    → Got ${products.length} products`);
  return products;
}

async function crawlFakeStore(): Promise<CrawledProduct[]> {
  console.log('  Crawling FakeStoreAPI...');
  const res = await fetch('https://fakestoreapi.com/products');
  const data = await res.json();

  const products: CrawledProduct[] = data.map((p: {
    title: string;
    description: string;
    price: number;
    category: string;
    image: string;
    rating: { rate: number; count: number };
  }) => ({
    name: p.title,
    description: p.description,
    price: Math.round(p.price * 1000),
    salePrice: Math.random() > 0.6 ? Math.round(p.price * 1000 * 0.85) : null,
    category: CATEGORY_MAP[p.category] || 'HOME',
    imageUrl: p.image,
    imageUrls: [p.image],
    tags: [p.category],
    stock: Math.floor(Math.random() * 300) + 20,
  }));

  console.log(`    → Got ${products.length} products`);
  return products;
}

// ─── Variation Generator ────────────────────────────────────

const ADJECTIVES = [
  'Premium', 'Deluxe', 'Classic', 'Modern', 'Vintage', 'Handmade',
  'Artisan', 'Organic', 'Luxury', 'Limited Edition', 'Signature',
  'Exclusive', 'Traditional', 'Custom', 'Natural', 'Eco-Friendly',
  'Rustic', 'Elegant', 'Minimalist', 'Bohemian', 'Refined',
  'Heritage', 'Curated', 'Bespoke', 'Sustainable', 'Designer',
];

const COLORS = [
  'Ivory', 'Crimson', 'Sage', 'Midnight', 'Sand', 'Coral',
  'Forest', 'Ocean', 'Sunset', 'Pearl', 'Copper', 'Slate',
  'Ruby', 'Emerald', 'Amber', 'Indigo', 'Blush', 'Charcoal',
  'Olive', 'Terracotta', 'Lavender', 'Teal', 'Burgundy', 'Gold',
];

const SIZES = ['Small', 'Medium', 'Large', 'XL', 'Mini', 'Standard', 'Oversized', 'Compact'];

function generateVariation(base: CrawledProduct, index: number): CrawledProduct {
  const adj = ADJECTIVES[index % ADJECTIVES.length];
  const color = COLORS[Math.floor(index / ADJECTIVES.length) % COLORS.length];
  const size = SIZES[Math.floor(index / (ADJECTIVES.length * COLORS.length)) % SIZES.length];

  // Price variation: ±30%
  const priceMultiplier = 0.7 + Math.random() * 0.6;
  const price = Math.round(base.price * priceMultiplier);

  // Alternate category occasionally
  const category = Math.random() > 0.85
    ? CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
    : base.category;

  return {
    name: `${adj} ${color} ${base.name} - ${size}`.slice(0, 200),
    description: `${adj} edition. ${base.description} Available in ${color.toLowerCase()} color, ${size.toLowerCase()} size. Crafted with attention to detail and quality materials.`.slice(0, 10000),
    price,
    salePrice: Math.random() > 0.65 ? Math.round(price * (0.75 + Math.random() * 0.15)) : null,
    category,
    imageUrl: base.imageUrl,
    imageUrls: base.imageUrls,
    tags: [...base.tags, adj.toLowerCase(), color.toLowerCase(), size.toLowerCase()].slice(0, 10),
    stock: Math.floor(Math.random() * 500) + 5,
  };
}

// ─── Database Insert ────────────────────────────────────────

async function getSellerIds(): Promise<number[]> {
  const sellers = await prisma.user.findMany({
    where: { useRoleCd: 'SELLER', delYn: 'N' },
    select: { id: true },
    orderBy: { id: 'asc' },
  });
  return sellers.map((s: { id: number }) => s.id);
}

async function insertBatch(products: CrawledProduct[], sellerIds: number[], offset: number) {
  const data = products.map((p, i) => {
    const sellerId = sellerIds[(offset + i) % sellerIds.length];
    return {
      sellerId,
      prdNm: p.name,
      prdDc: p.description,
      prdPrc: p.price,
      prdSalePrc: p.salePrice,
      prdCtgrCd: p.category,
      prdSttsCd: 'ACTV',
      prdImgUrl: p.imageUrl,
      prdImgUrls: p.imageUrls,
      stckQty: p.stock,
      soldCnt: Math.floor(Math.random() * 50),
      viewCnt: Math.floor(Math.random() * 500),
      avgRtng: Math.round((3 + Math.random() * 2) * 10) / 10,
      rvwCnt: Math.floor(Math.random() * 30),
      srchTags: p.tags,
      rgtrId: String(sellerId),
      mdfrId: String(sellerId),
    };
  });

  await prisma.product.createMany({ data });
}

// ─── Main ───────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('=== Product Crawler Bot ===');
  console.log(`Target: ${TOTAL_TARGET.toLocaleString()} products\n`);

  // 1. Get seller IDs
  const sellerIds = await getSellerIds();
  if (sellerIds.length === 0) {
    console.error('No sellers found! Run seed-users.ts first.');
    process.exit(1);
  }
  console.log(`Found ${sellerIds.length} sellers: [${sellerIds.join(', ')}]\n`);

  // 2. Check existing product count
  const existingCount = await prisma.product.count();
  const remaining = TOTAL_TARGET - existingCount;
  if (remaining <= 0) {
    console.log(`Already have ${existingCount} products. Target reached!`);
    process.exit(0);
  }
  console.log(`Existing products: ${existingCount}, need ${remaining} more\n`);

  // 3. Crawl source data
  console.log('Step 1: Crawling source data...');
  const [dummyProducts, fakeProducts] = await Promise.all([
    crawlDummyJSON(),
    crawlFakeStore(),
  ]);
  const sourceProducts = [...dummyProducts, ...fakeProducts];
  console.log(`Total source products: ${sourceProducts.length}\n`);

  // 4. Generate variations to reach target
  console.log('Step 2: Generating variations and inserting...');
  let inserted = 0;
  let variationIndex = 0;
  const startTime = Date.now();

  while (inserted < remaining) {
    const batch: CrawledProduct[] = [];
    const batchTarget = Math.min(BATCH_SIZE, remaining - inserted);

    for (let i = 0; i < batchTarget; i++) {
      if (variationIndex < sourceProducts.length) {
        // Use original first
        batch.push(sourceProducts[variationIndex]);
      } else {
        // Generate variation from source pool
        const baseIdx = (variationIndex - sourceProducts.length) % sourceProducts.length;
        batch.push(generateVariation(sourceProducts[baseIdx], variationIndex));
      }
      variationIndex++;
    }

    await insertBatch(batch, sellerIds, inserted);
    inserted += batch.length;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = Math.round(inserted / ((Date.now() - startTime) / 1000));
    const pct = ((inserted / remaining) * 100).toFixed(1);
    process.stdout.write(`\r  Progress: ${inserted.toLocaleString()}/${remaining.toLocaleString()} (${pct}%) — ${rate} products/sec — ${elapsed}s elapsed`);
  }

  console.log('\n');

  // 5. Summary
  const totalCount = await prisma.product.count();
  const perSeller = await prisma.product.groupBy({
    by: ['sellerId'],
    _count: true,
    orderBy: { _count: { sellerId: 'desc' } },
  });

  console.log('=== Summary ===');
  console.log(`Total products in DB: ${totalCount.toLocaleString()}`);
  console.log(`Products per seller:`);
  for (const s of perSeller.slice(0, 5)) {
    console.log(`  Seller #${s.sellerId}: ${s._count.toLocaleString()} products`);
  }
  if (perSeller.length > 5) {
    console.log(`  ... and ${perSeller.length - 5} more sellers`);
  }

  const avgPerSeller = Math.round(totalCount / sellerIds.length);
  console.log(`\nAverage: ~${avgPerSeller.toLocaleString()} products per seller`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  category: string;
  categoryLabel: string;
  imageUrl: string;
  stock: number;
  sold: number;
  views: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  seller: {
    name: string;
    nickname: string;
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  CERAMICS: 'Ceramics & Pottery',
  TEXTILES: 'Textiles & Fabrics',
  ART: 'Art & Prints',
  JEWELRY: 'Jewelry & Accessories',
  HOME: 'Home & Living',
  FOOD: 'Food & Beverages',
};

export const CATEGORIES = Object.entries(CATEGORY_LABELS).map(([code, label]) => ({
  code,
  label,
}));

export const PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Handcrafted Ceramic Vase',
    description: 'A beautifully hand-thrown ceramic vase with a unique speckled glaze. Each piece is one-of-a-kind, perfect for fresh or dried flower arrangements. Crafted with care in our Seoul studio using traditional Korean pottery techniques.',
    price: 128.00,
    salePrice: null,
    category: 'CERAMICS',
    categoryLabel: 'Ceramics & Pottery',
    imageUrl: '/products/ceramic-vase.jpg',
    stock: 12,
    sold: 142,
    views: 2840,
    rating: 4.8,
    reviewCount: 56,
    tags: ['ceramic', 'vase', 'handmade', 'pottery', 'korean'],
    seller: { name: "Minji's Ceramics", nickname: 'minji_ceramics' },
  },
  {
    id: 'prod-002',
    name: 'Linen Table Runner',
    description: 'Premium Belgian linen table runner in a warm natural tone. Pre-washed for softness and durability. The perfect foundation for any tablescape — casual or formal.',
    price: 64.00,
    salePrice: 48.00,
    category: 'TEXTILES',
    categoryLabel: 'Textiles & Fabrics',
    imageUrl: '/products/linen-runner.jpg',
    stock: 35,
    sold: 98,
    views: 1920,
    rating: 4.6,
    reviewCount: 38,
    tags: ['linen', 'table', 'runner', 'natural', 'belgian'],
    seller: { name: 'Seonwoo Textiles', nickname: 'seonwoo_textiles' },
  },
  {
    id: 'prod-003',
    name: 'Artisan Coffee Set',
    description: 'A curated set of two espresso cups and saucers in our signature earth-tone glaze. Microwave and dishwasher safe. Makes a thoughtful gift for coffee lovers.',
    price: 96.00,
    salePrice: null,
    category: 'CERAMICS',
    categoryLabel: 'Ceramics & Pottery',
    imageUrl: '/products/coffee-set.jpg',
    stock: 8,
    sold: 87,
    views: 1650,
    rating: 4.9,
    reviewCount: 42,
    tags: ['coffee', 'cups', 'espresso', 'ceramic', 'gift'],
    seller: { name: "Minji's Ceramics", nickname: 'minji_ceramics' },
  },
  {
    id: 'prod-004',
    name: 'Botanical Print — Monstera',
    description: 'Hand-illustrated botanical print on premium archival paper. Unframed, ships flat in a protective tube. Available in A3 and A2 sizes.',
    price: 42.00,
    salePrice: null,
    category: 'ART',
    categoryLabel: 'Art & Prints',
    imageUrl: '/products/botanical-print.jpg',
    stock: 50,
    sold: 76,
    views: 1280,
    rating: 4.7,
    reviewCount: 29,
    tags: ['botanical', 'print', 'monstera', 'art', 'illustration'],
    seller: { name: 'Yuna Art Studio', nickname: 'yuna_art' },
  },
  {
    id: 'prod-005',
    name: 'Silk Scarf — Morning Bloom',
    description: '100% mulberry silk scarf with hand-rolled edges. Features an original watercolor floral design. Lightweight and versatile — wear it as a scarf, headband, or bag accessory.',
    price: 78.00,
    salePrice: 62.00,
    category: 'TEXTILES',
    categoryLabel: 'Textiles & Fabrics',
    imageUrl: '/products/silk-scarf.jpg',
    stock: 20,
    sold: 65,
    views: 980,
    rating: 4.5,
    reviewCount: 21,
    tags: ['silk', 'scarf', 'floral', 'accessory', 'mulberry'],
    seller: { name: 'Seonwoo Textiles', nickname: 'seonwoo_textiles' },
  },
  {
    id: 'prod-006',
    name: 'Abstract Landscape — Golden Hour',
    description: 'Original acrylic painting on stretched canvas. A warm, atmospheric landscape capturing the magic of golden hour. Ready to hang.',
    price: 320.00,
    salePrice: null,
    category: 'ART',
    categoryLabel: 'Art & Prints',
    imageUrl: '/products/abstract-landscape.jpg',
    stock: 1,
    sold: 12,
    views: 890,
    rating: 5.0,
    reviewCount: 8,
    tags: ['painting', 'abstract', 'landscape', 'acrylic', 'original'],
    seller: { name: 'Yuna Art Studio', nickname: 'yuna_art' },
  },
  {
    id: 'prod-007',
    name: 'Stoneware Dinner Plate Set',
    description: 'Set of 4 dinner plates in our minimalist stoneware collection. Matte finish with a subtle organic texture. Oven, microwave, and dishwasher safe.',
    price: 156.00,
    salePrice: 128.00,
    category: 'CERAMICS',
    categoryLabel: 'Ceramics & Pottery',
    imageUrl: '/products/dinner-plates.jpg',
    stock: 15,
    sold: 54,
    views: 1120,
    rating: 4.7,
    reviewCount: 24,
    tags: ['plates', 'stoneware', 'dinner', 'set', 'minimalist'],
    seller: { name: "Minji's Ceramics", nickname: 'minji_ceramics' },
  },
  {
    id: 'prod-008',
    name: 'Minimalist Line Art — Face',
    description: 'Elegant single-line drawing on heavyweight cotton paper. A modern, gallery-worthy piece that complements any interior style. Unframed.',
    price: 36.00,
    salePrice: null,
    category: 'ART',
    categoryLabel: 'Art & Prints',
    imageUrl: '/products/line-art.jpg',
    stock: 40,
    sold: 118,
    views: 2100,
    rating: 4.4,
    reviewCount: 45,
    tags: ['line art', 'minimalist', 'face', 'drawing', 'modern'],
    seller: { name: 'Yuna Art Studio', nickname: 'yuna_art' },
  },
  {
    id: 'prod-009',
    name: 'Wool Throw Blanket',
    description: 'Luxuriously soft merino wool throw in a timeless herringbone pattern. Ethically sourced from New Zealand. Perfect for cozy evenings.',
    price: 189.00,
    salePrice: null,
    category: 'TEXTILES',
    categoryLabel: 'Textiles & Fabrics',
    imageUrl: '/products/wool-throw.jpg',
    stock: 10,
    sold: 33,
    views: 760,
    rating: 4.8,
    reviewCount: 15,
    tags: ['wool', 'throw', 'blanket', 'merino', 'herringbone'],
    seller: { name: 'Seonwoo Textiles', nickname: 'seonwoo_textiles' },
  },
  {
    id: 'prod-010',
    name: 'Incense Holder — Cloud',
    description: 'A cloud-shaped ceramic incense holder with a gentle curve to catch ash. Comes with a sample pack of 10 sandalwood incense sticks.',
    price: 34.00,
    salePrice: null,
    category: 'HOME',
    categoryLabel: 'Home & Living',
    imageUrl: '/products/incense-holder.jpg',
    stock: 25,
    sold: 201,
    views: 3200,
    rating: 4.6,
    reviewCount: 78,
    tags: ['incense', 'holder', 'ceramic', 'cloud', 'home'],
    seller: { name: "Minji's Ceramics", nickname: 'minji_ceramics' },
  },
  {
    id: 'prod-011',
    name: 'Cotton Tote — Earth',
    description: 'Heavy-duty organic cotton tote bag with reinforced handles. Screen-printed with an original botanical design. Perfect for daily use or as a reusable shopping bag.',
    price: 28.00,
    salePrice: null,
    category: 'TEXTILES',
    categoryLabel: 'Textiles & Fabrics',
    imageUrl: '/products/cotton-tote.jpg',
    stock: 60,
    sold: 245,
    views: 4100,
    rating: 4.3,
    reviewCount: 92,
    tags: ['tote', 'cotton', 'bag', 'organic', 'botanical'],
    seller: { name: 'Seonwoo Textiles', nickname: 'seonwoo_textiles' },
  },
  {
    id: 'prod-012',
    name: 'Watercolor Set — Seasons',
    description: 'Set of 4 small watercolor prints, one for each season. Printed on textured cotton rag paper. Each print is 5x7 inches.',
    price: 58.00,
    salePrice: 45.00,
    category: 'ART',
    categoryLabel: 'Art & Prints',
    imageUrl: '/products/watercolor-set.jpg',
    stock: 30,
    sold: 89,
    views: 1540,
    rating: 4.9,
    reviewCount: 36,
    tags: ['watercolor', 'print', 'seasons', 'set', 'art'],
    seller: { name: 'Yuna Art Studio', nickname: 'yuna_art' },
  },
];

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getProductsByCategory(category: string): Product[] {
  return PRODUCTS.filter((p) => p.category === category);
}

export function getFeaturedProducts(): Product[] {
  return [...PRODUCTS].sort((a, b) => b.sold - a.sold).slice(0, 4);
}

export function getOnSaleProducts(): Product[] {
  return PRODUCTS.filter((p) => p.salePrice !== null);
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

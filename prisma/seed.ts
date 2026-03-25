import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CODE_GROUPS = [
  { cdGrpId: "USER_STTS", cdGrpNm: "User Status", cdGrpDc: "User account status codes" },
  { cdGrpId: "LGN_RSLT", cdGrpNm: "Login Result", cdGrpDc: "Login attempt result codes" },
  { cdGrpId: "SCL_PRVD", cdGrpNm: "Social Provider", cdGrpDc: "Social login provider codes" },
  { cdGrpId: "POST_CTGR", cdGrpNm: "Post Category", cdGrpDc: "Board post category codes" },
  { cdGrpId: "CHAT_ROOM_TYPE", cdGrpNm: "Chat Room Type", cdGrpDc: "Chat room type codes" },
  { cdGrpId: "MSG_TYPE", cdGrpNm: "Message Type", cdGrpDc: "Chat message type codes" },
  { cdGrpId: "ATCH_TYPE", cdGrpNm: "Attachment Type", cdGrpDc: "File attachment type codes" },
  { cdGrpId: "USE_ROLE", cdGrpNm: "User Role", cdGrpDc: "User role classification codes" },
  { cdGrpId: "PRD_CTGR", cdGrpNm: "Product Category", cdGrpDc: "Product category codes" },
  { cdGrpId: "PRD_STTS", cdGrpNm: "Product Status", cdGrpDc: "Product status codes" },
];

const CODES: Array<{ cdGrpId: string; cdVal: string; cdNm: string; sortSn: number }> = [
  { cdGrpId: "USER_STTS", cdVal: "ACTV", cdNm: "Active", sortSn: 1 },
  { cdGrpId: "USER_STTS", cdVal: "INAC", cdNm: "Inactive", sortSn: 2 },
  { cdGrpId: "USER_STTS", cdVal: "SUSP", cdNm: "Suspended", sortSn: 3 },
  { cdGrpId: "LGN_RSLT", cdVal: "SUCC", cdNm: "Success", sortSn: 1 },
  { cdGrpId: "LGN_RSLT", cdVal: "FAIL", cdNm: "Failure", sortSn: 2 },
  { cdGrpId: "SCL_PRVD", cdVal: "GOOGLE", cdNm: "Google", sortSn: 1 },
  { cdGrpId: "SCL_PRVD", cdVal: "KAKAO", cdNm: "Kakao", sortSn: 2 },
  { cdGrpId: "SCL_PRVD", cdVal: "NAVER", cdNm: "Naver", sortSn: 3 },
  { cdGrpId: "POST_CTGR", cdVal: "NOTICE", cdNm: "Notice", sortSn: 1 },
  { cdGrpId: "POST_CTGR", cdVal: "FREE", cdNm: "Free Board", sortSn: 2 },
  { cdGrpId: "POST_CTGR", cdVal: "QNA", cdNm: "Q&A", sortSn: 3 },
  { cdGrpId: "POST_CTGR", cdVal: "REVIEW", cdNm: "Product Review", sortSn: 4 },
  { cdGrpId: "CHAT_ROOM_TYPE", cdVal: "DM", cdNm: "Direct Message", sortSn: 1 },
  { cdGrpId: "CHAT_ROOM_TYPE", cdVal: "GROUP", cdNm: "Group Chat", sortSn: 2 },
  { cdGrpId: "MSG_TYPE", cdVal: "TEXT", cdNm: "Text", sortSn: 1 },
  { cdGrpId: "MSG_TYPE", cdVal: "IMG", cdNm: "Image", sortSn: 2 },
  { cdGrpId: "MSG_TYPE", cdVal: "FILE", cdNm: "File", sortSn: 3 },
  { cdGrpId: "ATCH_TYPE", cdVal: "IMG", cdNm: "Image", sortSn: 1 },
  { cdGrpId: "ATCH_TYPE", cdVal: "DOC", cdNm: "Document", sortSn: 2 },
  { cdGrpId: "ATCH_TYPE", cdVal: "VIDEO", cdNm: "Video", sortSn: 3 },
  { cdGrpId: "USE_ROLE", cdVal: "SUPER_ADMIN", cdNm: "Super Admin", sortSn: 1 },
  { cdGrpId: "USE_ROLE", cdVal: "SELLER", cdNm: "Seller", sortSn: 2 },
  { cdGrpId: "USE_ROLE", cdVal: "BUYER", cdNm: "Buyer", sortSn: 3 },
  { cdGrpId: "PRD_CTGR", cdVal: "CERAMICS", cdNm: "Ceramics & Pottery", sortSn: 1 },
  { cdGrpId: "PRD_CTGR", cdVal: "TEXTILES", cdNm: "Textiles & Fabrics", sortSn: 2 },
  { cdGrpId: "PRD_CTGR", cdVal: "ART", cdNm: "Art & Prints", sortSn: 3 },
  { cdGrpId: "PRD_CTGR", cdVal: "JEWELRY", cdNm: "Jewelry & Accessories", sortSn: 4 },
  { cdGrpId: "PRD_CTGR", cdVal: "HOME", cdNm: "Home & Living", sortSn: 5 },
  { cdGrpId: "PRD_CTGR", cdVal: "FOOD", cdNm: "Food & Beverages", sortSn: 6 },
  { cdGrpId: "PRD_STTS", cdVal: "ACTV", cdNm: "Active", sortSn: 1 },
  { cdGrpId: "PRD_STTS", cdVal: "SOLD_OUT", cdNm: "Sold Out", sortSn: 2 },
  { cdGrpId: "PRD_STTS", cdVal: "DRAFT", cdNm: "Draft", sortSn: 3 },
];

// ── Product templates per seller (50 each) ──

const CATEGORIES = ["CERAMICS", "TEXTILES", "ART", "JEWELRY", "HOME", "FOOD"] as const;

const PRODUCT_IMAGES: Record<string, string[]> = {
  CERAMICS: [
    "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1603199506016-5f36e6d72b0e?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&h=600&fit=crop",
  ],
  TEXTILES: [
    "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1580301762395-21ce6d5d4bc4?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1597633425046-08f5110420b5?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=600&h=600&fit=crop",
  ],
  ART: [
    "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&h=600&fit=crop",
  ],
  JEWELRY: [
    "https://images.unsplash.com/photo-1515562141589-67f0d569b6c6?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&h=600&fit=crop",
  ],
  HOME: [
    "https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop",
  ],
  FOOD: [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&h=600&fit=crop",
  ],
};

const PRODUCT_TEMPLATES: Record<string, Array<{ name: string; desc: string; tags: string[] }>> = {
  CERAMICS: [
    { name: "Handcrafted Ceramic Vase", desc: "A beautifully hand-thrown ceramic vase with a unique speckled glaze.", tags: ["ceramic", "vase", "handmade"] },
    { name: "Artisan Coffee Mug Set", desc: "Set of two espresso cups with signature earth-tone glaze.", tags: ["coffee", "mug", "ceramic"] },
    { name: "Stoneware Dinner Plate", desc: "Minimalist stoneware dinner plate with matte finish.", tags: ["plate", "stoneware", "dinner"] },
    { name: "Ceramic Planter Pot", desc: "Indoor planter with drainage hole and saucer.", tags: ["planter", "ceramic", "indoor"] },
    { name: "Porcelain Tea Set", desc: "Elegant porcelain tea set for two with delicate patterns.", tags: ["tea", "porcelain", "set"] },
    { name: "Raku Bowl", desc: "Decorative raku-fired bowl with copper metallic glaze.", tags: ["raku", "bowl", "decorative"] },
    { name: "Ceramic Candle Holder", desc: "Minimalist taper candle holder in matte white.", tags: ["candle", "holder", "minimal"] },
    { name: "Serving Bowl — Large", desc: "Large serving bowl perfect for salads and pasta.", tags: ["serving", "bowl", "kitchen"] },
    { name: "Ceramic Soap Dish", desc: "Bathroom soap dish with drainage grooves.", tags: ["soap", "dish", "bathroom"] },
    { name: "Speckled Tumbler", desc: "Rustic drinking tumbler with speckled glaze finish.", tags: ["tumbler", "rustic", "speckled"] },
  ],
  TEXTILES: [
    { name: "Linen Table Runner", desc: "Premium Belgian linen table runner in warm natural tone.", tags: ["linen", "table", "runner"] },
    { name: "Silk Scarf — Bloom", desc: "100% mulberry silk scarf with floral watercolor design.", tags: ["silk", "scarf", "floral"] },
    { name: "Wool Throw Blanket", desc: "Merino wool throw in timeless herringbone pattern.", tags: ["wool", "throw", "blanket"] },
    { name: "Cotton Tote Bag", desc: "Heavy-duty organic cotton tote with botanical print.", tags: ["tote", "cotton", "bag"] },
    { name: "Linen Napkin Set", desc: "Set of 4 pre-washed linen napkins in earth tones.", tags: ["napkin", "linen", "set"] },
    { name: "Cashmere Beanie", desc: "Pure cashmere knit beanie in classic ribbed design.", tags: ["cashmere", "beanie", "knit"] },
    { name: "Embroidered Cushion", desc: "Hand-embroidered cushion cover with geometric motifs.", tags: ["cushion", "embroidered", "geometric"] },
    { name: "Woven Wall Hanging", desc: "Macramé wall hanging with natural cotton rope.", tags: ["macrame", "wall", "hanging"] },
    { name: "Linen Apron", desc: "Full-length cross-back linen apron for kitchen or studio.", tags: ["apron", "linen", "kitchen"] },
    { name: "Cotton Baby Blanket", desc: "Ultra-soft organic cotton baby blanket in pastel colors.", tags: ["baby", "blanket", "cotton"] },
  ],
  ART: [
    { name: "Botanical Print — Monstera", desc: "Hand-illustrated botanical print on archival paper.", tags: ["botanical", "print", "monstera"] },
    { name: "Abstract Landscape", desc: "Original acrylic painting capturing golden hour.", tags: ["abstract", "landscape", "acrylic"] },
    { name: "Line Art — Face", desc: "Elegant single-line drawing on heavyweight cotton paper.", tags: ["line art", "face", "minimal"] },
    { name: "Watercolor Seasons Set", desc: "Set of 4 watercolor prints, one for each season.", tags: ["watercolor", "seasons", "set"] },
    { name: "Ocean Wave Print", desc: "Large-format photograph of Pacific waves at sunrise.", tags: ["ocean", "wave", "photo"] },
    { name: "Geometric Poster", desc: "Modern geometric composition in muted pastel tones.", tags: ["geometric", "poster", "modern"] },
    { name: "Charcoal Portrait", desc: "Custom charcoal portrait sketch on textured paper.", tags: ["charcoal", "portrait", "sketch"] },
    { name: "Typography Print", desc: "Inspirational quote in hand-lettered calligraphy.", tags: ["typography", "quote", "calligraphy"] },
    { name: "Nature Photography", desc: "Fine art nature print of misty forest morning.", tags: ["nature", "photography", "forest"] },
    { name: "Digital Illustration", desc: "Vibrant digital art print of cityscape at night.", tags: ["digital", "illustration", "city"] },
  ],
  JEWELRY: [
    { name: "Gold Hoop Earrings", desc: "14K gold-filled hoop earrings, lightweight and hypoallergenic.", tags: ["gold", "hoops", "earrings"] },
    { name: "Silver Chain Necklace", desc: "Sterling silver layering chain with adjustable length.", tags: ["silver", "chain", "necklace"] },
    { name: "Pearl Drop Earrings", desc: "Freshwater pearl drops on gold vermeil hooks.", tags: ["pearl", "drop", "earrings"] },
    { name: "Beaded Bracelet", desc: "Natural stone beaded bracelet with toggle clasp.", tags: ["beaded", "bracelet", "stone"] },
    { name: "Signet Ring", desc: "Unisex signet ring in brushed sterling silver.", tags: ["signet", "ring", "unisex"] },
    { name: "Crystal Pendant", desc: "Raw amethyst crystal pendant on gold chain.", tags: ["crystal", "pendant", "amethyst"] },
    { name: "Charm Anklet", desc: "Dainty gold anklet with star and moon charms.", tags: ["anklet", "charm", "gold"] },
    { name: "Leather Cuff", desc: "Hand-stamped leather cuff bracelet in tan.", tags: ["leather", "cuff", "bracelet"] },
    { name: "Gemstone Studs", desc: "Tiny gemstone stud earrings in turquoise.", tags: ["gemstone", "studs", "turquoise"] },
    { name: "Layered Ring Set", desc: "Set of 3 stackable thin gold bands.", tags: ["ring", "set", "stackable"] },
  ],
  HOME: [
    { name: "Incense Holder — Cloud", desc: "Cloud-shaped ceramic incense holder with ash catcher.", tags: ["incense", "holder", "ceramic"] },
    { name: "Soy Candle — Lavender", desc: "Hand-poured soy wax candle with French lavender scent.", tags: ["candle", "soy", "lavender"] },
    { name: "Wooden Serving Board", desc: "Acacia wood cutting and serving board with handle.", tags: ["wood", "serving", "board"] },
    { name: "Rattan Storage Basket", desc: "Hand-woven rattan basket for blankets and throws.", tags: ["rattan", "basket", "storage"] },
    { name: "Brass Photo Frame", desc: "Vintage-style brass photo frame for 5x7 prints.", tags: ["brass", "frame", "photo"] },
    { name: "Cork Coaster Set", desc: "Set of 6 natural cork coasters with geometric prints.", tags: ["cork", "coaster", "set"] },
    { name: "Glass Terrarium", desc: "Geometric glass terrarium for succulents and air plants.", tags: ["terrarium", "glass", "plants"] },
    { name: "Linen Tissue Cover", desc: "Minimalist linen tissue box cover in charcoal.", tags: ["tissue", "cover", "linen"] },
    { name: "Marble Tray", desc: "Polished white marble vanity tray for accessories.", tags: ["marble", "tray", "vanity"] },
    { name: "Reed Diffuser", desc: "Natural reed diffuser with eucalyptus essential oil.", tags: ["diffuser", "reed", "eucalyptus"] },
  ],
  FOOD: [
    { name: "Artisan Honey Jar", desc: "Raw wildflower honey from local Korean apiaries.", tags: ["honey", "raw", "artisan"] },
    { name: "Loose Leaf Tea — Oolong", desc: "Premium Taiwanese high-mountain oolong tea.", tags: ["tea", "oolong", "loose leaf"] },
    { name: "Dark Chocolate Truffles", desc: "Handmade Belgian dark chocolate truffles, box of 12.", tags: ["chocolate", "truffles", "dark"] },
    { name: "Granola — Maple Pecan", desc: "Small-batch granola with maple syrup and toasted pecans.", tags: ["granola", "maple", "pecan"] },
    { name: "Hot Sauce — Gochujang", desc: "Fermented gochujang hot sauce with smoky kick.", tags: ["hot sauce", "gochujang", "fermented"] },
    { name: "Dried Fruit Mix", desc: "Sun-dried mixed fruit pack: mango, pineapple, strawberry.", tags: ["dried", "fruit", "mix"] },
    { name: "Olive Oil — Extra Virgin", desc: "Cold-pressed extra virgin olive oil from Jeju Island.", tags: ["olive oil", "cold pressed", "jeju"] },
    { name: "Coffee Beans — Single Origin", desc: "Freshly roasted Ethiopian Yirgacheffe single origin beans.", tags: ["coffee", "beans", "ethiopian"] },
    { name: "Matcha Powder", desc: "Ceremonial grade matcha powder from Uji, Kyoto.", tags: ["matcha", "powder", "ceremonial"] },
    { name: "Sea Salt Flakes", desc: "Hand-harvested sea salt flakes from the Korean coast.", tags: ["sea salt", "flakes", "korean"] },
  ],
};

// Adjective/variant prefixes to make 50 unique products per seller
const VARIANTS = [
  "Premium", "Deluxe", "Classic", "Limited Edition", "Mini",
  "Signature", "Artisan", "Handmade", "Organic", "Vintage",
];

const COLORS = [
  "Ivory", "Charcoal", "Forest Green", "Dusty Rose", "Navy",
  "Terracotta", "Sand", "Ocean Blue", "Slate", "Cream",
];

function generateProducts(sellerId: number, sellerIndex: number) {
  const products = [];
  const catOrder = [...CATEGORIES].sort(() => (sellerIndex * 7 + Math.random()) % 1 - 0.5);

  for (let i = 0; i < 50; i++) {
    const catIdx = i % 6;
    const templateIdx = Math.floor(i / 6) % 10;
    const variantIdx = Math.floor(i / 6);
    const colorIdx = i % 10;

    const category = catOrder[catIdx] || CATEGORIES[catIdx];
    const templates = PRODUCT_TEMPLATES[category];
    const template = templates[templateIdx % templates.length];
    const images = PRODUCT_IMAGES[category];
    const imgUrl = images[i % images.length];

    const variant = VARIANTS[variantIdx % VARIANTS.length];
    const color = COLORS[colorIdx];
    const productName = `${variant} ${template.name} — ${color}`;

    const basePrice = 15 + Math.floor(Math.random() * 300);
    const hasSale = Math.random() > 0.7;
    const salePrice = hasSale ? Math.round(basePrice * (0.7 + Math.random() * 0.2)) : null;

    products.push({
      sellerId,
      prdNm: productName,
      prdDc: `${template.desc} Available in ${color} finish. Crafted with attention to detail by our artisan team.`,
      prdPrc: basePrice,
      prdSalePrc: salePrice,
      prdCtgrCd: category,
      prdImgUrl: imgUrl,
      prdImgUrls: [imgUrl, images[(i + 1) % images.length]],
      stckQty: 5 + Math.floor(Math.random() * 50),
      soldCnt: Math.floor(Math.random() * 200),
      viewCnt: 100 + Math.floor(Math.random() * 5000),
      avgRtng: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
      rvwCnt: Math.floor(Math.random() * 100),
      srchTags: [...template.tags, color.toLowerCase(), variant.toLowerCase()],
      rgtrId: "SYSTEM",
      mdfrId: "SYSTEM",
    });
  }
  return products;
}

async function main() {
  // Seed code groups
  for (const group of CODE_GROUPS) {
    const existing = await prisma.commonCodeGroup.findUnique({
      where: { cdGrpId: group.cdGrpId },
    });
    if (!existing) {
      await prisma.commonCodeGroup.create({
        data: { ...group, rgtrId: "SYSTEM", mdfrId: "SYSTEM" },
      });
    }
  }

  // Seed codes
  for (const code of CODES) {
    const existing = await prisma.commonCode.findUnique({
      where: { cdGrpId_cdVal: { cdGrpId: code.cdGrpId, cdVal: code.cdVal } },
    });
    if (!existing) {
      await prisma.commonCode.create({
        data: { ...code, rgtrId: "SYSTEM", mdfrId: "SYSTEM" },
      });
    }
  }

  // ── Super Admin ──
  const adminEmail = "admin@astratech.vn";
  let admin = await prisma.user.findFirst({ where: { userEmail: adminEmail } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        userEmail: adminEmail,
        firebaseUid: "firebase-admin-placeholder",
        userNm: "Super Admin",
        userNcnm: "superadmin",
        useRoleCd: "SUPER_ADMIN",
        userSttsCd: "ACTV",
        rgtrId: "SYSTEM",
        mdfrId: "SYSTEM",
      },
    });
    console.info("Super admin created: admin@astratech.vn");
  } else {
    if (admin.useRoleCd !== "SUPER_ADMIN") {
      await prisma.user.update({
        where: { id: admin.id },
        data: { useRoleCd: "SUPER_ADMIN", mdfrId: "SYSTEM" },
      });
    }
    console.info("Super admin already exists");
  }

  // ── Buyer ──
  const buyerEmail = "buyer@vibe.com";
  const existingBuyer = await prisma.user.findFirst({ where: { userEmail: buyerEmail } });
  if (!existingBuyer) {
    await prisma.user.create({
      data: {
        userEmail: buyerEmail,
        firebaseUid: "firebase-buyer-placeholder",
        userNm: "Demo Buyer",
        userNcnm: "demo_buyer",
        useRoleCd: "BUYER",
        userSttsCd: "ACTV",
        rgtrId: "SYSTEM",
        mdfrId: "SYSTEM",
      },
    });
    console.info("Buyer created: buyer@vibe.com");
  }

  // ── 4 Sellers (seller1~4@yopmail.com) ──
  const sellers = [
    { email: "seller1@yopmail.com", name: "Seoul Craft Studio", nickname: "seoul_craft", firebaseUid: "firebase-seller1-placeholder" },
    { email: "seller2@yopmail.com", name: "Hanok Living", nickname: "hanok_living", firebaseUid: "firebase-seller2-placeholder" },
    { email: "seller3@yopmail.com", name: "Jeju Art Gallery", nickname: "jeju_art", firebaseUid: "firebase-seller3-placeholder" },
    { email: "seller4@yopmail.com", name: "Busan Market", nickname: "busan_market", firebaseUid: "firebase-seller4-placeholder" },
  ];

  const sellerIds: number[] = [];
  for (const s of sellers) {
    let seller = await prisma.user.findFirst({ where: { userEmail: s.email } });
    if (!seller) {
      seller = await prisma.user.create({
        data: {
          userEmail: s.email,
          firebaseUid: s.firebaseUid,
          userNm: s.name,
          userNcnm: s.nickname,
          useRoleCd: "SELLER",
          userSttsCd: "ACTV",
          rgtrId: "SYSTEM",
          mdfrId: "SYSTEM",
        },
      });
      console.info(`Seller created: ${s.email}`);
    }
    sellerIds.push(seller.id);
  }

  // ── 200 Products (50 per seller) ──
  const existingProducts = await prisma.product.count();
  if (existingProducts < 200) {
    // Delete old products and related order items to re-seed cleanly
    if (existingProducts > 0) {
      await prisma.orderStatusHistory.deleteMany({});
      await prisma.orderItem.deleteMany({});
      await prisma.order.deleteMany({});
      await prisma.product.deleteMany({});
      console.info(`Deleted ${existingProducts} old products and related orders`);
    }

    let totalCreated = 0;
    for (let i = 0; i < sellerIds.length; i++) {
      const products = generateProducts(sellerIds[i], i);
      for (const p of products) {
        await prisma.product.create({ data: p });
      }
      totalCreated += products.length;
      console.info(`Created 50 products for ${sellers[i].name} (${sellers[i].email})`);
    }
    console.info(`Total products seeded: ${totalCreated}`);
  } else {
    console.info(`Products already exist (${existingProducts}), skipping`);
  }

  const groupCount = await prisma.commonCodeGroup.count();
  const codeCount = await prisma.commonCode.count();
  const productCount = await prisma.product.count();
  const userCount = await prisma.user.count();
  console.info(`\nSeed complete: ${userCount} users, ${groupCount} code groups, ${codeCount} codes, ${productCount} products`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

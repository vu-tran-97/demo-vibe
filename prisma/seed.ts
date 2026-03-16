import { PrismaClient } from "@prisma/client";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require("../server/node_modules/bcrypt");

const prisma = new PrismaClient();

const BCRYPT_SALT_ROUNDS = 12;

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
  // User Status
  { cdGrpId: "USER_STTS", cdVal: "ACTV", cdNm: "Active", sortSn: 1 },
  { cdGrpId: "USER_STTS", cdVal: "INAC", cdNm: "Inactive", sortSn: 2 },
  { cdGrpId: "USER_STTS", cdVal: "SUSP", cdNm: "Suspended", sortSn: 3 },
  // Login Result
  { cdGrpId: "LGN_RSLT", cdVal: "SUCC", cdNm: "Success", sortSn: 1 },
  { cdGrpId: "LGN_RSLT", cdVal: "FAIL", cdNm: "Failure", sortSn: 2 },
  // Social Provider
  { cdGrpId: "SCL_PRVD", cdVal: "GOOGLE", cdNm: "Google", sortSn: 1 },
  { cdGrpId: "SCL_PRVD", cdVal: "KAKAO", cdNm: "Kakao", sortSn: 2 },
  { cdGrpId: "SCL_PRVD", cdVal: "NAVER", cdNm: "Naver", sortSn: 3 },
  // Post Category
  { cdGrpId: "POST_CTGR", cdVal: "NOTICE", cdNm: "Notice", sortSn: 1 },
  { cdGrpId: "POST_CTGR", cdVal: "FREE", cdNm: "Free Board", sortSn: 2 },
  { cdGrpId: "POST_CTGR", cdVal: "QNA", cdNm: "Q&A", sortSn: 3 },
  { cdGrpId: "POST_CTGR", cdVal: "REVIEW", cdNm: "Product Review", sortSn: 4 },
  // Chat Room Type
  { cdGrpId: "CHAT_ROOM_TYPE", cdVal: "DM", cdNm: "Direct Message", sortSn: 1 },
  { cdGrpId: "CHAT_ROOM_TYPE", cdVal: "GROUP", cdNm: "Group Chat", sortSn: 2 },
  // Message Type
  { cdGrpId: "MSG_TYPE", cdVal: "TEXT", cdNm: "Text", sortSn: 1 },
  { cdGrpId: "MSG_TYPE", cdVal: "IMG", cdNm: "Image", sortSn: 2 },
  { cdGrpId: "MSG_TYPE", cdVal: "FILE", cdNm: "File", sortSn: 3 },
  // Attachment Type
  { cdGrpId: "ATCH_TYPE", cdVal: "IMG", cdNm: "Image", sortSn: 1 },
  { cdGrpId: "ATCH_TYPE", cdVal: "DOC", cdNm: "Document", sortSn: 2 },
  { cdGrpId: "ATCH_TYPE", cdVal: "VIDEO", cdNm: "Video", sortSn: 3 },
  // User Role
  { cdGrpId: "USE_ROLE", cdVal: "SUPER_ADMIN", cdNm: "Super Admin", sortSn: 1 },
  { cdGrpId: "USE_ROLE", cdVal: "SELLER", cdNm: "Seller", sortSn: 2 },
  { cdGrpId: "USE_ROLE", cdVal: "BUYER", cdNm: "Buyer", sortSn: 3 },
  // Product Category
  { cdGrpId: "PRD_CTGR", cdVal: "CERAMICS", cdNm: "Ceramics & Pottery", sortSn: 1 },
  { cdGrpId: "PRD_CTGR", cdVal: "TEXTILES", cdNm: "Textiles & Fabrics", sortSn: 2 },
  { cdGrpId: "PRD_CTGR", cdVal: "ART", cdNm: "Art & Prints", sortSn: 3 },
  { cdGrpId: "PRD_CTGR", cdVal: "JEWELRY", cdNm: "Jewelry & Accessories", sortSn: 4 },
  { cdGrpId: "PRD_CTGR", cdVal: "HOME", cdNm: "Home & Living", sortSn: 5 },
  { cdGrpId: "PRD_CTGR", cdVal: "FOOD", cdNm: "Food & Beverages", sortSn: 6 },
  // Product Status
  { cdGrpId: "PRD_STTS", cdVal: "ACTV", cdNm: "Active", sortSn: 1 },
  { cdGrpId: "PRD_STTS", cdVal: "SOLD_OUT", cdNm: "Sold Out", sortSn: 2 },
  { cdGrpId: "PRD_STTS", cdVal: "DRAFT", cdNm: "Draft", sortSn: 3 },
];

async function main() {
  // Seed code groups (using findUnique + create to avoid transactions)
  for (const group of CODE_GROUPS) {
    const existing = await prisma.commonCodeGroup.findUnique({
      where: { cdGrpId: group.cdGrpId },
    });
    if (!existing) {
      await prisma.commonCodeGroup.create({
        data: {
          cdGrpId: group.cdGrpId,
          cdGrpNm: group.cdGrpNm,
          cdGrpDc: group.cdGrpDc,
          rgtrId: "SYSTEM",
          mdfrId: "SYSTEM",
        },
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
        data: {
          cdGrpId: code.cdGrpId,
          cdVal: code.cdVal,
          cdNm: code.cdNm,
          sortSn: code.sortSn,
          rgtrId: "SYSTEM",
          mdfrId: "SYSTEM",
        },
      });
    }
  }

  // Seed super admin account
  const superAdminEmail = "admin@astratech.vn";
  const existingAdmin = await prisma.user.findFirst({
    where: { userEmail: superAdminEmail },
  });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("Admin@123", BCRYPT_SALT_ROUNDS);
    await prisma.user.create({
      data: {
        userEmail: superAdminEmail,
        userPswd: hashedPassword,
        userNm: "Super Admin",
        userNcnm: "superadmin",
        useRoleCd: "SUPER_ADMIN",
        userSttsCd: "ACTV",
        emailVrfcYn: "Y",
        rgtrId: "SYSTEM",
        mdfrId: "SYSTEM",
      },
    });
    console.info("Super admin account created: admin@astratech.vn");
  } else {
    // Ensure existing admin has SUPER_ADMIN role
    if (existingAdmin.useRoleCd !== "SUPER_ADMIN") {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { useRoleCd: "SUPER_ADMIN", mdfrId: "SYSTEM" },
      });
      console.info("Existing admin promoted to SUPER_ADMIN");
    } else {
      console.info("Super admin already exists, skipping");
    }
  }

  // Seed buyer account
  const buyerEmail = "buyer@vibe.com";
  const existingBuyer = await prisma.user.findFirst({
    where: { userEmail: buyerEmail },
  });
  if (!existingBuyer) {
    const buyerPassword = await bcrypt.hash("Buyer@123", BCRYPT_SALT_ROUNDS);
    await prisma.user.create({
      data: {
        userEmail: buyerEmail,
        userPswd: buyerPassword,
        userNm: "Demo Buyer",
        userNcnm: "demo_buyer",
        useRoleCd: "BUYER",
        userSttsCd: "ACTV",
        emailVrfcYn: "Y",
        rgtrId: "SYSTEM",
        mdfrId: "SYSTEM",
      },
    });
    console.info("Buyer account created: buyer@vibe.com");
  } else {
    console.info("Buyer account already exists, skipping");
  }

  // Seed seller accounts
  const sellerData = [
    { email: "minji@vibe.com", name: "Minji's Ceramics", nickname: "minji_ceramics" },
    { email: "seonwoo@vibe.com", name: "Seonwoo Textiles", nickname: "seonwoo_textiles" },
    { email: "yuna@vibe.com", name: "Yuna Art Studio", nickname: "yuna_art" },
  ];
  const sellerIds: string[] = [];
  const sellerPassword = await bcrypt.hash("Seller@123", BCRYPT_SALT_ROUNDS);

  for (const s of sellerData) {
    let seller = await prisma.user.findFirst({ where: { userEmail: s.email } });
    if (!seller) {
      seller = await prisma.user.create({
        data: {
          userEmail: s.email,
          userPswd: sellerPassword,
          userNm: s.name,
          userNcnm: s.nickname,
          useRoleCd: "SELLER",
          userSttsCd: "ACTV",
          emailVrfcYn: "Y",
          rgtrId: "SYSTEM",
          mdfrId: "SYSTEM",
        },
      });
    }
    sellerIds.push(seller.id);
  }
  console.info(`Seeded ${sellerIds.length} sellers`);

  // Seed products
  const existingProducts = await prisma.product.count();
  if (existingProducts === 0) {
    const products = [
      {
        sellerId: sellerIds[0],
        prdNm: "Handcrafted Ceramic Vase",
        prdDc: "A beautifully hand-thrown ceramic vase with a unique speckled glaze. Each piece is one-of-a-kind, perfect for fresh or dried flower arrangements. Crafted with care in our Seoul studio using traditional Korean pottery techniques.",
        prdPrc: 128.00,
        prdSalePrc: null,
        prdCtgrCd: "CERAMICS",
        prdImgUrl: "/products/ceramic-vase.jpg",
        prdImgUrls: ["/products/ceramic-vase.jpg", "/products/ceramic-vase-2.jpg"],
        stckQty: 12,
        soldCnt: 142,
        viewCnt: 2840,
        avgRtng: 4.8,
        rvwCnt: 56,
        srchTags: ["ceramic", "vase", "handmade", "pottery", "korean"],
      },
      {
        sellerId: sellerIds[1],
        prdNm: "Linen Table Runner",
        prdDc: "Premium Belgian linen table runner in a warm natural tone. Pre-washed for softness and durability. The perfect foundation for any tablescape — casual or formal.",
        prdPrc: 64.00,
        prdSalePrc: 48.00,
        prdCtgrCd: "TEXTILES",
        prdImgUrl: "/products/linen-runner.jpg",
        prdImgUrls: ["/products/linen-runner.jpg", "/products/linen-runner-2.jpg"],
        stckQty: 35,
        soldCnt: 98,
        viewCnt: 1920,
        avgRtng: 4.6,
        rvwCnt: 38,
        srchTags: ["linen", "table", "runner", "natural", "belgian"],
      },
      {
        sellerId: sellerIds[0],
        prdNm: "Artisan Coffee Set",
        prdDc: "A curated set of two espresso cups and saucers in our signature earth-tone glaze. Microwave and dishwasher safe. Makes a thoughtful gift for coffee lovers.",
        prdPrc: 96.00,
        prdSalePrc: null,
        prdCtgrCd: "CERAMICS",
        prdImgUrl: "/products/coffee-set.jpg",
        prdImgUrls: ["/products/coffee-set.jpg", "/products/coffee-set-2.jpg"],
        stckQty: 8,
        soldCnt: 87,
        viewCnt: 1650,
        avgRtng: 4.9,
        rvwCnt: 42,
        srchTags: ["coffee", "cups", "espresso", "ceramic", "gift"],
      },
      {
        sellerId: sellerIds[2],
        prdNm: "Botanical Print — Monstera",
        prdDc: "Hand-illustrated botanical print on premium archival paper. Unframed, ships flat in a protective tube. Available in A3 and A2 sizes.",
        prdPrc: 42.00,
        prdSalePrc: null,
        prdCtgrCd: "ART",
        prdImgUrl: "/products/botanical-print.jpg",
        prdImgUrls: ["/products/botanical-print.jpg"],
        stckQty: 50,
        soldCnt: 76,
        viewCnt: 1280,
        avgRtng: 4.7,
        rvwCnt: 29,
        srchTags: ["botanical", "print", "monstera", "art", "illustration"],
      },
      {
        sellerId: sellerIds[1],
        prdNm: "Silk Scarf — Morning Bloom",
        prdDc: "100% mulberry silk scarf with hand-rolled edges. Features an original watercolor floral design. Lightweight and versatile — wear it as a scarf, headband, or bag accessory.",
        prdPrc: 78.00,
        prdSalePrc: 62.00,
        prdCtgrCd: "TEXTILES",
        prdImgUrl: "/products/silk-scarf.jpg",
        prdImgUrls: ["/products/silk-scarf.jpg", "/products/silk-scarf-2.jpg"],
        stckQty: 20,
        soldCnt: 65,
        viewCnt: 980,
        avgRtng: 4.5,
        rvwCnt: 21,
        srchTags: ["silk", "scarf", "floral", "accessory", "mulberry"],
      },
      {
        sellerId: sellerIds[2],
        prdNm: "Abstract Landscape — Golden Hour",
        prdDc: "Original acrylic painting on stretched canvas. A warm, atmospheric landscape capturing the magic of golden hour. Ready to hang.",
        prdPrc: 320.00,
        prdSalePrc: null,
        prdCtgrCd: "ART",
        prdImgUrl: "/products/abstract-landscape.jpg",
        prdImgUrls: ["/products/abstract-landscape.jpg"],
        stckQty: 1,
        soldCnt: 12,
        viewCnt: 890,
        avgRtng: 5.0,
        rvwCnt: 8,
        srchTags: ["painting", "abstract", "landscape", "acrylic", "original"],
      },
      {
        sellerId: sellerIds[0],
        prdNm: "Stoneware Dinner Plate Set",
        prdDc: "Set of 4 dinner plates in our minimalist stoneware collection. Matte finish with a subtle organic texture. Oven, microwave, and dishwasher safe.",
        prdPrc: 156.00,
        prdSalePrc: 128.00,
        prdCtgrCd: "CERAMICS",
        prdImgUrl: "/products/dinner-plates.jpg",
        prdImgUrls: ["/products/dinner-plates.jpg", "/products/dinner-plates-2.jpg"],
        stckQty: 15,
        soldCnt: 54,
        viewCnt: 1120,
        avgRtng: 4.7,
        rvwCnt: 24,
        srchTags: ["plates", "stoneware", "dinner", "set", "minimalist"],
      },
      {
        sellerId: sellerIds[2],
        prdNm: "Minimalist Line Art — Face",
        prdDc: "Elegant single-line drawing on heavyweight cotton paper. A modern, gallery-worthy piece that complements any interior style. Unframed.",
        prdPrc: 36.00,
        prdSalePrc: null,
        prdCtgrCd: "ART",
        prdImgUrl: "/products/line-art.jpg",
        prdImgUrls: ["/products/line-art.jpg"],
        stckQty: 40,
        soldCnt: 118,
        viewCnt: 2100,
        avgRtng: 4.4,
        rvwCnt: 45,
        srchTags: ["line art", "minimalist", "face", "drawing", "modern"],
      },
      {
        sellerId: sellerIds[1],
        prdNm: "Wool Throw Blanket",
        prdDc: "Luxuriously soft merino wool throw in a timeless herringbone pattern. Ethically sourced from New Zealand. Perfect for cozy evenings.",
        prdPrc: 189.00,
        prdSalePrc: null,
        prdCtgrCd: "TEXTILES",
        prdImgUrl: "/products/wool-throw.jpg",
        prdImgUrls: ["/products/wool-throw.jpg", "/products/wool-throw-2.jpg"],
        stckQty: 10,
        soldCnt: 33,
        viewCnt: 760,
        avgRtng: 4.8,
        rvwCnt: 15,
        srchTags: ["wool", "throw", "blanket", "merino", "herringbone"],
      },
      {
        sellerId: sellerIds[0],
        prdNm: "Incense Holder — Cloud",
        prdDc: "A cloud-shaped ceramic incense holder with a gentle curve to catch ash. Comes with a sample pack of 10 sandalwood incense sticks.",
        prdPrc: 34.00,
        prdSalePrc: null,
        prdCtgrCd: "HOME",
        prdImgUrl: "/products/incense-holder.jpg",
        prdImgUrls: ["/products/incense-holder.jpg"],
        stckQty: 25,
        soldCnt: 201,
        viewCnt: 3200,
        avgRtng: 4.6,
        rvwCnt: 78,
        srchTags: ["incense", "holder", "ceramic", "cloud", "home"],
      },
      {
        sellerId: sellerIds[1],
        prdNm: "Cotton Tote — Earth",
        prdDc: "Heavy-duty organic cotton tote bag with reinforced handles. Screen-printed with an original botanical design. Perfect for daily use or as a reusable shopping bag.",
        prdPrc: 28.00,
        prdSalePrc: null,
        prdCtgrCd: "TEXTILES",
        prdImgUrl: "/products/cotton-tote.jpg",
        prdImgUrls: ["/products/cotton-tote.jpg"],
        stckQty: 60,
        soldCnt: 245,
        viewCnt: 4100,
        avgRtng: 4.3,
        rvwCnt: 92,
        srchTags: ["tote", "cotton", "bag", "organic", "botanical"],
      },
      {
        sellerId: sellerIds[2],
        prdNm: "Watercolor Set — Seasons",
        prdDc: "Set of 4 small watercolor prints, one for each season. Printed on textured cotton rag paper. Each print is 5x7 inches.",
        prdPrc: 58.00,
        prdSalePrc: 45.00,
        prdCtgrCd: "ART",
        prdImgUrl: "/products/watercolor-set.jpg",
        prdImgUrls: ["/products/watercolor-set.jpg", "/products/watercolor-set-2.jpg"],
        stckQty: 30,
        soldCnt: 89,
        viewCnt: 1540,
        avgRtng: 4.9,
        rvwCnt: 36,
        srchTags: ["watercolor", "print", "seasons", "set", "art"],
      },
    ];

    for (const p of products) {
      await prisma.product.create({
        data: { ...p, rgtrId: "SYSTEM", mdfrId: "SYSTEM" },
      });
    }
    console.info(`Seeded ${products.length} products`);
  } else {
    console.info(`Products already exist (${existingProducts}), skipping`);
  }

  const groupCount = await prisma.commonCodeGroup.count();
  const codeCount = await prisma.commonCode.count();
  const productCount = await prisma.product.count();
  console.info(`Seed complete: ${groupCount} code groups, ${codeCount} codes, ${productCount} products`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

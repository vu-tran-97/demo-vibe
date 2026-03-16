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

  const groupCount = await prisma.commonCodeGroup.count();
  const codeCount = await prisma.commonCode.count();
  console.info(`Seed complete: ${groupCount} code groups, ${codeCount} codes`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

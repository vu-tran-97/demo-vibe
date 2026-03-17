// MongoDB initialization script
// Creates the demo-vibe database and sets up initial collections

db = db.getSiblingDB("demo-vibe");

db.createCollection("TB_COMM_CD_GRP");
db.createCollection("TC_COMM_CD");
db.createCollection("TB_COMM_USER");
db.createCollection("TB_COMM_RFRSH_TKN");
db.createCollection("TL_COMM_LGN_HST");
db.createCollection("TB_COMM_SCL_ACNT");
db.createCollection("TB_COMM_PSTNG");
db.createCollection("TR_COMM_PSTNG_CMT");
db.createCollection("TB_COMM_CHAT_ROOM");
db.createCollection("TR_COMM_CHAT_PRTCPNT");
db.createCollection("TB_COMM_CHAT_MSG");
db.createCollection("TB_COMM_CHAT_MSG_ATCH");
db.createCollection("TB_PROD_PRD");
db.createCollection("TB_COMM_ORDR");
db.createCollection("TB_COMM_ORDR_ITEM");
db.createCollection("TH_COMM_ORDR_STTS");
db.createCollection("TL_COMM_USE_ACTV");

print("demo-vibe database initialized with all collections");

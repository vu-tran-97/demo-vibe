# 데이터베이스 설계 (SSoT)

> 이 문서는 demo-vibe 프로젝트의 **단일 진실 원천(Single Source of Truth)**입니다.
> 모든 DB 스키마 변경은 이 문서를 먼저 수정한 후 코드에 반영합니다.

## 1. 공통 규칙

### 컬렉션 네이밍
- 접두사 규칙: `TB_` (일반), `TC_` (코드), `TH_` (이력), `TL_` (로그), `TR_` (관계)
- 모든 컬렉션명은 대문자 + 언더스코어 (`UPPER_SNAKE_CASE`)

### 필드 네이밍
- 모든 필드명은 대문자 + 언더스코어 (`UPPER_SNAKE_CASE`)
- 접미사 규칙:
  - `_YMD`: 날짜 (YYYYMMDD)
  - `_DT`: 일시 (DateTime)
  - `_AMT`: 금액
  - `_NM`: 명칭
  - `_CD`: 코드
  - `_NO`: 번호
  - `_CN`: 내용
  - `_YN`: 여부 (Y/N)
  - `_SN`: 순번
  - `_ADDR`: 주소

### 공통 필드 (모든 컬렉션에 포함)
| 필드명 | 타입 | 설명 |
|--------|------|------|
| RGST_DT | DateTime | 등록일시 |
| RGTR_ID | String | 등록자ID |
| MDFCN_DT | DateTime | 수정일시 |
| MDFR_ID | String | 수정자ID |
| DEL_YN | String | 삭제여부 (Y/N) |

---

## 2. ERD 개요

```
[TB_COMM_USER] ──1:N── [TB_COMM_BOARD_POST]
      │                        │
      │                        └──1:N── [TB_COMM_BOARD_CMNT]
      │
      ├──N:M── [TR_COMM_CHAT_ROOM_MBR] ──N:1── [TB_COMM_CHAT_ROOM]
      │                                              │
      └──1:N── [TB_COMM_CHAT_MSG] ──────────N:1──────┘
```

---

## 3. 모듈별 컬렉션

### 3.1 Auth 모듈

#### TB_COMM_USER (사용자)
| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| _id | ObjectId | PK | 사용자 ID |
| USER_EMAIL | String | Y | 이메일 (unique) |
| USER_PSWD | String | Y | 비밀번호 (hashed) |
| USER_NM | String | Y | 사용자명 |
| USER_NCNM | String | N | 닉네임 |
| PRFL_IMG_URL | String | N | 프로필이미지URL |
| USER_STTS_CD | String | Y | 사용자상태코드 (ACTV/INAC/SUSP) |
| LST_LGN_DT | DateTime | N | 최종로그인일시 |

#### TL_COMM_LGN_LOG (로그인 로그)
| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| _id | ObjectId | PK | 로그 ID |
| USER_ID | ObjectId | FK | 사용자 ID |
| LGN_DT | DateTime | Y | 로그인일시 |
| LGN_IP_ADDR | String | Y | 로그인IP주소 |
| LGN_RSLT_CD | String | Y | 로그인결과코드 (SUCC/FAIL) |

### 3.2 Board 모듈

#### TB_COMM_BOARD_POST (게시글)
| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| _id | ObjectId | PK | 게시글 ID |
| USER_ID | ObjectId | FK | 작성자 ID |
| POST_TTL | String | Y | 게시글제목 |
| POST_CN | String | Y | 게시글내용 |
| POST_CTGR_CD | String | Y | 게시글카테고리코드 |
| INQR_CNT | Number | Y | 조회수 (기본값: 0) |
| LIKE_CNT | Number | Y | 좋아요수 (기본값: 0) |

#### TB_COMM_BOARD_CMNT (댓글)
| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| _id | ObjectId | PK | 댓글 ID |
| POST_ID | ObjectId | FK | 게시글 ID |
| USER_ID | ObjectId | FK | 작성자 ID |
| CMNT_CN | String | Y | 댓글내용 |
| PRNT_CMNT_ID | ObjectId | N | 부모댓글ID (대댓글) |

### 3.3 Chat 모듈

#### TB_COMM_CHAT_ROOM (채팅방)
| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| _id | ObjectId | PK | 채팅방 ID |
| CHAT_ROOM_NM | String | Y | 채팅방명 |
| CHAT_ROOM_TYPE_CD | String | Y | 채팅방유형코드 (DM/GROUP) |
| MAX_MBR_CNT | Number | Y | 최대인원수 |

#### TR_COMM_CHAT_ROOM_MBR (채팅방 멤버)
| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| _id | ObjectId | PK | ID |
| CHAT_ROOM_ID | ObjectId | FK | 채팅방 ID |
| USER_ID | ObjectId | FK | 사용자 ID |
| JOIN_DT | DateTime | Y | 참여일시 |
| LAST_READ_DT | DateTime | N | 마지막읽은일시 |

#### TB_COMM_CHAT_MSG (채팅 메시지)
| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| _id | ObjectId | PK | 메시지 ID |
| CHAT_ROOM_ID | ObjectId | FK | 채팅방 ID |
| USER_ID | ObjectId | FK | 발신자 ID |
| MSG_CN | String | Y | 메시지내용 |
| MSG_TYPE_CD | String | Y | 메시지유형코드 (TEXT/IMG/FILE) |
| SEND_DT | DateTime | Y | 발송일시 |

---

## 4. 인덱스

| 컬렉션 | 인덱스 | 유형 |
|--------|--------|------|
| TB_COMM_USER | USER_EMAIL | Unique |
| TB_COMM_BOARD_POST | USER_ID, RGST_DT | Compound |
| TB_COMM_BOARD_POST | POST_CTGR_CD | Single |
| TB_COMM_BOARD_CMNT | POST_ID, RGST_DT | Compound |
| TB_COMM_CHAT_MSG | CHAT_ROOM_ID, SEND_DT | Compound |
| TR_COMM_CHAT_ROOM_MBR | CHAT_ROOM_ID, USER_ID | Compound + Unique |

# DB 네이밍 규칙

> 행정안전부 공공데이터 공통표준 용어 사전을 기반으로 한 네이밍 규칙입니다.

## 1. 컬렉션(테이블)명 규칙

### 접두사
| 접두사 | 용도 | 예시 |
|--------|------|------|
| `TB_` | 일반 테이블 | TB_COMM_USER |
| `TC_` | 코드 테이블 | TC_COMM_CD |
| `TH_` | 이력 테이블 | TH_COMM_LGN |
| `TL_` | 로그 테이블 | TL_COMM_LGN_LOG |
| `TR_` | 관계 테이블 | TR_COMM_CHAT_ROOM_MBR |

### 네이밍 형식
```
{접두사}_{모듈코드}_{엔티티명}
```

예시:
- `TB_COMM_USER` → 공통_사용자
- `TB_COMM_BOARD_POST` → 공통_게시판_게시글
- `TR_COMM_CHAT_ROOM_MBR` → 공통_채팅방_멤버

## 2. 필드(컬럼)명 규칙

### 접미사 규칙
| 접미사 | 도메인 | 데이터 타입 | 예시 |
|--------|--------|------------|------|
| `_NM` | 명 | String | USER_NM (사용자명) |
| `_CD` | 코드 | String | STTS_CD (상태코드) |
| `_NO` | 번호 | String/Number | ORDR_NO (주문번호) |
| `_CN` | 내용 | String (Long) | POST_CN (게시글내용) |
| `_YN` | 여부 | String(1) | DEL_YN (삭제여부) |
| `_DT` | 일시 | DateTime | RGST_DT (등록일시) |
| `_YMD` | 일자 | String(8) | STRT_YMD (시작일자) |
| `_AMT` | 금액 | Number | PAY_AMT (결제금액) |
| `_CNT` | 건수 | Number | INQR_CNT (조회건수) |
| `_SN` | 순번 | Number | SORT_SN (정렬순번) |
| `_ADDR` | 주소 | String | EMAIL_ADDR (이메일주소) |
| `_URL` | URL | String | PRFL_IMG_URL (프로필이미지URL) |
| `_ID` | 식별자 | String/ObjectId | USER_ID (사용자ID) |
| `_PSWD` | 비밀번호 | String | USER_PSWD (사용자비밀번호) |

### 표준 용어 매핑 (주요 항목)
| 한글명 | 영문 약어 | 설명 |
|--------|----------|------|
| 사용자 | USER | - |
| 이메일 | EMAIL | - |
| 비밀번호 | PSWD | password |
| 게시글 | POST | - |
| 댓글 | CMNT | comment |
| 채팅 | CHAT | - |
| 메시지 | MSG | message |
| 등록 | RGST | register |
| 수정 | MDFCN | modification |
| 삭제 | DEL | delete |
| 조회 | INQR | inquiry |
| 닉네임 | NCNM | nickname |
| 프로필 | PRFL | profile |
| 이미지 | IMG | image |
| 제목 | TTL | title |
| 카테고리 | CTGR | category |
| 상태 | STTS | status |
| 유형 | TYPE | - |

> 표준 용어 사전 전체 조회는 `/lookup-term [한글 용어]` 명령으로 확인하세요.

## 3. 금칙어 (사용 금지 단어)

표준 사전에 정의된 금칙어는 사용이 금지됩니다. 대체 용어를 사용하세요.

| 금칙어 | 대체 표준어 |
|--------|-----------|
| 패스워드 | 비밀번호 (PSWD) |
| 카운트 | 건수 (CNT) |
| 넘버 | 번호 (NO) |
| 네임 | 명 (NM) |

> 전체 금칙어 목록은 `standard_words.json`의 `금칙어목록` 필드를 참조하세요.

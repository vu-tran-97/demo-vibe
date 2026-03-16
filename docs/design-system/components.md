# 컴포넌트 스타일 가이드

> DSA가 정의하는 핵심 UI 컴포넌트 가이드. 모든 컴포넌트는 `design-tokens.css`의 토큰을 사용해야 합니다.

## 1. 버튼 (Button)

### 변형 (Variants)
| 변형 | 용도 | 배경 | 텍스트 |
|------|------|------|--------|
| Primary | 주요 액션 (저장, 제출) | `--color-primary-600` | `#fff` |
| Secondary | 보조 액션 (취소, 뒤로) | `--color-gray-100` | `--color-gray-700` |
| Danger | 삭제, 위험 액션 | `--color-error` | `#fff` |
| Ghost | 텍스트 링크형 버튼 | transparent | `--color-primary-600` |

### 크기 (Sizes)
| 크기 | 높이 | 폰트 | 패딩 (좌우) |
|------|------|------|-------------|
| sm | 32px | `--font-size-sm` | `--spacing-3` |
| md | 40px | `--font-size-base` | `--spacing-4` |
| lg | 48px | `--font-size-lg` | `--spacing-6` |

### 상태 (States)
- Default → Hover (밝기 -10%) → Active (밝기 -15%) → Disabled (opacity: 0.5)
- Focus: `outline: 2px solid var(--color-primary-400); outline-offset: 2px`

---

## 2. 입력 필드 (Input)

### 기본 스타일
- 높이: 40px (`--spacing-10`)
- 테두리: 1px solid `--color-border`
- 라운딩: `--radius-md`
- 폰트: `--font-size-base`
- 패딩: `--spacing-3` (좌우)

### 상태
| 상태 | 테두리 | 배경 |
|------|--------|------|
| Default | `--color-border` | `--color-background` |
| Focus | `--color-primary-500` | `--color-background` |
| Error | `--color-error` | `--color-background` |
| Disabled | `--color-gray-200` | `--color-gray-50` |

### 구성 요소
- Label: `--font-size-sm`, `--font-weight-medium`, `--color-gray-700`
- Helper text: `--font-size-xs`, `--color-gray-500`
- Error message: `--font-size-xs`, `--color-error`

---

## 3. 카드 (Card)

### 기본 스타일
- 배경: `--color-background`
- 테두리: 1px solid `--color-border`
- 라운딩: `--radius-lg`
- 그림자: `--shadow-sm`
- 패딩: `--spacing-6`

### 변형
| 변형 | 설명 |
|------|------|
| Default | 기본 카드 |
| Elevated | `--shadow-md` 적용 |
| Outlined | 그림자 없음, 테두리만 |

---

## 4. 모달 (Modal)

### 기본 스타일
- 배경: `--color-background`
- 라운딩: `--radius-xl`
- 그림자: `--shadow-xl`
- 패딩: `--spacing-8`
- 최대 너비: 480px (sm), 640px (md), 800px (lg)

### 구성 요소
- Backdrop: `rgba(0, 0, 0, 0.5)`, z-index: `--z-modal-backdrop`
- Header: `--font-size-xl`, `--font-weight-semibold`
- Footer: 버튼 영역, 우측 정렬

---

## 5. 테이블 (Table)

### 기본 스타일
- 헤더 배경: `--color-gray-50`
- 헤더 폰트: `--font-size-sm`, `--font-weight-semibold`
- 셀 패딩: `--spacing-3` (상하), `--spacing-4` (좌우)
- 행 테두리: 1px solid `--color-border`
- 호버: `--color-gray-50`

---

## 6. 네비게이션 (Navigation)

### 사이드바
- 너비: 240px (데스크톱), 접힘 시 64px
- 배경: `--color-gray-900`
- 텍스트: `--color-gray-300`
- 활성 항목: `--color-primary-500` 배경

### 상단 헤더
- 높이: 64px
- 배경: `--color-background`
- 하단 테두리: 1px solid `--color-border`
- 그림자: `--shadow-sm`

---

## 7. 뱃지 (Badge)

| 변형 | 배경 | 텍스트 |
|------|------|--------|
| Default | `--color-gray-100` | `--color-gray-700` |
| Primary | `--color-primary-50` | `--color-primary-700` |
| Success | `#dcfce7` | `#15803d` |
| Warning | `#fef3c7` | `#b45309` |
| Error | `#fee2e2` | `#b91c1c` |

---

## 8. 토스트 (Toast)

- 위치: 우측 상단, z-index: `--z-toast`
- 라운딩: `--radius-md`
- 그림자: `--shadow-lg`
- 자동 닫힘: 5초
- 종류: success (초록), error (빨강), warning (노랑), info (파랑)

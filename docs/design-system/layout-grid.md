# 레이아웃 그리드 시스템

> 반응형 레이아웃 정의. 모든 레이아웃은 8px 그리드 시스템(`--spacing-*`)을 준수합니다.

## 브레이크포인트

| 이름 | 범위 | 컨테이너 최대 너비 | 컬럼 수 | 거터 |
|------|------|-------------------|---------|------|
| Mobile | ~767px | 100% (padding: 16px) | 4 | 16px |
| Tablet | 768px~1023px | 720px | 8 | 24px |
| Desktop | 1024px~ | 1200px | 12 | 24px |

## 컨테이너

```css
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

@media (min-width: 768px) {
  .container {
    max-width: 720px;
    padding: 0 var(--spacing-6);
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
  }
}
```

## 페이지 레이아웃 패턴

### 1. 사이드바 + 콘텐츠

```
Desktop (1024px~):
┌──────────┬─────────────────────────────┐
│ Sidebar  │         Content             │
│  240px   │         flex: 1             │
│          │                             │
└──────────┴─────────────────────────────┘

Mobile (~767px):
┌─────────────────────────────────────────┐
│ Header (햄버거 메뉴)                      │
├─────────────────────────────────────────┤
│              Content                     │
│              100%                        │
└─────────────────────────────────────────┘
```

### 2. 카드 그리드

```
Desktop: 3~4컬럼 (repeat(auto-fill, minmax(280px, 1fr)))
Tablet: 2컬럼
Mobile: 1컬럼

Gap: var(--spacing-6)
```

### 3. 폼 레이아웃

```
Desktop: 최대 너비 640px, 중앙 정렬
Tablet: 최대 너비 640px, 중앙 정렬
Mobile: 100%, 패딩 16px

필드 간격: var(--spacing-6)
라벨-입력 간격: var(--spacing-2)
```

## 간격 규칙

| 위치 | 간격 |
|------|------|
| 섹션 간 | `--spacing-16` (64px) |
| 섹션 내 블록 간 | `--spacing-8` (32px) |
| 요소 간 | `--spacing-4` (16px) |
| 요소 내부 패딩 | `--spacing-4` ~ `--spacing-6` |
| 인라인 요소 간 | `--spacing-2` (8px) |

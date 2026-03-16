# Layout Grid System

> Responsive layout definitions. All layouts follow the 8px grid system (`--spacing-*`).

## Breakpoints

| Name | Range | Container Max Width | Columns | Gutter |
|------|-------|-------------------|---------|--------|
| Mobile | ~767px | 100% (padding: 16px) | 4 | 16px |
| Tablet | 768px~1023px | 720px | 8 | 24px |
| Desktop | 1024px~ | 1200px | 12 | 24px |

## Container

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

## Page Layout Patterns

### 1. Sidebar + Content

```
Desktop (1024px~):
┌──────────┬─────────────────────────────┐
│ Sidebar  │         Content             │
│  240px   │         flex: 1             │
│          │                             │
└──────────┴─────────────────────────────┘

Mobile (~767px):
┌─────────────────────────────────────────┐
│ Header (hamburger menu)                 │
├─────────────────────────────────────────┤
│              Content                     │
│              100%                        │
└─────────────────────────────────────────┘
```

### 2. Card Grid

```
Desktop: 3~4 columns (repeat(auto-fill, minmax(280px, 1fr)))
Tablet: 2 columns
Mobile: 1 column

Gap: var(--spacing-6)
```

### 3. Form Layout

```
Desktop: max-width 640px, centered
Tablet: max-width 640px, centered
Mobile: 100%, padding 16px

Field gap: var(--spacing-6)
Label-input gap: var(--spacing-2)
```

## Spacing Rules

| Location | Spacing |
|----------|---------|
| Between sections | `--spacing-16` (64px) |
| Between blocks within section | `--spacing-8` (32px) |
| Between elements | `--spacing-4` (16px) |
| Element inner padding | `--spacing-4` ~ `--spacing-6` |
| Between inline elements | `--spacing-2` (8px) |

# Component Style Guide

> Core UI component guide defined by DSA. All components must use tokens from `design-tokens.css`.

## 1. Button

### Variants
| Variant | Usage | Background | Text |
|---------|-------|------------|------|
| Primary | Main actions (save, submit) | `--color-primary-600` | `#fff` |
| Secondary | Secondary actions (cancel, back) | `--color-gray-100` | `--color-gray-700` |
| Danger | Delete, dangerous actions | `--color-error` | `#fff` |
| Ghost | Text link-style button | transparent | `--color-primary-600` |

### Sizes
| Size | Height | Font | Padding (horizontal) |
|------|--------|------|---------------------|
| sm | 32px | `--font-size-sm` | `--spacing-3` |
| md | 40px | `--font-size-base` | `--spacing-4` |
| lg | 48px | `--font-size-lg` | `--spacing-6` |

### States
- Default → Hover (brightness -10%) → Active (brightness -15%) → Disabled (opacity: 0.5)
- Focus: `outline: 2px solid var(--color-primary-400); outline-offset: 2px`

---

## 2. Input

### Base Style
- Height: 40px (`--spacing-10`)
- Border: 1px solid `--color-border`
- Border radius: `--radius-md`
- Font: `--font-size-base`
- Padding: `--spacing-3` (horizontal)

### States
| State | Border | Background |
|-------|--------|------------|
| Default | `--color-border` | `--color-background` |
| Focus | `--color-primary-500` | `--color-background` |
| Error | `--color-error` | `--color-background` |
| Disabled | `--color-gray-200` | `--color-gray-50` |

### Sub-elements
- Label: `--font-size-sm`, `--font-weight-medium`, `--color-gray-700`
- Helper text: `--font-size-xs`, `--color-gray-500`
- Error message: `--font-size-xs`, `--color-error`

---

## 3. Card

### Base Style
- Background: `--color-background`
- Border: 1px solid `--color-border`
- Border radius: `--radius-lg`
- Shadow: `--shadow-sm`
- Padding: `--spacing-6`

### Variants
| Variant | Description |
|---------|-------------|
| Default | Base card |
| Elevated | Uses `--shadow-md` |
| Outlined | No shadow, border only |

---

## 4. Modal

### Base Style
- Background: `--color-background`
- Border radius: `--radius-xl`
- Shadow: `--shadow-xl`
- Padding: `--spacing-8`
- Max width: 480px (sm), 640px (md), 800px (lg)

### Sub-elements
- Backdrop: `rgba(0, 0, 0, 0.5)`, z-index: `--z-modal-backdrop`
- Header: `--font-size-xl`, `--font-weight-semibold`
- Footer: Button area, right-aligned

---

## 5. Table

### Base Style
- Header background: `--color-gray-50`
- Header font: `--font-size-sm`, `--font-weight-semibold`
- Cell padding: `--spacing-3` (vertical), `--spacing-4` (horizontal)
- Row border: 1px solid `--color-border`
- Row hover: `--color-gray-50`

---

## 6. Navigation

### Sidebar
- Width: 240px (desktop), collapsed: 64px
- Background: `--color-gray-900`
- Text: `--color-gray-300`
- Active item: `--color-primary-500` background

### Top Header
- Height: 64px
- Background: `--color-background`
- Bottom border: 1px solid `--color-border`
- Shadow: `--shadow-sm`

---

## 7. Badge

| Variant | Background | Text |
|---------|------------|------|
| Default | `--color-gray-100` | `--color-gray-700` |
| Primary | `--color-primary-50` | `--color-primary-700` |
| Success | `#dcfce7` | `#15803d` |
| Warning | `#fef3c7` | `#b45309` |
| Error | `#fee2e2` | `#b91c1c` |

---

## 8. Toast

- Position: Top-right, z-index: `--z-toast`
- Border radius: `--radius-md`
- Shadow: `--shadow-lg`
- Auto-dismiss: 5 seconds
- Types: success (green), error (red), warning (yellow), info (blue)

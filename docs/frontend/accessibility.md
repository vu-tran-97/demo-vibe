# Frontend Accessibility Documentation

## Current Accessibility Features

### ARIA Attributes

| Component | Feature | Implementation |
|-----------|---------|---------------|
| **AdminCreateUserModal** | Dialog role | `role="dialog"`, `aria-modal="true"`, `aria-labelledby="create-user-title"` |
| **ConfirmActionModal** | Dialog role | `role="dialog"`, `aria-modal="true"`, `aria-labelledby="confirm-title"` |
| **AdminUserTable** | Table semantics | `aria-label="User list"` on `<table>`, `scope="col"` on `<th>`, `aria-busy` on `<tbody>` during loading |
| **AdminUserTable** | Empty state | `role="status"` on empty state container |
| **AdminUserFilters** | Input labels | `aria-label` on search input, role filter, and status filter |
| **RoleBadge** | Screen reader text | `aria-label="Role: {label}"` |
| **StatusBadge** | Screen reader text | `aria-label="Status: {label}"` |
| **Pagination** | Navigation labels | `aria-label` on all page buttons, `aria-current="page"` on active button |
| **GlobalSearchBar** | Mobile button | `aria-label="Search"` on mobile search trigger |
| **AdminUsersPageClient** | Toast alerts | `role="alert"` on toast notifications |
| **AdminUserFilters** | Clear button | `aria-label="Clear search"` on clear button |
| **KebabMenu** | Action button | `aria-label="User actions"` on kebab trigger |

### Keyboard Support

| Component | Shortcut | Action |
|-----------|----------|--------|
| **GlobalSearchBar** | `Cmd+K` / `Ctrl+K` | Focus search input |
| **GlobalSearchBar** | `Escape` | Close dropdown, blur input |
| **GlobalSearchBar** | `ArrowUp` / `ArrowDown` | Navigate suggestions |
| **GlobalSearchBar** | `Enter` | Execute search or select suggestion |
| **AdminCreateUserModal** | `Escape` | Close modal |
| **ConfirmActionModal** | `Escape` | Close modal |
| **AuthModal** | N/A | Form navigation via Tab |

### Form Accessibility

| Feature | Status |
|---------|--------|
| `<label>` with `htmlFor` on form inputs | Implemented in AuthModal, AdminCreateUserModal |
| `autoComplete` attributes | Implemented (`email`, `current-password`, `new-password`, `name`) |
| Required field indicators | Visual asterisk (`*`) markers on required fields |
| Error messages linked to fields | Per-field error messages displayed below inputs |
| `type="email"` / `type="password"` | Correct input types used throughout |

### Visual Accessibility

| Feature | Status |
|---------|--------|
| Scroll lock on modal open | Implemented (`document.body.style.overflow = 'hidden'`) |
| Visually hidden utility class | `.visually-hidden` defined in `globals.css` |
| Focus auto-management | ConfirmActionModal auto-focuses the confirm button via `useRef` |

### Semantic HTML

| Feature | Status |
|---------|--------|
| `<table>` with `<thead>`, `<tbody>`, `<th scope="col">` | Used in AdminUserTable, dashboard tables |
| `<nav>` for navigation | Used in dashboard layout sidebar, category bar |
| `<header>` for page header | Used in dashboard layout top bar |
| `<main>` for primary content | Used in dashboard layout |
| `<aside>` for sidebar | Used in dashboard layout |
| `<footer>` for page footer | Used on home page |
| `<form>` with `onSubmit` | Used in AuthModal, search forms, create forms |
| `<button type="button">` vs `<button type="submit">` | Correctly differentiated |

---

## WCAG 2.1 AA Compliance Checklist

### Perceivable

| Criterion | Level | Status | Notes |
|-----------|-------|--------|-------|
| 1.1.1 Non-text Content | A | Partial | Product images use `alt` text, but SVG icons lack `aria-label` in most cases. Avatar images have `alt`. |
| 1.2.1 Audio-only and Video-only | A | N/A | No audio/video content |
| 1.3.1 Info and Relationships | A | Partial | Tables use semantic markup. Forms have labels. Some visual-only relationships (color-coded badges) have `aria-label`. |
| 1.3.2 Meaningful Sequence | A | Pass | DOM order matches visual order |
| 1.3.3 Sensory Characteristics | A | Partial | Some UI uses icon-only buttons (kebab menu `&#x22EE;`, close button `&#10005;`) that rely on visual recognition |
| 1.4.1 Use of Color | A | Partial | Status badges use both color and text. Role badges use both color and label. Toast types use icon + color. |
| 1.4.2 Audio Control | A | N/A | No audio content |
| 1.4.3 Contrast (Minimum) | AA | Needs audit | `--muted: #9A9A94` on `--ivory: #FAFAF7` may not meet 4.5:1 ratio. `--slate: #6B6B6B` on ivory should be verified. |
| 1.4.4 Resize Text | AA | Pass | Uses `rem` units for spacing. Font sizes scale with browser zoom. |
| 1.4.5 Images of Text | AA | Pass | No images of text used |
| 1.4.10 Reflow | AA | Pass | Responsive layout adapts to 320px viewport width |
| 1.4.11 Non-text Contrast | AA | Needs audit | Form input borders, button outlines need contrast verification |
| 1.4.12 Text Spacing | AA | Pass | Layout does not break with increased text spacing |
| 1.4.13 Content on Hover or Focus | AA | Partial | Dropdown menus appear on click (not hover), which is good. Tooltips not used. |

### Operable

| Criterion | Level | Status | Notes |
|-----------|-------|--------|-------|
| 2.1.1 Keyboard | A | Partial | GlobalSearchBar has full keyboard support. Modals support Escape. KebabMenu and UserMenu dropdown are mouse-only (no keyboard open/navigate). |
| 2.1.2 No Keyboard Trap | A | Pass | Modals can be closed with Escape. No traps detected. |
| 2.1.4 Character Key Shortcuts | A | Pass | `Cmd+K` uses modifier key as required |
| 2.2.1 Timing Adjustable | A | Partial | Toasts auto-dismiss after 3s with no way to pause. Cart stock messages auto-dismiss after 4s. |
| 2.3.1 Three Flashes | A | Pass | No flashing content |
| 2.4.1 Bypass Blocks | A | Fail | No skip-to-content link implemented |
| 2.4.2 Page Titled | A | Pass | Root layout sets page title via metadata |
| 2.4.3 Focus Order | A | Pass | Tab order follows visual layout |
| 2.4.4 Link Purpose (In Context) | A | Partial | Most links have clear text. Some use generic text like "View All" without additional context. |
| 2.4.5 Multiple Ways | AA | Pass | Search + navigation + category browsing |
| 2.4.6 Headings and Labels | AA | Partial | Main headings present but not always hierarchically structured (e.g., some pages may skip h2 to h3) |
| 2.4.7 Focus Visible | AA | Needs audit | No explicit `:focus-visible` styles found in globals.css. Relies on browser defaults. |
| 2.5.1 Pointer Gestures | A | Pass | No multi-point or path-based gestures required |
| 2.5.2 Pointer Cancellation | A | Pass | Click handlers use standard event handling |
| 2.5.3 Label in Name | A | Pass | Visible text matches accessible names |

### Understandable

| Criterion | Level | Status | Notes |
|-----------|-------|--------|-------|
| 3.1.1 Language of Page | A | Pass | `<html lang="en">` set in root layout |
| 3.2.1 On Focus | A | Pass | No unexpected context changes on focus |
| 3.2.2 On Input | A | Pass | Form submissions require explicit action (button click) |
| 3.3.1 Error Identification | A | Pass | Form errors identified with text messages per field |
| 3.3.2 Labels or Instructions | A | Pass | Form fields have labels and placeholder text |
| 3.3.3 Error Suggestion | AA | Partial | Password field suggests format requirements. Email shows "Invalid email format". Not all errors provide correction suggestions. |
| 3.3.4 Error Prevention (Legal, Financial, Data) | AA | Pass | Delete/suspend actions require confirmation modal |

### Robust

| Criterion | Level | Status | Notes |
|-----------|-------|--------|-------|
| 4.1.1 Parsing | A | Pass | Valid HTML generated by React/JSX |
| 4.1.2 Name, Role, Value | A | Partial | Modals have proper `role="dialog"`. Tables have proper semantics. Custom dropdowns (KebabMenu, UserMenu) lack `role="menu"` / `role="menuitem"`. |
| 4.1.3 Status Messages | AA | Partial | Toast notifications use `role="alert"`. Empty states use `role="status"`. Loading states use `aria-busy`. Search loading indicator lacks `role="status"`. |

---

## Recommendations for Improvement

### High Priority

1. **Add skip-to-content link** (WCAG 2.4.1)
   Add a visually hidden link at the top of the page that becomes visible on focus:
   ```html
   <a href="#main-content" className="visually-hidden-focusable">Skip to main content</a>
   ```
   The `.visually-hidden` class already exists in `globals.css` -- extend it with a `:focus` variant.

2. **Add focus-visible styles** (WCAG 2.4.7)
   Add explicit focus indicator styles in `globals.css`:
   ```css
   :focus-visible {
     outline: 2px solid var(--gold);
     outline-offset: 2px;
   }
   ```
   Currently relies entirely on browser defaults, which may be invisible on some elements.

3. **Make dropdown menus keyboard-accessible** (WCAG 2.1.1)
   - `UserMenu`: Add `Enter`/`Space` to toggle, `ArrowDown`/`ArrowUp` to navigate items, `Escape` to close
   - `KebabMenu`: Same keyboard pattern. Add `role="menu"` on the dropdown and `role="menuitem"` on items.

4. **Add focus trapping in modals** (WCAG 2.1.2 enhancement)
   While Escape closes modals, Tab can currently move focus to elements behind the modal overlay. Implement focus trapping to contain Tab navigation within the modal.

5. **Audit color contrast** (WCAG 1.4.3)
   Verify these combinations meet 4.5:1 ratio for normal text:
   - `--muted (#9A9A94)` on `--ivory (#FAFAF7)` -- estimated ratio ~3.1:1 (FAIL)
   - `--slate (#6B6B6B)` on `--ivory (#FAFAF7)` -- estimated ratio ~4.3:1 (borderline FAIL)
   - `--gold (#C8A96E)` on `--white (#FFFFFF)` -- estimated ratio ~2.8:1 (FAIL for text)

   **Fix**: Darken `--muted` to at least `#767670`, `--slate` to at least `#636363`, and ensure gold-on-white is only used for large text or decorative elements.

### Medium Priority

6. **Make toast notifications pausable** (WCAG 2.2.1)
   Allow users to hover or focus on a toast to pause the auto-dismiss timer. Consider adding a "dismiss all" option.

7. **Add `aria-live` region for search suggestions** (WCAG 4.1.3)
   Wrap the search suggestion dropdown in an `aria-live="polite"` region so screen readers announce when suggestions appear:
   ```html
   <div aria-live="polite" aria-atomic="true">
     {suggestions.length} suggestions available
   </div>
   ```

8. **Improve heading hierarchy**
   Ensure each page follows a sequential heading structure (h1 > h2 > h3). Verify no heading levels are skipped.

9. **Add `aria-describedby` for form validation** (WCAG 3.3.1 enhancement)
   Link error messages to inputs using `aria-describedby`:
   ```html
   <input id="email" aria-describedby="email-error" />
   <span id="email-error" role="alert">Invalid email format</span>
   ```

10. **Add `alt=""` to decorative images**
    Product card images that serve as links already have `alt={product.name}`, which is correct. Verify that purely decorative images (if any) use `alt=""`.

### Low Priority

11. **Add `prefers-reduced-motion` media query**
    Respect users who prefer reduced motion:
    ```css
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
    ```

12. **Add `prefers-color-scheme` support**
    Consider adding a dark mode using the existing CSS Custom Properties system. The token-based approach makes this straightforward.

13. **Improve link purpose for "View All" links** (WCAG 2.4.4)
    Add visually hidden context text:
    ```html
    <Link href="/dashboard/orders">
      View All <span className="visually-hidden">orders</span>
    </Link>
    ```

14. **Add landmark roles to sidebar sections**
    The dashboard sidebar navigation could benefit from `aria-label="Main navigation"` on the `<nav>` element and `aria-label="Admin navigation"` on the admin section.

15. **Test with screen readers**
    Perform manual testing with:
    - VoiceOver (macOS/iOS)
    - NVDA (Windows)
    - TalkBack (Android)

    Priority flows to test: login, product browsing, cart management, checkout, admin user management.

# Homepage E2E Test Scenarios

## Overview
- **Feature**: Homepage — marketplace landing page with product browsing, auth modal, and navigation
- **Related Modules**: Auth, Products, Cart
- **API Endpoints**: POST /api/auth/signup, POST /api/auth/login, POST /api/auth/logout
- **DB Tables**: TB_COMM_USER, TB_COMM_RFRSH_TKN
- **Blueprint**: N/A (frontend-only, mock data)

---

## Scenario Group 1: Page Load & Layout

### E2E-HP-001: Homepage loads with full layout
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: No user logged in
- **User Journey**:
  1. Navigate to `http://localhost:3000`
  2. Wait for page to fully render
- **Expected Results**:
  - UI: Top bar with "Sign Up" and "Sign In" buttons visible
  - UI: Header with "Vibe" logo and search bar rendered
  - UI: Category navigation with 7 categories (All, Ceramics, Textiles, Art Prints, Jewelry, Home Decor, Artisan Foods)
  - UI: Flash deals banner visible
  - UI: Product grid with up to 8 products rendered
  - UI: Footer with copyright text visible
  - UI: `fadeUp` animations applied to product cards with staggered delays
- **Verification Method**: snapshot
- **Test Data**: None (mock data)

### E2E-HP-002: Responsive layout — mobile viewport
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: No user logged in
- **User Journey**:
  1. Set viewport to 375x667 (mobile)
  2. Navigate to `http://localhost:3000`
- **Expected Results**:
  - UI: Category nav scrolls horizontally
  - UI: Product grid displays 1 column
  - UI: Search bar adapts to mobile width
  - UI: Footer stacks vertically
- **Verification Method**: snapshot
- **Test Data**: None

### E2E-HP-003: Responsive layout — tablet viewport
- **Type**: Happy Path
- **Priority**: Low
- **Preconditions**: No user logged in
- **User Journey**:
  1. Set viewport to 768x1024 (tablet)
  2. Navigate to `http://localhost:3000`
- **Expected Results**:
  - UI: Product grid displays 2 columns
  - UI: Layout adapts without horizontal overflow
- **Verification Method**: snapshot
- **Test Data**: None

---

## Scenario Group 2: Authentication Modal

### E2E-HP-004: Open Sign In modal from top bar
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: No user logged in
- **User Journey**:
  1. Navigate to `http://localhost:3000`
  2. Click "Sign In" button in top bar
- **Expected Results**:
  - UI: Auth modal overlay appears with backdrop blur
  - UI: Modal shows "Welcome back" title, email and password fields, "Sign In" button
  - UI: "Don't have an account? Sign Up" link visible
  - UI: `scaleIn` animation plays on modal
- **Verification Method**: snapshot
- **Test Data**: None

### E2E-HP-005: Open Sign Up modal from top bar
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: No user logged in
- **User Journey**:
  1. Navigate to `http://localhost:3000`
  2. Click "Sign Up" button in top bar
- **Expected Results**:
  - UI: Auth modal appears with "Create Account" title
  - UI: Fields: name, email, password, confirm password
  - UI: "Sign Up" submit button visible
  - UI: "Already have an account? Sign In" link visible
- **Verification Method**: snapshot
- **Test Data**: None

### E2E-HP-006: Switch between Sign In and Sign Up in modal
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: No user logged in, auth modal open (Sign In mode)
- **User Journey**:
  1. Open Sign In modal
  2. Click "Don't have an account? Sign Up" link
  3. Verify Sign Up form is shown
  4. Click "Already have an account? Sign In" link
  5. Verify Sign In form is shown
- **Expected Results**:
  - UI: Modal toggles between Sign In and Sign Up views without closing
  - UI: Form fields clear on toggle
- **Verification Method**: snapshot
- **Test Data**: None

### E2E-HP-007: Close auth modal by clicking overlay
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Auth modal is open
- **User Journey**:
  1. Open Sign In modal
  2. Click on the dark overlay outside the modal
- **Expected Results**:
  - UI: Modal closes
  - UI: Homepage is fully interactive again
- **Verification Method**: snapshot
- **Test Data**: None

### E2E-HP-008: Successful sign up via modal
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: No user logged in, server running
- **User Journey**:
  1. Click "Sign Up" button
  2. Fill in name: "Test User"
  3. Fill in email: "testuser-hp008@example.com"
  4. Fill in password: "TestPass123!"
  5. Fill in confirm password: "TestPass123!"
  6. Click "Sign Up" submit button
  7. Wait for API response
- **Expected Results**:
  - API: POST /api/auth/signup returns 201
  - UI: Modal closes
  - UI: Top bar changes to show "Welcome, Test User" and "Sign Out" button
  - UI: Product cards become clickable (no login gate)
- **Verification Method**: snapshot / network
- **Test Data**: Unique email per test run

### E2E-HP-009: Successful sign in via modal
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: User "testuser-hp008@example.com" exists in DB
- **User Journey**:
  1. Click "Sign In" button
  2. Fill in email: "testuser-hp008@example.com"
  3. Fill in password: "TestPass123!"
  4. Click "Sign In" submit button
  5. Wait for API response
- **Expected Results**:
  - API: POST /api/auth/login returns 200 with tokens
  - UI: Modal closes
  - UI: Top bar shows welcome message and "Sign Out" button
- **Verification Method**: snapshot / network
- **Test Data**: Pre-existing user account

### E2E-HP-010: Sign in with invalid credentials
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: No user logged in
- **User Journey**:
  1. Open Sign In modal
  2. Fill in email: "wrong@example.com"
  3. Fill in password: "wrongpassword"
  4. Click "Sign In"
- **Expected Results**:
  - API: POST /api/auth/login returns 401
  - UI: Error message displayed in modal (e.g., "Invalid credentials")
  - UI: Modal stays open
- **Verification Method**: snapshot / network
- **Test Data**: Non-existent credentials

### E2E-HP-011: Sign up with mismatched passwords
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: No user logged in
- **User Journey**:
  1. Open Sign Up modal
  2. Fill in name: "Test"
  3. Fill in email: "test@example.com"
  4. Fill in password: "Pass123!"
  5. Fill in confirm password: "Different456!"
  6. Click "Sign Up"
- **Expected Results**:
  - UI: Error message "Passwords do not match" displayed
  - UI: Form not submitted
  - API: No network request to /api/auth/signup
- **Verification Method**: snapshot / network
- **Test Data**: None

### E2E-HP-012: Sign out from homepage
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User is logged in
- **User Journey**:
  1. Navigate to homepage (logged in state)
  2. Click "Sign Out" button in top bar
- **Expected Results**:
  - API: POST /api/auth/logout called
  - UI: Top bar reverts to "Sign Up" / "Sign In" buttons
  - UI: Clicking a product now triggers auth modal instead of navigation
- **Verification Method**: snapshot / network
- **Test Data**: Logged-in user session

---

## Scenario Group 3: Product Browsing

### E2E-HP-013: Filter products by category
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Navigate to homepage
  2. Click "Ceramics" category button
- **Expected Results**:
  - UI: "Ceramics" button gets active styling (charcoal background)
  - UI: Only products with category "CERAMICS" displayed in grid
  - UI: Product count changes in the displayed grid
- **Verification Method**: snapshot
- **Test Data**: Mock products include ceramics category

### E2E-HP-014: Sort products by price (low to high)
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Navigate to homepage
  2. Select "Price: Low to High" from sort dropdown
- **Expected Results**:
  - UI: Products reorder with cheapest first
  - UI: First product price <= second product price <= ...
- **Verification Method**: snapshot
- **Test Data**: Mock products with varied prices

### E2E-HP-015: Navigate product pagination
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Homepage loaded with "All" category (12 products, 8 per page)
- **User Journey**:
  1. Navigate to homepage
  2. Verify page 1 shows 8 products
  3. Click page 2 button
- **Expected Results**:
  - UI: Page 2 shows remaining 4 products
  - UI: Page 2 button has active styling
  - UI: Page scrolls to top of product grid
- **Verification Method**: snapshot
- **Test Data**: 12 mock products

### E2E-HP-016: Click product when not logged in
- **Type**: Edge Case
- **Priority**: High
- **Preconditions**: No user logged in
- **User Journey**:
  1. Navigate to homepage
  2. Click on a product card
- **Expected Results**:
  - UI: Auth modal opens (Sign In mode) instead of navigating to product detail
  - UI: Product detail page is NOT loaded
- **Verification Method**: snapshot
- **Test Data**: None

### E2E-HP-017: Click product when logged in
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User is logged in
- **User Journey**:
  1. Navigate to homepage (logged in)
  2. Click on a product card (e.g., "Speckled Ceramic Vase")
- **Expected Results**:
  - UI: Navigates to `/dashboard/products/{product-id}`
  - UI: Product detail page loads with product info
- **Verification Method**: snapshot / network
- **Test Data**: Logged-in user, mock product ID

### E2E-HP-018: Search products
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Navigate to homepage
  2. Type "ceramic" in search bar
  3. Press Enter or wait for debounce
- **Expected Results**:
  - UI: Product grid filters to show only products matching "ceramic" in name or description
  - UI: Non-matching products are hidden
- **Verification Method**: snapshot
- **Test Data**: Search term that matches some mock products

---

## Scenario Group 4: Edge Cases

### E2E-HP-019: Empty category filter result
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Filter by a category
  2. Further filter by sort that yields 0 visible products (or combine category + search with no matches)
- **Expected Results**:
  - UI: Empty state or "No products found" message displayed gracefully
  - UI: No JavaScript errors in console
- **Verification Method**: snapshot / console
- **Test Data**: None

### E2E-HP-020: Rapid category switching
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Quickly click through all 7 category buttons in succession
- **Expected Results**:
  - UI: Each click updates the product grid correctly
  - UI: No flickering, no stale data displayed
  - Console: No errors
- **Verification Method**: snapshot / console
- **Test Data**: None

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 14 |
| Alternative Path | 0 |
| Edge Case | 3 |
| Error Path | 3 |
| **Total** | **20** |

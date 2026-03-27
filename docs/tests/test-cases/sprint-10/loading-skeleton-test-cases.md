# Loading Skeleton Test Cases

## TC-001: Home Page Loading Skeleton Renders
- **Preconditions**: Server running on localhost:3000
- **Test Steps**:
  1. Navigate to http://localhost:3000
  2. Verify page loads without errors
  3. Check for console errors
- **Expected Result**: Page renders with product grid, no console errors
- **Verification Method**: snapshot / console

## TC-002: Product Detail Page Load
- **Preconditions**: At least one product exists
- **Test Steps**:
  1. Navigate to a product detail page
  2. Verify product info renders
  3. Check for console errors
- **Expected Result**: Product details display correctly
- **Verification Method**: snapshot / console / network

## TC-003: Dashboard Page Load
- **Preconditions**: Server running
- **Test Steps**:
  1. Navigate to /dashboard
  2. Verify page structure renders
  3. Check for console errors
- **Expected Result**: Dashboard layout renders
- **Verification Method**: snapshot / console

## TC-004: Cart Page Load
- **Preconditions**: Server running
- **Test Steps**:
  1. Navigate to /cart
  2. Verify cart page renders
  3. Check for console errors
- **Expected Result**: Cart page displays correctly
- **Verification Method**: snapshot / console

## TC-005: Orders Page Load
- **Preconditions**: Server running
- **Test Steps**:
  1. Navigate to /orders
  2. Verify page renders
  3. Check for console errors
- **Expected Result**: Orders page displays
- **Verification Method**: snapshot / console

## TC-006: Settings Page Load
- **Preconditions**: Server running
- **Test Steps**:
  1. Navigate to /settings
  2. Verify page renders
  3. Check for console errors
- **Expected Result**: Settings page displays
- **Verification Method**: snapshot / console

## TC-007: Checkout Page Load
- **Preconditions**: Server running
- **Test Steps**:
  1. Navigate to /checkout
  2. Verify page renders
  3. Check for console errors
- **Expected Result**: Checkout page displays
- **Verification Method**: snapshot / console

## TC-008: Responsive Layout - Home Page
- **Preconditions**: Server running
- **Test Steps**:
  1. Desktop viewport (1280x720)
  2. Tablet viewport (768x1024)
  3. Mobile viewport (375x667)
  4. Check layout at each breakpoint
- **Expected Result**: No layout breakage at any viewport
- **Verification Method**: screenshot

## TC-009: Network Request Verification - Home Page
- **Preconditions**: Server running
- **Test Steps**:
  1. Navigate to home page
  2. Check all XHR/fetch requests
  3. Verify no 4xx/5xx errors
- **Expected Result**: All API calls succeed
- **Verification Method**: network

## TC-010: Product Quick Add to Cart
- **Preconditions**: Server running, products loaded
- **Test Steps**:
  1. Navigate to home page
  2. Click add-to-cart button on a product
  3. Verify toast notification appears
  4. Navigate to /cart and verify item
- **Expected Result**: Product added to cart successfully
- **Verification Method**: snapshot / network

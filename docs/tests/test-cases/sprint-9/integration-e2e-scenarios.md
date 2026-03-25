# Sprint 9 Integration Test Cases — DB Migration + Firebase Auth

## TC-001: Homepage Load & Product API
- **Preconditions**: Server running, DB seeded
- **Test Steps**:
  1. Navigate to http://localhost:3000
  2. Verify product grid renders
  3. Check API call GET /api/products returns 200
  4. Verify category filters visible
- **Expected Result**: Products display with images, prices, ratings
- **Verification Method**: snapshot / network

## TC-002: Product Category Filtering
- **Preconditions**: Homepage loaded
- **Test Steps**:
  1. Click "Ceramics & Pottery" category button
  2. Wait for product grid to update
  3. Verify network request includes category filter
- **Expected Result**: Filtered products shown
- **Verification Method**: snapshot / network

## TC-003: Product Detail Page
- **Preconditions**: Homepage loaded
- **Test Steps**:
  1. Click on a product card
  2. Verify product detail page loads
  3. Check product info (name, price, description, images)
- **Expected Result**: Product detail page with full information
- **Verification Method**: snapshot / network

## TC-004: Auth — Sign Up Modal
- **Preconditions**: Homepage loaded, user not logged in
- **Test Steps**:
  1. Click "Sign Up" button
  2. Verify signup form renders (email, password fields)
  3. Attempt signup with test data
- **Expected Result**: Signup form displays, Firebase Auth integration works
- **Verification Method**: snapshot / network / console

## TC-005: Auth — Sign In Modal
- **Preconditions**: Homepage loaded, user not logged in
- **Test Steps**:
  1. Click "Sign In" button
  2. Verify login form renders
  3. Attempt login with test credentials
- **Expected Result**: Login form displays, Firebase Auth integration works
- **Verification Method**: snapshot / network / console

## TC-006: Auth — Protected Route Redirect
- **Preconditions**: User not logged in
- **Test Steps**:
  1. Navigate to /dashboard/board
  2. Verify redirect to login or auth modal appears
- **Expected Result**: Unauthenticated users cannot access protected pages
- **Verification Method**: snapshot / network

## TC-007: Search Functionality
- **Preconditions**: Homepage loaded
- **Test Steps**:
  1. Type search query in search box
  2. Submit search
  3. Verify search results page
- **Expected Result**: Search results display matching products
- **Verification Method**: snapshot / network

## TC-008: Board (Bulletin Board) Page Load
- **Preconditions**: Server running
- **Test Steps**:
  1. Navigate to /dashboard/board
  2. Verify board list renders
  3. Check API call for board posts
- **Expected Result**: Board page loads with post list
- **Verification Method**: snapshot / network

## TC-009: Responsive Layout — Mobile
- **Preconditions**: Homepage loaded
- **Test Steps**:
  1. Resize viewport to 375x667 (mobile)
  2. Verify layout adapts
  3. Check navigation menu behavior
- **Expected Result**: Mobile-friendly layout, no overflow/breakage
- **Verification Method**: snapshot

## TC-010: Responsive Layout — Tablet
- **Preconditions**: Homepage loaded
- **Test Steps**:
  1. Resize viewport to 768x1024 (tablet)
  2. Verify layout adapts
- **Expected Result**: Tablet-optimized layout
- **Verification Method**: snapshot

## TC-011: API Health Check
- **Preconditions**: Backend server running
- **Test Steps**:
  1. Call GET /api/health (or root endpoint)
  2. Verify 200 response
- **Expected Result**: Backend is healthy and connected to PostgreSQL
- **Verification Method**: network

## TC-012: Console Error Audit
- **Preconditions**: Navigate through main pages
- **Test Steps**:
  1. Visit homepage, product page, board page, auth pages
  2. Collect all console errors/warnings
- **Expected Result**: No critical JavaScript errors
- **Verification Method**: console

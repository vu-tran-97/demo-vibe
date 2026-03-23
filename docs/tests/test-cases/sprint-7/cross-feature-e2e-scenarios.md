# Sprint 7 Cross-Feature E2E Test Scenarios

## Overview
- **Scope**: End-to-end user journeys spanning email service + role signup + existing features
- **Related Features**: 011-email-service, 012-role-signup, 001-auth, 004-product, 009-payment-order

## Scenario Group 1: Seller Full Lifecycle

### E2E-CF-001: Seller signup → verify email → create product → receive order email
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: SMTP configured, products available for buyer test
- **User Journey**:
  1. Navigate to /auth/signup
  2. Select "Seller" role, fill form, submit
  3. Verify redirect to /dashboard/products/create
  4. Check Mailtrap for welcome email with verification link
  5. Open verification link → email verified
  6. Create a product (fill name, price, category, image URL)
  7. Verify product appears in /dashboard/products/my
  8. Login as a different BUYER user
  9. Browse products, find the seller's product
  10. Add to cart, checkout, create order
  11. Check Mailtrap for order confirmation email to buyer
- **Expected Results**:
  - Seller receives welcome email with "Seller" messaging
  - Email verification sets emailVrfcYn = 'Y'
  - Product created by seller is visible in public catalog
  - Buyer receives order confirmation email with correct order details
  - TL_COMM_EML_LOG has 2 records: welcome (seller) + order-confirm (buyer)
- **Verification Method**: network / db-query / server-log
- **Test Data**: Seller + Buyer accounts, 1 product, 1 order

### E2E-CF-002: Buyer signup → verify email → purchase → order email → view orders
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: SMTP configured, products available
- **User Journey**:
  1. Navigate to /auth/signup
  2. Select "Buyer" role (default), fill form, submit
  3. Verify redirect to / (homepage)
  4. Check Mailtrap for welcome email
  5. Click verification link in email
  6. Browse products on homepage
  7. Click a product, add to cart
  8. Navigate to /checkout
  9. Fill shipping info, submit order
  10. Check Mailtrap for order confirmation email
  11. Navigate to /orders to view order history
  12. Verify order appears with correct status
- **Expected Results**:
  - Buyer receives welcome email
  - Email verification succeeds
  - Order created with status PENDING
  - Order confirmation email contains correct items and total
  - Order visible in buyer's order history
- **Verification Method**: snapshot / network / db-query
- **Test Data**: Buyer account, cart items, shipping address

## Scenario Group 2: Password Reset with Email

### E2E-CF-003: Forgot password → reset email → reset → login with new password
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Registered user "reset-flow@test.com" with password "OldPass1!"
- **User Journey**:
  1. Navigate to /auth/forgot-password
  2. Enter email "reset-flow@test.com", submit
  3. Check Mailtrap for reset email
  4. Extract reset URL from email
  5. Navigate to reset URL
  6. Enter new password "NewPass1!", confirm, submit
  7. Navigate to /auth/login
  8. Login with email "reset-flow@test.com" and password "NewPass1!"
  9. Verify login succeeds
- **Expected Results**:
  - Reset email received in Mailtrap with valid reset link
  - Password reset succeeds
  - Login with old password fails
  - Login with new password succeeds
  - TL_COMM_EML_LOG has record for reset-password template
- **Verification Method**: network / db-query
- **Test Data**: { email: "reset-flow@test.com", oldPassword: "OldPass1!", newPassword: "NewPass1!" }

## Scenario Group 3: Role-Specific Access Control

### E2E-CF-004: Buyer cannot access seller product management
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as BUYER
- **User Journey**:
  1. Login as BUYER
  2. Try to navigate to /dashboard/products/create
  3. Try to POST /api/products with BUYER token
- **Expected Results**:
  - UI: Access denied or redirect
  - API: POST /api/products returns 403 Forbidden
- **Verification Method**: network / snapshot
- **Test Data**: BUYER access token

### E2E-CF-005: Seller can create products but also purchase as buyer
- **Type**: Alternative Path
- **Priority**: Medium
- **Preconditions**: Logged in as SELLER
- **User Journey**:
  1. Login as SELLER
  2. Create a product (verify access)
  3. Browse other sellers' products
  4. Add to cart, checkout, place order
  5. Check for order confirmation email
- **Expected Results**:
  - Seller can create products
  - Seller can also place orders (dual role behavior)
  - Order confirmation email received
- **Verification Method**: network / db-query
- **Test Data**: SELLER account, other seller's products

## Scenario Group 4: Email + Role Edge Cases

### E2E-CF-006: Multiple signups produce separate welcome emails
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: SMTP configured
- **User Journey**:
  1. Signup as BUYER with email "multi-1@test.com"
  2. Signup as SELLER with email "multi-2@test.com"
  3. Check Mailtrap inbox
- **Expected Results**:
  - 2 separate welcome emails in Mailtrap
  - Each addressed to correct recipient
  - TL_COMM_EML_LOG has 2 records, both SUCC
- **Verification Method**: db-query
- **Test Data**: 2 unique email addresses

### E2E-CF-007: Guest checkout → signup after → receives both order + welcome emails
- **Type**: Alternative Path
- **Priority**: Medium
- **Preconditions**: Guest checkout enabled, SMTP configured
- **User Journey**:
  1. Browse products as guest (not logged in)
  2. Add to cart, proceed to checkout
  3. Complete guest checkout with email "guest-then-signup@test.com"
  4. After order, navigate to /auth/signup
  5. Sign up with same email "guest-then-signup@test.com" as BUYER
- **Expected Results**:
  - Order confirmation email sent to guest email
  - Welcome email sent on signup
  - Mailtrap shows both emails
- **Verification Method**: network / db-query
- **Test Data**: { email: "guest-then-signup@test.com" }

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 3 |
| Alternative Path | 2 |
| Edge Case | 1 |
| Error Path | 1 |
| **Total** | **7** |

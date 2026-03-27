# Search E2E Test Scenarios

## Overview
- **Feature**: Global search across products and posts, search suggestions
- **Related Modules**: Product, Board
- **API Endpoints**: GET /api/search?q=, GET /api/search/suggest?q=
- **DB Tables**: Product, Post
- **Blueprint**: docs/blueprints/010-search-filter/blueprint.md

## Scenario Group 1: Search from Homepage

### E2E-001: Search products by keyword
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Homepage loaded, products exist
- **User Journey**:
  1. Click search bar
  2. Type "ceramic"
  3. Press Enter or click search icon
  4. Verify search results page loads
  5. Verify results contain ceramic-related products
- **Expected Results**:
  - UI: Search results page with product cards
  - API: GET /api/search?q=ceramic returns 200
- **Verification Method**: snapshot / network

### E2E-002: Search with no results
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Type "xyznonexistent123" in search bar
  2. Submit search
  3. Verify "no results" message
- **Expected Results**:
  - UI: "No results found" message
  - API: GET /api/search?q=xyznonexistent123 returns 200 with empty results
- **Verification Method**: snapshot / network

### E2E-003: Search suggestions (autocomplete)
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Click search bar
  2. Start typing "tea"
  3. Verify suggestion dropdown appears
- **Expected Results**:
  - API: GET /api/search/suggest?q=tea returns 200
  - UI: Suggestion list with matching terms
- **Verification Method**: snapshot / network

### E2E-004: Search with empty query
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Click search bar
  2. Press Enter without typing
  3. Verify behavior (no navigation or validation message)
- **Expected Results**:
  - UI: No navigation or show all results
- **Verification Method**: snapshot

## Scenario Group 2: Dashboard Search

### E2E-005: Search from dashboard
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in, on dashboard
- **User Journey**:
  1. Navigate to /dashboard/search?q=wool
  2. Verify search results load
- **Expected Results**:
  - API: GET /api/search?q=wool returns 200
  - UI: Filtered search results
- **Verification Method**: snapshot / network

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 3 |
| Alternative Path | 0 |
| Edge Case | 2 |
| Error Path | 0 |
| **Total** | **5** |

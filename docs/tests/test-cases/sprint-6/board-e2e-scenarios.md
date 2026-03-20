# Board E2E Test Scenarios (Sprint 6)

## Overview
- **Feature**: Bulletin board — post CRUD, comments, search, categories
- **Related Modules**: board, auth
- **API Endpoints**: `/api/posts/*`
- **DB Tables**: TB_COMM_BOARD_POST, TB_COMM_BOARD_CMNT
- **Blueprint**: docs/blueprints/007-board/

## Scenario Group 1: Post Management

### E2E-001: Create a post
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as any authenticated user
- **User Journey**:
  1. Navigate to `/dashboard/board`
  2. Click "Create Post"
  3. Fill: title, content, category (FREE)
  4. Submit
  5. Verify redirect to post list or detail
  6. Verify new post appears at top
- **Expected Results**:
  - API: `POST /api/posts` returns new post
  - DB: Post created with `postCtgrCd: 'FREE'`, `viewCnt: 0`
- **Verification Method**: snapshot / network
- **Test Data**: Title: "E2E Test Post", Content: "Test content", Category: "FREE"

### E2E-002: View post detail with view count
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Posts exist
- **User Journey**:
  1. Navigate to `/dashboard/board`
  2. Click on a post
  3. Verify post detail shows: title, content, author, date, view count
  4. Refresh page
  5. Verify view count incremented
- **Expected Results**:
  - API: `GET /api/posts/:id`
  - DB: `viewCnt` incremented
- **Verification Method**: snapshot / network
- **Test Data**: Any existing post

### E2E-003: Edit own post
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User has created a post
- **User Journey**:
  1. Navigate to post detail
  2. Click "Edit"
  3. Change title
  4. Save
  5. Verify updated title
- **Expected Results**:
  - API: `PATCH /api/posts/:id`
  - DB: Post updated
- **Verification Method**: network
- **Test Data**: Post owned by current user

### E2E-004: Delete own post
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User has a post
- **User Journey**:
  1. Navigate to post
  2. Click "Delete"
  3. Confirm
  4. Verify removed from list
- **Expected Results**:
  - API: `DELETE /api/posts/:id`
  - DB: `delYn: 'Y'`
- **Verification Method**: network
- **Test Data**: Own post

### E2E-005: Cannot edit another user's post
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Post owned by another user
- **User Journey**:
  1. Attempt `PATCH /api/posts/:id` for another user's post
  2. Verify 403 Forbidden
- **Expected Results**:
  - API: Returns access denied error
- **Verification Method**: network
- **Test Data**: Post ID owned by a different user

## Scenario Group 2: Comments

### E2E-006: Add comment to post
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Post exists, user logged in
- **User Journey**:
  1. Navigate to post detail
  2. Type comment in textarea
  3. Submit
  4. Verify comment appears below post
- **Expected Results**:
  - API: `POST /api/posts/:id/comments`
  - DB: Comment created
  - UI: Comment rendered with author and timestamp
- **Verification Method**: snapshot / network
- **Test Data**: Comment: "Great post!"

### E2E-007: Edit own comment
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: User has a comment
- **User Journey**:
  1. Find own comment
  2. Click edit
  3. Change text
  4. Save
  5. Verify updated
- **Expected Results**:
  - API: `PATCH /api/posts/:postId/comments/:commentId`
  - DB: Comment updated
- **Verification Method**: network
- **Test Data**: Own comment

### E2E-008: Delete own comment
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: User has a comment
- **User Journey**:
  1. Find own comment
  2. Click delete
  3. Confirm
  4. Verify removed
- **Expected Results**:
  - API: `DELETE /api/posts/:postId/comments/:commentId`
  - DB: Comment soft-deleted
- **Verification Method**: network
- **Test Data**: Own comment

## Scenario Group 3: Search & Filter

### E2E-009: Filter posts by category
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Posts in multiple categories
- **User Journey**:
  1. Navigate to `/dashboard/board`
  2. Click category tab (e.g., "QNA")
  3. Verify only QNA posts shown
- **Expected Results**:
  - API: `GET /api/posts?category=QNA`
  - UI: Filtered post list
- **Verification Method**: network
- **Test Data**: Posts in QNA category

### E2E-010: Search posts by keyword
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Posts with searchable content
- **User Journey**:
  1. Navigate to `/dashboard/board`
  2. Enter search keyword
  3. Verify results filtered by keyword
- **Expected Results**:
  - API: `GET /api/posts?search=keyword`
  - UI: Matching posts displayed
- **Verification Method**: network
- **Test Data**: Search: "test"

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 9 |
| Alternative Path | 0 |
| Edge Case | 0 |
| Error Path | 1 |
| **Total** | **10** |

# Board E2E Test Scenarios

## Overview
- **Feature**: Bulletin board — post CRUD, comments, banner management
- **Related Modules**: Auth (post ownership), Admin (banner management)
- **API Endpoints**: GET /api/posts, GET /api/posts/:id, POST /api/posts, PATCH /api/posts/:id, DELETE /api/posts/:id, GET /api/posts/banner, PUT /api/posts/banner, GET /api/posts/:id/comments, POST /api/posts/:id/comments, PATCH /api/posts/:postId/comments/:commentId, DELETE /api/posts/:postId/comments/:commentId
- **DB Tables**: Post, Comment, User
- **Blueprint**: docs/blueprints/007-board/blueprint.md

## Scenario Group 1: Post Browsing (Public)

### E2E-001: View board post list
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Server running, posts exist in DB
- **User Journey**:
  1. Navigate to /dashboard/board (or direct access)
  2. Verify post list renders with title, author, date
  3. Verify pagination controls
- **Expected Results**:
  - API: GET /api/posts returns 200
  - UI: Post cards with metadata
- **Verification Method**: snapshot / network

### E2E-002: View post detail with comments
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Post exists with comments
- **User Journey**:
  1. Navigate to board list
  2. Click on a post
  3. Verify post content (title, body, author, date)
  4. Verify comments section loads
- **Expected Results**:
  - API: GET /api/posts/:id returns 200, GET /api/posts/:id/comments returns 200
  - UI: Full post content with comments thread
- **Verification Method**: snapshot / network

### E2E-003: View banner on board page
- **Type**: Happy Path
- **Priority**: Low
- **Preconditions**: Banner configured
- **User Journey**:
  1. Navigate to board page
  2. Verify banner displays at top
- **Expected Results**:
  - API: GET /api/posts/banner returns 200
  - UI: Banner content visible
- **Verification Method**: snapshot / network

## Scenario Group 2: Post CRUD (Authenticated)

### E2E-004: Create a new post
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in
- **User Journey**:
  1. Navigate to /dashboard/board/create
  2. Fill title and content
  3. Submit
  4. Verify redirect to post detail or board list
  5. Verify new post appears in list
- **Expected Results**:
  - API: POST /api/posts returns 201
  - DB: New Post record with authorId
- **Verification Method**: snapshot / network

### E2E-005: Edit own post
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in, own post exists
- **User Journey**:
  1. Navigate to own post detail
  2. Click edit
  3. Modify title or content
  4. Save
  5. Verify changes reflected
- **Expected Results**:
  - API: PATCH /api/posts/:id returns 200
  - DB: Post record updated
- **Verification Method**: snapshot / network

### E2E-006: Delete own post
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in, own post exists
- **User Journey**:
  1. Navigate to own post
  2. Click delete
  3. Confirm deletion
  4. Verify post removed from list
- **Expected Results**:
  - API: DELETE /api/posts/:id returns 200
  - DB: Post record deleted
- **Verification Method**: snapshot / network

### E2E-007: Cannot edit/delete other user's post
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as user A, viewing user B's post
- **User Journey**:
  1. Navigate to another user's post detail
  2. Verify no edit/delete buttons visible
- **Expected Results**:
  - UI: No edit/delete controls for non-owner
  - API: PATCH /api/posts/:id returns 403 if attempted
- **Verification Method**: snapshot

## Scenario Group 3: Comments

### E2E-008: Add a comment to a post
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in, viewing a post
- **User Journey**:
  1. Navigate to post detail
  2. Type comment in comment form
  3. Submit
  4. Verify comment appears in comments list
- **Expected Results**:
  - API: POST /api/posts/:id/comments returns 201
  - UI: New comment displayed with author name and timestamp
- **Verification Method**: snapshot / network

### E2E-009: Edit own comment
- **Type**: Happy Path
- **Priority**: Low
- **Preconditions**: Logged in, own comment exists on a post
- **User Journey**:
  1. Navigate to post with own comment
  2. Click edit on comment
  3. Modify text
  4. Save
  5. Verify changes
- **Expected Results**:
  - API: PATCH /api/posts/:postId/comments/:commentId returns 200
- **Verification Method**: snapshot / network

### E2E-010: Delete own comment
- **Type**: Happy Path
- **Priority**: Low
- **Preconditions**: Logged in, own comment exists
- **User Journey**:
  1. Navigate to post with own comment
  2. Click delete on comment
  3. Confirm
  4. Verify comment removed
- **Expected Results**:
  - API: DELETE /api/posts/:postId/comments/:commentId returns 200
- **Verification Method**: snapshot / network

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 9 |
| Alternative Path | 0 |
| Edge Case | 0 |
| Error Path | 1 |
| **Total** | **10** |

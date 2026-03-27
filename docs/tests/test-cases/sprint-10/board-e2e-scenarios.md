# Board E2E Test Scenarios — Sprint 10

## Overview
- **Feature**: Bulletin board — post CRUD, comments, category filtering, like/unlike, banner management, pinned posts
- **Related Modules**: Auth (post/comment ownership, JWT), Admin (banner management, delete any post)
- **API Endpoints**: GET /api/posts, GET /api/posts/:id, POST /api/posts, PATCH /api/posts/:id, DELETE /api/posts/:id, GET /api/posts/banner, PUT /api/posts/banner, GET /api/posts/:id/comments, POST /api/posts/:id/comments, PATCH /api/posts/:postId/comments/:commentId, DELETE /api/posts/:postId/comments/:commentId
- **Board Pages**: /dashboard/board, /dashboard/board/create, /dashboard/board/[id], /dashboard/board/[id]/edit
- **Categories**: NOTICE, FREE, QNA, REVIEW
- **DB Tables**: Post, Comment, User
- **Blueprint**: docs/blueprints/007-board/blueprint.md
- **Production Frontend**: https://demo-vibe-production.up.railway.app
- **Production Backend**: https://demo-vibe-backend-production.up.railway.app

### Test Accounts
| Account | Email | Password | Role |
|---------|-------|----------|------|
| Admin | admin@astratech.vn | Admin@123 | SUPER_ADMIN |
| Seller | seller1000@yopmail.com | Seller1000@123 | SELLER |
| Buyer (create fresh) | testbuyer-board-s10-{timestamp}@yopmail.com | TestBuyer@123 | BUYER |

---

## Scenario Group 1: Post Creation

### E2E-001: Create a post in FREE category
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as Buyer or Seller
- **User Journey**:
  1. Navigate to /dashboard/board
  2. Click "Create Post" button
  3. Verify redirect to /dashboard/board/create
  4. Select category: FREE
  5. Fill Title: "Sprint 10 Test Post — Free Board"
  6. Fill Content: "This is a test post for the free board category."
  7. Click "Submit" / "Create" button
  8. Verify redirect to post detail or board list
  9. Verify new post appears with correct title, author, and category
- **Expected Results**:
  - API: POST /api/posts returns 201 with post data
  - DB: New Post record created with category=FREE, authorId matching logged-in user
  - UI: Post visible in board list, category badge shows FREE
- **Verification Method**: snapshot / network

### E2E-002: Create a post in NOTICE category
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as Admin (SUPER_ADMIN)
- **User Journey**:
  1. Log in as admin@astratech.vn
  2. Navigate to /dashboard/board/create
  3. Select category: NOTICE
  4. Fill Title: "Important Notice — Sprint 10"
  5. Fill Content: "This is an official notice posted by admin."
  6. Submit the post
  7. Verify post appears in board list under NOTICE category
- **Expected Results**:
  - API: POST /api/posts returns 201
  - DB: Post record with category=NOTICE
  - UI: Post visible, category badge shows NOTICE
- **Verification Method**: snapshot / network

### E2E-003: Create a post in QNA category
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in
- **User Journey**:
  1. Navigate to /dashboard/board/create
  2. Select category: QNA
  3. Fill Title: "How do I reset my password?"
  4. Fill Content: "I forgot my password and need help resetting it."
  5. Submit
  6. Verify post appears with QNA category
- **Expected Results**:
  - API: POST /api/posts returns 201
  - DB: Post with category=QNA
- **Verification Method**: snapshot / network

### E2E-004: Create a post in REVIEW category
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in
- **User Journey**:
  1. Navigate to /dashboard/board/create
  2. Select category: REVIEW
  3. Fill Title: "Great product quality!"
  4. Fill Content: "I purchased item X and the quality exceeded my expectations."
  5. Submit
  6. Verify post appears with REVIEW category
- **Expected Results**:
  - API: POST /api/posts returns 201
  - DB: Post with category=REVIEW
- **Verification Method**: snapshot / network

### E2E-005: Create post without title (validation error)
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in, on create post page
- **User Journey**:
  1. Navigate to /dashboard/board/create
  2. Leave Title empty
  3. Fill Content: "Some content"
  4. Select category: FREE
  5. Click Submit
- **Expected Results**:
  - UI: Validation error displayed for required title field
  - API: No request sent (client-side validation) or POST /api/posts returns 400
  - DB: No new Post record
- **Verification Method**: snapshot / console

### E2E-006: Create post without content (validation error)
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Logged in, on create post page
- **User Journey**:
  1. Navigate to /dashboard/board/create
  2. Fill Title: "Title Only Post"
  3. Leave Content empty
  4. Select category: FREE
  5. Click Submit
- **Expected Results**:
  - UI: Validation error displayed for required content field
  - API: No request sent or POST /api/posts returns 400
- **Verification Method**: snapshot / console

### E2E-007: Create post as unauthenticated user (denied)
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Not logged in
- **User Journey**:
  1. Navigate to /dashboard/board/create directly via URL
  2. Verify redirect to login page or access denied message
- **Expected Results**:
  - UI: Redirected to /auth/login or access denied
  - API: POST /api/posts without token returns 401
- **Verification Method**: snapshot / network

---

## Scenario Group 2: Post Reading and Detail

### E2E-008: View board post list (public access)
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Posts exist in DB
- **User Journey**:
  1. Navigate to /dashboard/board (no login required)
  2. Verify post list renders with title, author, date, category badge
  3. Verify pagination controls are visible
  4. Verify view count displayed for each post
- **Expected Results**:
  - API: GET /api/posts returns 200 with paginated data
  - UI: Post cards with metadata (title, author, date, category, viewCount)
- **Verification Method**: snapshot / network

### E2E-009: View post detail with comments
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Post exists with at least one comment
- **User Journey**:
  1. Navigate to /dashboard/board
  2. Click on a post title/card
  3. Verify redirect to /dashboard/board/[id]
  4. Verify post content: title, body, author name, created date, category, view count
  5. Verify comments section loads below post
  6. Verify like button is visible
- **Expected Results**:
  - API: GET /api/posts/:id returns 200, GET /api/posts/:id/comments returns 200
  - UI: Full post content rendered, comments list visible
  - DB: viewCount incremented by 1
- **Verification Method**: snapshot / network

### E2E-010: View count increments on post detail visit
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Post exists with known viewCount
- **User Journey**:
  1. Note current viewCount of a post from the list
  2. Click into post detail
  3. Go back to list
  4. Verify viewCount increased by 1
- **Expected Results**:
  - API: GET /api/posts/:id triggers view count increment
  - UI: Updated view count reflected
- **Verification Method**: network

### E2E-011: View non-existent post (404)
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: None
- **User Journey**:
  1. Navigate to /dashboard/board/non-existent-id-12345
  2. Verify 404 or "Post not found" message
- **Expected Results**:
  - API: GET /api/posts/:id returns 404
  - UI: Error page or "Post not found" message displayed
- **Verification Method**: snapshot / network

---

## Scenario Group 3: Post Update

### E2E-012: Edit own post
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in, own post exists
- **User Journey**:
  1. Navigate to own post detail /dashboard/board/[id]
  2. Verify Edit button is visible
  3. Click Edit button
  4. Verify redirect to /dashboard/board/[id]/edit
  5. Modify Title: append " (Edited)"
  6. Modify Content: append " — Updated content."
  7. Click Save/Update
  8. Verify redirect to post detail with updated content
- **Expected Results**:
  - API: PATCH /api/posts/:id returns 200
  - DB: Post record updated with new title and content
  - UI: Updated title and content displayed on detail page
- **Verification Method**: snapshot / network

### E2E-013: Edit post — change category
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in, own post exists with category=FREE
- **User Journey**:
  1. Navigate to own post edit page
  2. Change category from FREE to QNA
  3. Save
  4. Verify category badge updated on detail page
- **Expected Results**:
  - API: PATCH /api/posts/:id returns 200 with updated category
  - DB: Post category field updated to QNA
- **Verification Method**: snapshot / network

### E2E-014: Cannot edit another user's post (no edit button)
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as User A, viewing User B's post
- **User Journey**:
  1. Navigate to a post created by another user
  2. Verify Edit button is NOT visible
  3. Attempt direct URL access to /dashboard/board/[other-user-post-id]/edit
  4. Verify access denied or redirect
- **Expected Results**:
  - UI: No edit button on non-owned post; direct URL access blocked
  - API: PATCH /api/posts/:id with non-owner token returns 403
- **Verification Method**: snapshot / network

### E2E-015: Edit post as unauthenticated user (denied)
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Not logged in
- **User Journey**:
  1. Navigate directly to /dashboard/board/[id]/edit
  2. Verify redirect to login page
- **Expected Results**:
  - UI: Redirect to /auth/login
  - API: PATCH /api/posts/:id without token returns 401
- **Verification Method**: snapshot / network

---

## Scenario Group 4: Post Deletion

### E2E-016: Delete own post
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in, own post exists
- **User Journey**:
  1. Navigate to own post detail
  2. Click Delete button
  3. Confirm deletion in confirmation dialog
  4. Verify redirect to board list
  5. Verify post no longer appears in list
- **Expected Results**:
  - API: DELETE /api/posts/:id returns 200
  - DB: Post record deleted (or soft-deleted)
  - UI: Post removed from list
- **Verification Method**: snapshot / network

### E2E-017: Admin deletes another user's post
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as Admin (SUPER_ADMIN), another user's post exists
- **User Journey**:
  1. Log in as admin@astratech.vn
  2. Navigate to a post created by a non-admin user
  3. Verify Delete button is visible (admin privilege)
  4. Click Delete and confirm
  5. Verify post removed from list
- **Expected Results**:
  - API: DELETE /api/posts/:id returns 200 (admin override)
  - DB: Post record deleted
  - UI: Post no longer in list
- **Verification Method**: snapshot / network

### E2E-018: Cannot delete another user's post (non-admin)
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as regular user (Buyer/Seller), viewing another user's post
- **User Journey**:
  1. Navigate to a post created by another user
  2. Verify Delete button is NOT visible
- **Expected Results**:
  - UI: No delete button on non-owned post for non-admin
  - API: DELETE /api/posts/:id with non-owner non-admin token returns 403
- **Verification Method**: snapshot / network

### E2E-019: Cancel post deletion (dismiss confirmation)
- **Type**: Alternative Path
- **Priority**: Low
- **Preconditions**: Logged in, own post exists
- **User Journey**:
  1. Navigate to own post detail
  2. Click Delete button
  3. Cancel/dismiss the confirmation dialog
  4. Verify post still exists and detail page unchanged
- **Expected Results**:
  - API: No DELETE request sent
  - UI: Post remains visible, no changes
- **Verification Method**: snapshot

---

## Scenario Group 5: Comment CRUD

### E2E-020: Add a comment to a post
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in, viewing a post
- **User Journey**:
  1. Navigate to post detail /dashboard/board/[id]
  2. Scroll to comment section
  3. Type comment: "This is a test comment from Sprint 10."
  4. Click Submit/Post comment button
  5. Verify comment appears in comments list with author name and timestamp
- **Expected Results**:
  - API: POST /api/posts/:id/comments returns 201
  - DB: New Comment record with postId, authorId, content
  - UI: Comment displayed immediately in comments list
- **Verification Method**: snapshot / network

### E2E-021: Edit own comment
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in, own comment exists on a post
- **User Journey**:
  1. Navigate to post with own comment
  2. Click edit icon/button on own comment
  3. Modify text to: "Updated comment content — Sprint 10."
  4. Click Save
  5. Verify updated text displayed
- **Expected Results**:
  - API: PATCH /api/posts/:postId/comments/:commentId returns 200
  - DB: Comment content updated
  - UI: Updated comment text visible
- **Verification Method**: snapshot / network

### E2E-022: Delete own comment
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in, own comment exists on a post
- **User Journey**:
  1. Navigate to post with own comment
  2. Click delete icon/button on own comment
  3. Confirm deletion
  4. Verify comment removed from list
- **Expected Results**:
  - API: DELETE /api/posts/:postId/comments/:commentId returns 200
  - DB: Comment record deleted
  - UI: Comment no longer visible in list
- **Verification Method**: snapshot / network

### E2E-023: Cannot edit another user's comment
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as User A, viewing User B's comment
- **User Journey**:
  1. Navigate to post with another user's comment
  2. Verify no edit icon/button on that comment
- **Expected Results**:
  - UI: No edit controls on non-owned comments
  - API: PATCH /api/posts/:postId/comments/:commentId with non-owner token returns 403
- **Verification Method**: snapshot

### E2E-024: Cannot delete another user's comment (non-admin)
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as non-admin, viewing another user's comment
- **User Journey**:
  1. Navigate to post with another user's comment
  2. Verify no delete icon/button on that comment
- **Expected Results**:
  - UI: No delete controls on non-owned comments for non-admin
  - API: DELETE /api/posts/:postId/comments/:commentId returns 403
- **Verification Method**: snapshot

### E2E-025: Add comment as unauthenticated user (denied)
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Not logged in, viewing a post
- **User Journey**:
  1. Navigate to post detail without logging in
  2. Verify comment input is disabled or hidden, or login prompt shown
- **Expected Results**:
  - UI: Comment form not available or prompts login
  - API: POST /api/posts/:id/comments without token returns 401
- **Verification Method**: snapshot / network

### E2E-026: Submit empty comment (validation error)
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Logged in, viewing a post
- **User Journey**:
  1. Navigate to post detail
  2. Leave comment field empty
  3. Click Submit
- **Expected Results**:
  - UI: Validation error or disabled submit button
  - API: No request sent or POST returns 400
- **Verification Method**: snapshot / console

---

## Scenario Group 6: Category Filtering

### E2E-027: Filter posts by NOTICE category
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Posts exist across multiple categories
- **User Journey**:
  1. Navigate to /dashboard/board
  2. Click NOTICE category tab/filter
  3. Verify only NOTICE posts are displayed
  4. Verify post count matches NOTICE category
- **Expected Results**:
  - API: GET /api/posts?category=NOTICE returns 200
  - UI: Only NOTICE-category posts shown, other categories hidden
- **Verification Method**: snapshot / network

### E2E-028: Filter posts by FREE category
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Posts exist in FREE category
- **User Journey**:
  1. Navigate to /dashboard/board
  2. Click FREE category tab/filter
  3. Verify only FREE posts are displayed
- **Expected Results**:
  - API: GET /api/posts?category=FREE returns 200
  - UI: Only FREE-category posts listed
- **Verification Method**: snapshot / network

### E2E-029: Filter posts by QNA category
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Posts exist in QNA category
- **User Journey**:
  1. Navigate to /dashboard/board
  2. Click QNA category tab/filter
  3. Verify only QNA posts displayed
- **Expected Results**:
  - API: GET /api/posts?category=QNA returns 200
  - UI: Only QNA posts listed
- **Verification Method**: snapshot / network

### E2E-030: Filter posts by REVIEW category
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Posts exist in REVIEW category
- **User Journey**:
  1. Click REVIEW category tab/filter
  2. Verify only REVIEW posts displayed
- **Expected Results**:
  - API: GET /api/posts?category=REVIEW returns 200
  - UI: Only REVIEW posts listed
- **Verification Method**: snapshot / network

### E2E-031: Show all categories (reset filter)
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Category filter is active
- **User Journey**:
  1. With a category filter active (e.g., NOTICE)
  2. Click "All" / reset filter
  3. Verify all posts from all categories are shown
- **Expected Results**:
  - API: GET /api/posts (no category param) returns 200
  - UI: Posts from all categories visible
- **Verification Method**: snapshot / network

---

## Scenario Group 7: Post Liking

### E2E-032: Like a post
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in, viewing a post not yet liked by current user
- **User Journey**:
  1. Navigate to post detail
  2. Note current like count
  3. Click Like button/icon
  4. Verify like count incremented by 1
  5. Verify Like button state changes (filled/highlighted)
- **Expected Results**:
  - API: Like endpoint returns 200/201
  - DB: Like record created for user+post
  - UI: Like count +1, button shows liked state
- **Verification Method**: snapshot / network

### E2E-033: Unlike a previously liked post
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in, post already liked by current user
- **User Journey**:
  1. Navigate to a post the current user has already liked
  2. Verify Like button shows liked state
  3. Click Like button again (toggle)
  4. Verify like count decremented by 1
  5. Verify Like button returns to unliked state
- **Expected Results**:
  - API: Unlike endpoint returns 200
  - DB: Like record removed for user+post
  - UI: Like count -1, button shows unliked state
- **Verification Method**: snapshot / network

### E2E-034: Like post as unauthenticated user (denied)
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Not logged in, viewing a post
- **User Journey**:
  1. Navigate to post detail without logging in
  2. Click Like button
  3. Verify login prompt or error
- **Expected Results**:
  - UI: Redirected to login or error message shown
  - API: Like request without token returns 401
- **Verification Method**: snapshot / network

---

## Scenario Group 8: Banner Management (Admin)

### E2E-035: View banner on board page
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Banner has been configured
- **User Journey**:
  1. Navigate to /dashboard/board
  2. Verify banner area displays at the top of the page
  3. Verify banner content (image or text) renders correctly
- **Expected Results**:
  - API: GET /api/posts/banner returns 200 with banner data
  - UI: Banner visible at top of board page
- **Verification Method**: snapshot / network

### E2E-036: Admin updates banner
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as Admin (SUPER_ADMIN)
- **User Journey**:
  1. Log in as admin@astratech.vn
  2. Navigate to banner management (admin panel or board settings)
  3. Update banner content (title, description, or image URL)
  4. Save changes
  5. Navigate to /dashboard/board
  6. Verify updated banner content displayed
- **Expected Results**:
  - API: PUT /api/posts/banner returns 200
  - DB: Banner record updated
  - UI: New banner content visible on board page
- **Verification Method**: snapshot / network

### E2E-037: Non-admin cannot update banner
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as regular user (Buyer/Seller)
- **User Journey**:
  1. Log in as seller1000@yopmail.com
  2. Verify no banner management UI available
  3. Attempt API call: PUT /api/posts/banner with non-admin token
- **Expected Results**:
  - UI: No banner edit controls visible for non-admin
  - API: PUT /api/posts/banner returns 403
- **Verification Method**: snapshot / network

### E2E-038: View banner when none configured
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: No banner data in DB
- **User Journey**:
  1. Navigate to /dashboard/board
  2. Verify banner area either hidden or shows default/placeholder
- **Expected Results**:
  - API: GET /api/posts/banner returns 200 with empty/null data or 404
  - UI: No broken layout, graceful handling
- **Verification Method**: snapshot / network

---

## Scenario Group 9: Pagination and Sorting

### E2E-039: Paginate through post list
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: More posts than one page (e.g., 15+ posts with page size 10)
- **User Journey**:
  1. Navigate to /dashboard/board
  2. Verify first page of posts loads (e.g., 10 posts)
  3. Click "Next" or page 2
  4. Verify second page loads with different posts
  5. Click "Previous" or page 1
  6. Verify first page posts return
- **Expected Results**:
  - API: GET /api/posts?page=1 and GET /api/posts?page=2 return different post sets
  - UI: Pagination controls update, post list changes per page
- **Verification Method**: snapshot / network

### E2E-040: First page is default on board load
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Posts exist
- **User Journey**:
  1. Navigate to /dashboard/board
  2. Verify page 1 is active/highlighted in pagination
  3. Verify latest posts appear first (default sort by newest)
- **Expected Results**:
  - API: GET /api/posts returns page 1 data, sorted by createdAt descending
  - UI: Page 1 active, newest posts at top
- **Verification Method**: snapshot / network

### E2E-041: Pagination with category filter active
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Enough filtered posts to span multiple pages
- **User Journey**:
  1. Navigate to /dashboard/board
  2. Select NOTICE category filter
  3. Navigate to page 2
  4. Verify posts on page 2 are still NOTICE category only
- **Expected Results**:
  - API: GET /api/posts?category=NOTICE&page=2 returns 200
  - UI: Only NOTICE posts shown on page 2
- **Verification Method**: snapshot / network

### E2E-042: Navigate to out-of-range page
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Limited posts (e.g., 5 posts, page size 10)
- **User Journey**:
  1. Manually navigate to /dashboard/board?page=999
  2. Verify graceful handling (empty list or redirect to last valid page)
- **Expected Results**:
  - API: GET /api/posts?page=999 returns 200 with empty data array
  - UI: Empty state message or redirect to page 1
- **Verification Method**: snapshot / network

---

## Scenario Group 10: Pinned Posts

### E2E-043: Pinned posts appear at top of list
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: At least one pinned post exists
- **User Journey**:
  1. Navigate to /dashboard/board
  2. Verify pinned posts appear at the top of the list
  3. Verify pinned posts have a visual indicator (pin icon or badge)
  4. Verify regular posts appear below pinned posts
- **Expected Results**:
  - API: GET /api/posts returns pinned posts first
  - UI: Pinned posts visually distinguished and positioned at top
- **Verification Method**: snapshot / network

### E2E-044: Pinned posts persist across pages
- **Type**: Happy Path
- **Priority**: Low
- **Preconditions**: Pinned post exists, multiple pages of posts
- **User Journey**:
  1. Navigate to /dashboard/board page 1
  2. Verify pinned post at top
  3. Navigate to page 2
  4. Verify pinned post still visible at top (or only on page 1 per design)
- **Expected Results**:
  - UI: Pinned post behavior consistent with design (top of page 1 or all pages)
- **Verification Method**: snapshot

---

## Scenario Group 11: Edge Cases

### E2E-045: View empty board (no posts)
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: No posts in DB (or filtered category has no posts)
- **User Journey**:
  1. Navigate to /dashboard/board
  2. Apply a category filter with no posts (or use clean DB)
  3. Verify empty state message displayed
- **Expected Results**:
  - API: GET /api/posts returns 200 with empty data array
  - UI: "No posts yet" or similar empty state message, no broken layout
- **Verification Method**: snapshot / network

### E2E-046: Create post with very long title
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Logged in
- **User Journey**:
  1. Navigate to /dashboard/board/create
  2. Enter title with 500+ characters
  3. Fill content normally
  4. Submit
  5. Verify behavior: truncation, validation error, or successful save
- **Expected Results**:
  - UI: Either validation error for max length, or title truncated/wrapped properly
  - API: POST /api/posts returns 400 (if max length enforced) or 201
- **Verification Method**: snapshot / network

### E2E-047: Create post with very long content
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Logged in
- **User Journey**:
  1. Navigate to /dashboard/board/create
  2. Fill title normally
  3. Enter content with 10,000+ characters
  4. Submit
  5. Verify post created and content renders correctly on detail page
- **Expected Results**:
  - API: POST /api/posts returns 201
  - UI: Long content renders without breaking layout, scrollable
- **Verification Method**: snapshot / network

### E2E-048: Create post with special characters in title
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Logged in
- **User Journey**:
  1. Navigate to /dashboard/board/create
  2. Enter title: `<script>alert('xss')</script> & "quotes" & Korean`
  3. Fill content normally
  4. Submit
  5. Verify title is properly escaped/sanitized on detail page
- **Expected Results**:
  - API: POST /api/posts returns 201
  - UI: Title displayed as text (not executed as HTML/JS), properly escaped
  - Security: No XSS vulnerability
- **Verification Method**: snapshot / console

### E2E-049: Rapid double-click on submit (duplicate prevention)
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Logged in, on create post page with form filled
- **User Journey**:
  1. Fill in post creation form
  2. Rapidly double-click the Submit button
  3. Verify only one post is created
- **Expected Results**:
  - API: Only one POST /api/posts request processed
  - DB: Single Post record created (not duplicated)
  - UI: Button disabled after first click or duplicate request prevented
- **Verification Method**: network

### E2E-050: Multiple comments on the same post
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Logged in, viewing a post
- **User Journey**:
  1. Navigate to post detail
  2. Add comment: "First comment"
  3. Verify first comment appears
  4. Add comment: "Second comment"
  5. Verify second comment appears below/above first
  6. Verify comment count updates correctly
- **Expected Results**:
  - API: Two POST /api/posts/:id/comments calls, both return 201
  - DB: Two Comment records created
  - UI: Both comments visible in correct order
- **Verification Method**: snapshot / network

---

## Summary

| ID | Scenario | Type | Priority | Group |
|----|----------|------|----------|-------|
| E2E-001 | Create post in FREE category | Happy Path | Critical | Post Creation |
| E2E-002 | Create post in NOTICE category | Happy Path | High | Post Creation |
| E2E-003 | Create post in QNA category | Happy Path | Medium | Post Creation |
| E2E-004 | Create post in REVIEW category | Happy Path | Medium | Post Creation |
| E2E-005 | Create post without title | Error Path | High | Post Creation |
| E2E-006 | Create post without content | Error Path | Medium | Post Creation |
| E2E-007 | Create post unauthenticated | Error Path | High | Post Creation |
| E2E-008 | View board post list | Happy Path | Critical | Post Reading |
| E2E-009 | View post detail with comments | Happy Path | Critical | Post Reading |
| E2E-010 | View count increments | Happy Path | Medium | Post Reading |
| E2E-011 | View non-existent post | Error Path | Medium | Post Reading |
| E2E-012 | Edit own post | Happy Path | Critical | Post Update |
| E2E-013 | Edit post change category | Happy Path | Medium | Post Update |
| E2E-014 | Cannot edit another user's post | Error Path | High | Post Update |
| E2E-015 | Edit post unauthenticated | Error Path | Medium | Post Update |
| E2E-016 | Delete own post | Happy Path | High | Post Deletion |
| E2E-017 | Admin deletes another user's post | Happy Path | High | Post Deletion |
| E2E-018 | Cannot delete another user's post | Error Path | High | Post Deletion |
| E2E-019 | Cancel post deletion | Alternative Path | Low | Post Deletion |
| E2E-020 | Add comment to post | Happy Path | Critical | Comments |
| E2E-021 | Edit own comment | Happy Path | Medium | Comments |
| E2E-022 | Delete own comment | Happy Path | Medium | Comments |
| E2E-023 | Cannot edit another user's comment | Error Path | High | Comments |
| E2E-024 | Cannot delete another user's comment | Error Path | High | Comments |
| E2E-025 | Add comment unauthenticated | Error Path | Medium | Comments |
| E2E-026 | Submit empty comment | Error Path | Medium | Comments |
| E2E-027 | Filter by NOTICE category | Happy Path | High | Category Filtering |
| E2E-028 | Filter by FREE category | Happy Path | High | Category Filtering |
| E2E-029 | Filter by QNA category | Happy Path | Medium | Category Filtering |
| E2E-030 | Filter by REVIEW category | Happy Path | Medium | Category Filtering |
| E2E-031 | Show all categories | Happy Path | Medium | Category Filtering |
| E2E-032 | Like a post | Happy Path | High | Post Liking |
| E2E-033 | Unlike a post | Happy Path | High | Post Liking |
| E2E-034 | Like post unauthenticated | Error Path | Medium | Post Liking |
| E2E-035 | View banner | Happy Path | Medium | Banner Management |
| E2E-036 | Admin updates banner | Happy Path | High | Banner Management |
| E2E-037 | Non-admin cannot update banner | Error Path | High | Banner Management |
| E2E-038 | View banner when none configured | Edge Case | Low | Banner Management |
| E2E-039 | Paginate through post list | Happy Path | High | Pagination |
| E2E-040 | First page default on load | Happy Path | Medium | Pagination |
| E2E-041 | Pagination with category filter | Happy Path | Medium | Pagination |
| E2E-042 | Navigate to out-of-range page | Edge Case | Low | Pagination |
| E2E-043 | Pinned posts at top | Happy Path | Medium | Pinned Posts |
| E2E-044 | Pinned posts across pages | Happy Path | Low | Pinned Posts |
| E2E-045 | Empty board state | Edge Case | Medium | Edge Cases |
| E2E-046 | Very long title | Edge Case | Low | Edge Cases |
| E2E-047 | Very long content | Edge Case | Low | Edge Cases |
| E2E-048 | Special characters / XSS in title | Edge Case | Low | Edge Cases |
| E2E-049 | Rapid double-click submit | Edge Case | Low | Edge Cases |
| E2E-050 | Multiple comments on same post | Edge Case | Low | Edge Cases |

### Statistics
| Type | Count |
|------|-------|
| Happy Path | 27 |
| Alternative Path | 1 |
| Error Path | 16 |
| Edge Case | 6 |
| **Total** | **50** |

### Priority Distribution
| Priority | Count |
|----------|-------|
| Critical | 6 |
| High | 18 |
| Medium | 17 |
| Low | 9 |

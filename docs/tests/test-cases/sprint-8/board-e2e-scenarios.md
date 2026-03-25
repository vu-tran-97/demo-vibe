# Board E2E Test Scenarios (Sprint 8)

## Overview
- **Feature**: Community bulletin board — post CRUD (categories, pinned, view/like count), nested comments (1-level), banner management, search & sort
- **Related Modules**: Board, Auth, Admin
- **API Endpoints**: `GET/POST /api/posts`, `GET/PATCH/DELETE /api/posts/:id`, `GET/POST /api/posts/:id/comments`, `PATCH/DELETE /api/posts/:postId/comments/:commentId`, `GET/PUT /api/posts/banner`
- **Frontend Pages**: `/dashboard/board`, `/dashboard/board/[id]`, `/dashboard/board/create`, `/dashboard/board/[id]/edit`
- **DB Tables**: BoardPost, BoardComment, BoardBanner (Prisma models)
- **Blueprint**: docs/blueprints/007-board/

---

## Scenario Group 1: Post CRUD Lifecycle

### E2E-001: Create a FREE category post
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as authenticated user (BUYER or SELLER role)
- **User Journey**:
  1. Navigate to `/dashboard/board`
  2. Click "Create Post" button
  3. Redirected to `/dashboard/board/create`
  4. Select category "FREE"
  5. Fill title: "Sprint 8 Test Post", content: "This is a test post for E2E validation"
  6. Optionally add tags: ["test", "sprint8"]
  7. Click "Submit"
  8. Verify redirect to post detail or post list
  9. Verify new post appears at the top of the list
- **Expected Results**:
  - UI: Post creation form submits successfully, toast/confirmation shown, post visible in list
  - API: `POST /api/posts` returns 201 with post object including `category: "FREE"`, `viewCount: 0`, `likeCount: 0`, `commentCount: 0`, `pinned: false`
  - DB: BoardPost record created with `postCtgrCd: 'FREE'`, `inqrCnt: 0`, `likeCnt: 0`, `cmntCnt: 0`, `pnndYn: 'N'`, `delYn: 'N'`
  - Server Log: `User {userId} created post {postId}`
- **Verification Method**: snapshot / network / db-query
- **Test Data**: `{ postTtl: "Sprint 8 Test Post", postCn: "This is a test post for E2E validation", postCtgrCd: "FREE", srchTags: ["test", "sprint8"] }`

### E2E-002: Create posts in each category (QNA, REVIEW)
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as authenticated user
- **User Journey**:
  1. Navigate to `/dashboard/board/create`
  2. Select category "QNA", fill title and content, submit
  3. Verify post created with category QNA
  4. Repeat for "REVIEW" category
- **Expected Results**:
  - UI: Both posts created and visible in respective category tabs
  - API: `POST /api/posts` returns 201 with correct `category` value for each
  - DB: Records with `postCtgrCd: 'QNA'` and `postCtgrCd: 'REVIEW'` respectively
- **Verification Method**: network / db-query
- **Test Data**: `{ postTtl: "QNA Test", postCn: "Question content", postCtgrCd: "QNA" }`, `{ postTtl: "Review Test", postCn: "Review content", postCtgrCd: "REVIEW" }`

### E2E-003: View post detail with view count increment
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: At least one post exists in the board
- **User Journey**:
  1. Navigate to `/dashboard/board`
  2. Note the view count of the first post (e.g., N)
  3. Click on the post title to navigate to `/dashboard/board/[id]`
  4. Verify post detail page renders: title, content, author name, category badge, date, view count, like count, comment count
  5. Note that view count is now N+1
  6. Refresh the page
  7. Verify view count increments to N+2
- **Expected Results**:
  - UI: Post detail page displays all fields correctly, view count reflects increment
  - API: `GET /api/posts/:id` returns post with `viewCount` incremented by 1 per request
  - DB: `inqrCnt` atomically incremented on each GET request
- **Verification Method**: snapshot / network
- **Test Data**: Any existing post ID

### E2E-004: Edit own post (title and content)
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as the post author
- **User Journey**:
  1. Navigate to `/dashboard/board/[id]` for own post
  2. Click "Edit" button
  3. Redirected to `/dashboard/board/[id]/edit`
  4. Change title to "Updated Title" and content to "Updated content"
  5. Click "Save"
  6. Verify redirect to post detail with updated values
- **Expected Results**:
  - UI: Edit form pre-populated with current values, updated values reflected after save
  - API: `PATCH /api/posts/:id` returns 200 with updated post
  - DB: `postTtl` and `postCn` updated, `mdfrId` set to current user, `mdfcnDt` updated
  - Server Log: `User {userId} updated post {postId}`
- **Verification Method**: network / db-query
- **Test Data**: `{ postTtl: "Updated Title", postCn: "Updated content" }`

### E2E-005: Edit post category
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as post author, post category is FREE
- **User Journey**:
  1. Navigate to edit page for own post
  2. Change category from "FREE" to "QNA"
  3. Save
  4. Verify post now shows QNA category
- **Expected Results**:
  - API: `PATCH /api/posts/:id` with `{ postCtgrCd: "QNA" }` returns 200
  - DB: `postCtgrCd` updated to 'QNA'
- **Verification Method**: network
- **Test Data**: `{ postCtgrCd: "QNA" }`

### E2E-006: Delete own post (soft delete)
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as post author
- **User Journey**:
  1. Navigate to `/dashboard/board/[id]` for own post
  2. Click "Delete" button
  3. Confirm deletion in dialog
  4. Verify redirect to post list
  5. Verify deleted post no longer appears in the list
- **Expected Results**:
  - UI: Confirmation dialog appears, post removed from list after deletion
  - API: `DELETE /api/posts/:id` returns `{ id, deleted: true }`
  - DB: `delYn` set to 'Y', `mdfrId` updated to current user (soft delete, record preserved)
  - Server Log: `User {userId} soft-deleted post {postId}`
- **Verification Method**: network / db-query
- **Test Data**: Own post ID

### E2E-007: Create NOTICE post as SUPER_ADMIN
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN
- **User Journey**:
  1. Navigate to `/dashboard/board/create`
  2. Select category "NOTICE"
  3. Fill title: "Important Announcement", content: "Admin notice content"
  4. Submit
  5. Verify NOTICE post appears at the top (pinned ordering)
- **Expected Results**:
  - UI: NOTICE post created, displayed with NOTICE badge
  - API: `POST /api/posts` returns 201 with `category: "NOTICE"`
  - DB: `postCtgrCd: 'NOTICE'` record created
- **Verification Method**: network / db-query
- **Test Data**: `{ postTtl: "Important Announcement", postCn: "Admin notice content", postCtgrCd: "NOTICE" }`

---

## Scenario Group 2: Comment Management

### E2E-008: Add a comment to a post
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Post exists, user logged in
- **User Journey**:
  1. Navigate to `/dashboard/board/[id]`
  2. Scroll to comment section
  3. Type comment: "Great post, very helpful!"
  4. Click "Submit" / press Enter
  5. Verify comment appears below the post with author name and timestamp
  6. Verify post's comment count incremented by 1
- **Expected Results**:
  - UI: Comment rendered with author info, timestamp; comment count badge updated
  - API: `POST /api/posts/:id/comments` returns 201 with comment object (`depth: 0`, `parentCommentId: null`)
  - DB: BoardComment created with `cmntDpth: 0`, `prntCmntId: null`; BoardPost `cmntCnt` incremented by 1
  - Server Log: `User {userId} added comment {commentId} on post {postId}`
- **Verification Method**: snapshot / network / db-query
- **Test Data**: `{ cmntCn: "Great post, very helpful!" }`

### E2E-009: Add a nested reply (depth 1)
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Post exists with at least one root comment
- **User Journey**:
  1. Navigate to post detail
  2. Find an existing root comment
  3. Click "Reply" on that comment
  4. Type reply: "Thanks for the feedback!"
  5. Submit
  6. Verify reply appears indented under parent comment
  7. Verify post's comment count incremented
- **Expected Results**:
  - UI: Reply visually nested under parent comment
  - API: `POST /api/posts/:id/comments` with `prntCmntId` set returns 201 with `depth: 1`, `parentCommentId: {parentId}`
  - DB: BoardComment with `cmntDpth: 1`, `prntCmntId` referencing parent; post `cmntCnt` incremented
- **Verification Method**: network / db-query
- **Test Data**: `{ cmntCn: "Thanks for the feedback!", prntCmntId: {parentCommentId} }`

### E2E-010: Attempt nested reply beyond depth 1 (rejected)
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Post with a depth-1 reply comment exists
- **User Journey**:
  1. Attempt to create a comment with `prntCmntId` pointing to a depth-1 comment
  2. Verify the request is rejected
- **Expected Results**:
  - UI: Error message displayed (if UI allows the action)
  - API: `POST /api/posts/:id/comments` returns 400 with error code `MAX_DEPTH_EXCEEDED` and message "Reply depth cannot exceed 1 level"
  - DB: No new comment record created
- **Verification Method**: network
- **Test Data**: `{ cmntCn: "Attempt deep nest", prntCmntId: {depth1CommentId} }`

### E2E-011: Edit own comment
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: User has posted a comment
- **User Journey**:
  1. Navigate to post detail
  2. Find own comment
  3. Click "Edit" button on comment
  4. Change text to "Updated comment content"
  5. Save
  6. Verify updated text displayed
- **Expected Results**:
  - UI: Comment text updated in-place
  - API: `PATCH /api/posts/:postId/comments/:commentId` returns 200 with updated comment
  - DB: `cmntCn` updated, `mdfrId` set to current user
  - Server Log: `User {userId} updated comment {commentId}`
- **Verification Method**: network
- **Test Data**: `{ cmntCn: "Updated comment content" }`

### E2E-012: Delete own comment (soft delete)
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: User has posted a comment on a post
- **User Journey**:
  1. Navigate to post detail
  2. Find own comment
  3. Click "Delete" button
  4. Confirm deletion
  5. Verify comment removed from display
  6. Verify post's comment count decremented by 1
- **Expected Results**:
  - UI: Comment removed from the comment list
  - API: `DELETE /api/posts/:postId/comments/:commentId` returns `{ id, deleted: true }`
  - DB: BoardComment `delYn` set to 'Y'; BoardPost `cmntCnt` decremented by 1
  - Server Log: `User {userId} soft-deleted comment {commentId}`
- **Verification Method**: network / db-query
- **Test Data**: Own comment ID on a known post

### E2E-013: Retrieve comments list for a post
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Post with multiple comments (root + replies) exists
- **User Journey**:
  1. Navigate to `/dashboard/board/[id]`
  2. Verify comment list loads below the post
  3. Verify comments ordered by creation date (ascending)
  4. Verify replies show correct parent linkage
- **Expected Results**:
  - UI: Comments rendered in chronological order, replies visually nested
  - API: `GET /api/posts/:id/comments` returns array of comments with `depth`, `parentCommentId`, `author` fields
  - DB: Only comments with `delYn: 'N'` returned
- **Verification Method**: snapshot / network
- **Test Data**: Post ID with at least 3 comments (2 root + 1 reply)

---

## Scenario Group 3: Search & Filtering

### E2E-014: Filter posts by category (FREE)
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Posts exist in multiple categories (FREE, QNA, REVIEW, NOTICE)
- **User Journey**:
  1. Navigate to `/dashboard/board`
  2. Click the "FREE" category tab/filter
  3. Verify only FREE posts are displayed
  4. Verify pagination reflects filtered count
- **Expected Results**:
  - UI: Only posts with FREE category badge shown
  - API: `GET /api/posts?category=FREE` returns filtered list
  - DB: Query applies `postCtgrCd: 'FREE'` filter
- **Verification Method**: network
- **Test Data**: Posts in at least 3 categories

### E2E-015: Filter posts by category (QNA)
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Posts exist in QNA category
- **User Journey**:
  1. Navigate to `/dashboard/board`
  2. Click the "QNA" tab
  3. Verify only QNA posts displayed
- **Expected Results**:
  - API: `GET /api/posts?category=QNA` returns only QNA posts
- **Verification Method**: network
- **Test Data**: At least 1 QNA post

### E2E-016: Search posts by keyword (title match)
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Posts with distinct, searchable titles exist
- **User Journey**:
  1. Navigate to `/dashboard/board`
  2. Enter "Sprint 8" in search input
  3. Press Enter or click search
  4. Verify results contain only posts with "Sprint 8" in title or content
- **Expected Results**:
  - UI: Filtered results displayed, search term highlighted or indicated
  - API: `GET /api/posts?search=Sprint%208` returns matching posts (case-insensitive search on `postTtl` and `postCn`)
  - DB: Query uses `contains` with `mode: 'insensitive'` on both title and content fields via OR condition
- **Verification Method**: network
- **Test Data**: Search keyword: "Sprint 8"

### E2E-017: Search posts by keyword (content match)
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Post exists with keyword only in content, not in title
- **User Journey**:
  1. Navigate to `/dashboard/board`
  2. Search for a keyword that appears only in a post's content
  3. Verify that post appears in results
- **Expected Results**:
  - API: `GET /api/posts?search={keyword}` returns post where content matches
- **Verification Method**: network
- **Test Data**: Post with title "General Post" and content containing "UniqueContentKeyword123"; search: "UniqueContentKeyword123"

### E2E-018: Sort posts by newest (default)
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Multiple posts exist with different creation dates
- **User Journey**:
  1. Navigate to `/dashboard/board`
  2. Verify default sort is newest first
  3. Verify pinned posts appear before non-pinned regardless of date
- **Expected Results**:
  - API: `GET /api/posts` (no sort param or `sort=newest`) returns posts ordered by `pnndYn DESC, rgstDt DESC`
  - UI: Most recent posts at top, pinned posts always first
- **Verification Method**: network
- **Test Data**: 5+ posts with varying dates, at least 1 pinned

### E2E-019: Sort posts by view count
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Multiple posts with different view counts
- **User Journey**:
  1. Navigate to `/dashboard/board`
  2. Select "Most Viewed" sort option
  3. Verify posts ordered by view count descending
- **Expected Results**:
  - API: `GET /api/posts?sort=views` returns posts ordered by `pnndYn DESC, inqrCnt DESC, rgstDt DESC`
- **Verification Method**: network
- **Test Data**: Posts with varied `inqrCnt` values

### E2E-020: Sort posts by comment count
- **Type**: Happy Path
- **Priority**: Low
- **Preconditions**: Multiple posts with different comment counts
- **User Journey**:
  1. Navigate to `/dashboard/board`
  2. Select "Most Comments" sort option
  3. Verify posts ordered by comment count descending
- **Expected Results**:
  - API: `GET /api/posts?sort=comments` returns posts ordered by `pnndYn DESC, cmntCnt DESC, rgstDt DESC`
- **Verification Method**: network
- **Test Data**: Posts with varied `cmntCnt` values

### E2E-021: Combined category filter + search
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Posts in multiple categories with varying content
- **User Journey**:
  1. Navigate to `/dashboard/board`
  2. Select "QNA" category filter
  3. Enter search keyword
  4. Verify results are QNA posts matching the keyword
- **Expected Results**:
  - API: `GET /api/posts?category=QNA&search={keyword}` returns correctly filtered and searched results
- **Verification Method**: network
- **Test Data**: QNA post containing keyword "help"

### E2E-022: Pagination navigation
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: More than 10 posts exist (default page size)
- **User Journey**:
  1. Navigate to `/dashboard/board`
  2. Verify first page shows up to 10 posts
  3. Click "Next" / page 2
  4. Verify next batch of posts loaded
  5. Verify pagination metadata (page, totalPages, total)
- **Expected Results**:
  - API: `GET /api/posts?page=2&limit=10` returns second page; response includes `pagination: { page: 2, limit: 10, total, totalPages }`
  - UI: Page indicator updates, posts change
- **Verification Method**: network
- **Test Data**: 15+ posts

---

## Scenario Group 4: Banner Management (Admin)

### E2E-023: Get current banner (public)
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: An active banner exists (useYn: 'Y')
- **User Journey**:
  1. Navigate to `/dashboard/board`
  2. Verify banner displays at top of the board page with image, title, subtitle, link
- **Expected Results**:
  - UI: Banner section visible with image, optional title/subtitle, clickable link
  - API: `GET /api/posts/banner` returns banner object `{ id, imageUrl, title, subtitle, linkUrl, enabled: true }`
- **Verification Method**: snapshot / network
- **Test Data**: Active banner with all fields populated

### E2E-024: Get banner when none exists
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: No banner records exist or all are disabled
- **User Journey**:
  1. Navigate to `/dashboard/board`
  2. Verify no banner section or a graceful empty state
- **Expected Results**:
  - UI: Banner area hidden or shows placeholder
  - API: `GET /api/posts/banner` returns `null`
- **Verification Method**: network
- **Test Data**: Empty BoardBanner table

### E2E-025: Update banner as SUPER_ADMIN
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN
- **User Journey**:
  1. Navigate to board admin/banner management UI
  2. Upload or set banner image URL: "https://example.com/banner.jpg"
  3. Set title: "Summer Sale", subtitle: "Up to 50% off", link: "/products?sale=true"
  4. Toggle enabled ON
  5. Save
  6. Verify banner updated on board page
- **Expected Results**:
  - UI: Banner management form submits, board page shows updated banner
  - API: `PUT /api/posts/banner` returns updated banner object with `enabled: true`
  - DB: BoardBanner record upserted (created if none exists, updated if existing), `useYn: 'Y'`, `mdfrId` set
  - Server Log: `User {userId} updated board banner {bannerId}`
- **Verification Method**: network / db-query
- **Test Data**: `{ imageUrl: "https://example.com/banner.jpg", title: "Summer Sale", subtitle: "Up to 50% off", linkUrl: "/products?sale=true", enabled: true }`

### E2E-026: Disable banner as SUPER_ADMIN
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as SUPER_ADMIN, active banner exists
- **User Journey**:
  1. Navigate to banner management
  2. Toggle enabled OFF
  3. Save
  4. Navigate to `/dashboard/board`
  5. Verify banner no longer displayed
- **Expected Results**:
  - API: `PUT /api/posts/banner` with `enabled: false` returns banner with `enabled: false`
  - DB: `useYn: 'N'`
  - API: Subsequent `GET /api/posts/banner` returns `null` (only active banners returned)
- **Verification Method**: network / db-query
- **Test Data**: `{ imageUrl: "https://example.com/banner.jpg", enabled: false }`

### E2E-027: Non-admin user cannot update banner
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as BUYER or SELLER (non-admin)
- **User Journey**:
  1. Attempt `PUT /api/posts/banner` with valid banner data
  2. Verify request rejected with 403
- **Expected Results**:
  - API: Returns 403 Forbidden (Roles guard blocks non-SUPER_ADMIN)
  - DB: No changes to BoardBanner
- **Verification Method**: network
- **Test Data**: Valid banner DTO sent with non-admin auth token

---

## Scenario Group 5: Permission & Ownership Checks

### E2E-028: Non-admin user cannot create NOTICE post
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Logged in as BUYER or SELLER
- **User Journey**:
  1. Attempt `POST /api/posts` with `postCtgrCd: "NOTICE"`
  2. Verify request rejected
- **Expected Results**:
  - API: Returns 403 with error code `NOTICE_ADMIN_ONLY` and message "Only administrators can create notice posts"
  - DB: No post created
- **Verification Method**: network
- **Test Data**: `{ postTtl: "Fake Notice", postCn: "Content", postCtgrCd: "NOTICE" }`

### E2E-029: Non-admin user cannot change category to NOTICE
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as post owner (non-admin), post exists with category FREE
- **User Journey**:
  1. Attempt `PATCH /api/posts/:id` with `{ postCtgrCd: "NOTICE" }`
  2. Verify request rejected
- **Expected Results**:
  - API: Returns 403 with error code `NOTICE_ADMIN_ONLY` and message "Only administrators can set notice category"
  - DB: Post category unchanged
- **Verification Method**: network
- **Test Data**: Own post ID, `{ postCtgrCd: "NOTICE" }`

### E2E-030: Cannot edit another user's post
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Logged in as User A, post owned by User B
- **User Journey**:
  1. Attempt `PATCH /api/posts/:id` for User B's post
  2. Verify 403 Forbidden
- **Expected Results**:
  - API: Returns 403 with error code `NOT_POST_OWNER` and message "You can only modify your own posts"
  - DB: Post unchanged
- **Verification Method**: network
- **Test Data**: Post ID owned by different user

### E2E-031: Cannot delete another user's post
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Logged in as User A, post owned by User B
- **User Journey**:
  1. Attempt `DELETE /api/posts/:id` for User B's post
  2. Verify 403 Forbidden
- **Expected Results**:
  - API: Returns 403 with error code `NOT_POST_OWNER`
  - DB: Post `delYn` remains 'N'
- **Verification Method**: network
- **Test Data**: Post ID owned by different user

### E2E-032: Cannot edit another user's comment
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as User A, comment by User B on any post
- **User Journey**:
  1. Attempt `PATCH /api/posts/:postId/comments/:commentId` for User B's comment
  2. Verify 403 Forbidden
- **Expected Results**:
  - API: Returns 403 with error code `NOT_COMMENT_OWNER` and message "You can only modify your own comments"
  - DB: Comment unchanged
- **Verification Method**: network
- **Test Data**: Comment ID owned by different user

### E2E-033: Cannot delete another user's comment
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as User A, comment by User B
- **User Journey**:
  1. Attempt `DELETE /api/posts/:postId/comments/:commentId` for User B's comment
  2. Verify 403 Forbidden
- **Expected Results**:
  - API: Returns 403 with error code `NOT_COMMENT_OWNER`
  - DB: Comment `delYn` remains 'N'
- **Verification Method**: network
- **Test Data**: Comment ID owned by different user

### E2E-034: SUPER_ADMIN can edit any user's post
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN, post owned by a regular user
- **User Journey**:
  1. `PATCH /api/posts/:id` with updated title for another user's post
  2. Verify 200 success
- **Expected Results**:
  - API: Returns 200 with updated post (ownership check bypassed for SUPER_ADMIN)
  - DB: Post updated, `mdfrId` set to admin user ID
- **Verification Method**: network / db-query
- **Test Data**: Post owned by regular user, `{ postTtl: "Admin-edited title" }`

### E2E-035: SUPER_ADMIN can delete any user's post
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN, post owned by a regular user
- **User Journey**:
  1. `DELETE /api/posts/:id` for another user's post
  2. Verify 200 with `{ deleted: true }`
- **Expected Results**:
  - API: Returns `{ id, deleted: true }`
  - DB: `delYn` set to 'Y'
- **Verification Method**: network / db-query
- **Test Data**: Post owned by regular user

### E2E-036: SUPER_ADMIN can delete any user's comment
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as SUPER_ADMIN, comment owned by a regular user
- **User Journey**:
  1. `DELETE /api/posts/:postId/comments/:commentId` for another user's comment
  2. Verify 200 success
- **Expected Results**:
  - API: Returns `{ id, deleted: true }`
  - DB: Comment `delYn: 'Y'`, post `cmntCnt` decremented
- **Verification Method**: network / db-query
- **Test Data**: Comment owned by regular user

### E2E-037: Unauthenticated user cannot create post
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Not logged in (no auth token)
- **User Journey**:
  1. Attempt `POST /api/posts` without Authorization header
  2. Verify 401 Unauthorized
- **Expected Results**:
  - API: Returns 401 Unauthorized
  - DB: No post created
- **Verification Method**: network
- **Test Data**: Valid post DTO, no auth token

### E2E-038: Unauthenticated user cannot create comment
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Not logged in, post exists
- **User Journey**:
  1. Attempt `POST /api/posts/:id/comments` without Authorization header
  2. Verify 401 Unauthorized
- **Expected Results**:
  - API: Returns 401 Unauthorized
- **Verification Method**: network
- **Test Data**: Valid comment DTO, no auth token

### E2E-039: Unauthenticated user can view posts and post detail (public)
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Posts exist, user not logged in
- **User Journey**:
  1. `GET /api/posts` without auth — verify 200 with post list
  2. `GET /api/posts/:id` without auth — verify 200 with post detail
  3. `GET /api/posts/:id/comments` without auth — verify 200 with comments
  4. `GET /api/posts/banner` without auth — verify 200
- **Expected Results**:
  - API: All GET endpoints marked `@Public()` return 200 without auth token
- **Verification Method**: network
- **Test Data**: Existing post IDs

---

## Scenario Group 6: Edge Cases

### E2E-040: View board with no posts (empty state)
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: No posts exist or all posts deleted
- **User Journey**:
  1. Navigate to `/dashboard/board`
  2. Verify empty state UI displayed (e.g., "No posts yet" message)
- **Expected Results**:
  - UI: Empty state illustration or message rendered, no errors
  - API: `GET /api/posts` returns `{ items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }`
- **Verification Method**: snapshot / network
- **Test Data**: Empty board

### E2E-041: Post with very long title and content
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Logged in as authenticated user
- **User Journey**:
  1. Navigate to `/dashboard/board/create`
  2. Enter title with 200 characters
  3. Enter content with 10,000 characters
  4. Submit
  5. Verify post created and displayed without truncation issues
- **Expected Results**:
  - UI: Long title may be truncated in list view but full in detail view; content renders fully
  - API: `POST /api/posts` returns 201 with full content preserved
  - DB: Full text stored
- **Verification Method**: snapshot / network
- **Test Data**: `{ postTtl: "A".repeat(200), postCn: "B".repeat(10000), postCtgrCd: "FREE" }`

### E2E-042: Search with no results
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Posts exist but none match the keyword
- **User Journey**:
  1. Navigate to `/dashboard/board`
  2. Search for "zzzzNonExistentKeyword999"
  3. Verify empty results with appropriate message
- **Expected Results**:
  - UI: "No results found" message displayed
  - API: `GET /api/posts?search=zzzzNonExistentKeyword999` returns `{ items: [], pagination: { total: 0 } }`
- **Verification Method**: network
- **Test Data**: Search keyword: "zzzzNonExistentKeyword999"

### E2E-043: Access deleted post by direct URL
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: A post has been soft-deleted (`delYn: 'Y'`)
- **User Journey**:
  1. Navigate directly to `/dashboard/board/[deletedPostId]`
  2. Verify 404 or "Post not found" error page
- **Expected Results**:
  - UI: Error page or "Post not found" message
  - API: `GET /api/posts/:id` returns 404 with error code `POST_NOT_FOUND`
- **Verification Method**: network
- **Test Data**: ID of a soft-deleted post

### E2E-044: Comment on a non-existent post
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Logged in, targeting a non-existent post ID
- **User Journey**:
  1. Attempt `POST /api/posts/999999/comments` with valid comment body
  2. Verify 404
- **Expected Results**:
  - API: Returns 404 with error code `POST_NOT_FOUND`
- **Verification Method**: network
- **Test Data**: `{ cmntCn: "Comment on ghost post" }`, post ID: 999999

### E2E-045: Reply to a non-existent parent comment
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Logged in, valid post exists
- **User Journey**:
  1. Attempt `POST /api/posts/:id/comments` with `prntCmntId: 999999` (non-existent)
  2. Verify 404
- **Expected Results**:
  - API: Returns 404 with error code `PARENT_COMMENT_NOT_FOUND` and message "Parent comment not found"
- **Verification Method**: network
- **Test Data**: `{ cmntCn: "Reply to ghost comment", prntCmntId: 999999 }`

### E2E-046: Update non-existent post
- **Type**: Error Path
- **Priority**: Low
- **Preconditions**: Logged in
- **User Journey**:
  1. Attempt `PATCH /api/posts/999999` with valid update body
  2. Verify 404
- **Expected Results**:
  - API: Returns 404 with error code `POST_NOT_FOUND`
- **Verification Method**: network
- **Test Data**: Post ID: 999999

### E2E-047: Delete non-existent post
- **Type**: Error Path
- **Priority**: Low
- **Preconditions**: Logged in
- **User Journey**:
  1. Attempt `DELETE /api/posts/999999`
  2. Verify 404
- **Expected Results**:
  - API: Returns 404 with error code `POST_NOT_FOUND`
- **Verification Method**: network
- **Test Data**: Post ID: 999999

### E2E-048: Pinned posts always appear first regardless of sort
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: At least 1 pinned post and several non-pinned posts exist
- **User Journey**:
  1. Navigate to `/dashboard/board`
  2. Verify pinned post appears first (regardless of sort=newest, sort=views, sort=comments)
  3. Switch sort order to "views"
  4. Verify pinned post still appears first
- **Expected Results**:
  - API: All sort modes include `pnndYn: 'desc'` as the primary sort key
  - UI: Pinned posts have a visual pin indicator and remain at top
- **Verification Method**: network
- **Test Data**: 1 pinned post, 5+ non-pinned posts

---

## Summary

| ID | Scenario | Type | Priority |
|----|----------|------|----------|
| E2E-001 | Create FREE category post | Happy Path | Critical |
| E2E-002 | Create posts in QNA, REVIEW | Happy Path | High |
| E2E-003 | View post detail with view count | Happy Path | Critical |
| E2E-004 | Edit own post | Happy Path | High |
| E2E-005 | Edit post category | Happy Path | Medium |
| E2E-006 | Delete own post (soft delete) | Happy Path | High |
| E2E-007 | Create NOTICE post as admin | Happy Path | High |
| E2E-008 | Add comment to post | Happy Path | Critical |
| E2E-009 | Add nested reply (depth 1) | Happy Path | High |
| E2E-010 | Reject reply beyond depth 1 | Error Path | High |
| E2E-011 | Edit own comment | Happy Path | Medium |
| E2E-012 | Delete own comment | Happy Path | Medium |
| E2E-013 | Retrieve comments list | Happy Path | Medium |
| E2E-014 | Filter by category (FREE) | Happy Path | High |
| E2E-015 | Filter by category (QNA) | Happy Path | Medium |
| E2E-016 | Search by keyword (title) | Happy Path | High |
| E2E-017 | Search by keyword (content) | Happy Path | Medium |
| E2E-018 | Sort by newest (default) | Happy Path | Medium |
| E2E-019 | Sort by view count | Happy Path | Medium |
| E2E-020 | Sort by comment count | Happy Path | Low |
| E2E-021 | Combined category + search | Happy Path | Medium |
| E2E-022 | Pagination navigation | Happy Path | Medium |
| E2E-023 | Get current banner (public) | Happy Path | Medium |
| E2E-024 | Get banner when none exists | Edge Case | Low |
| E2E-025 | Update banner as admin | Happy Path | High |
| E2E-026 | Disable banner | Happy Path | Medium |
| E2E-027 | Non-admin cannot update banner | Error Path | High |
| E2E-028 | Non-admin cannot create NOTICE | Error Path | Critical |
| E2E-029 | Non-admin cannot change to NOTICE | Error Path | High |
| E2E-030 | Cannot edit other's post | Error Path | Critical |
| E2E-031 | Cannot delete other's post | Error Path | Critical |
| E2E-032 | Cannot edit other's comment | Error Path | High |
| E2E-033 | Cannot delete other's comment | Error Path | High |
| E2E-034 | Admin can edit any post | Happy Path | High |
| E2E-035 | Admin can delete any post | Happy Path | High |
| E2E-036 | Admin can delete any comment | Happy Path | Medium |
| E2E-037 | Unauthenticated cannot create post | Error Path | Critical |
| E2E-038 | Unauthenticated cannot comment | Error Path | High |
| E2E-039 | Unauthenticated can view (public) | Happy Path | High |
| E2E-040 | Empty board state | Edge Case | Medium |
| E2E-041 | Very long title and content | Edge Case | Low |
| E2E-042 | Search with no results | Edge Case | Low |
| E2E-043 | Access deleted post by URL | Edge Case | Medium |
| E2E-044 | Comment on non-existent post | Error Path | Medium |
| E2E-045 | Reply to non-existent parent | Error Path | Medium |
| E2E-046 | Update non-existent post | Error Path | Low |
| E2E-047 | Delete non-existent post | Error Path | Low |
| E2E-048 | Pinned posts always first | Happy Path | Medium |

### Statistics

| Type | Count |
|------|-------|
| Happy Path | 27 |
| Error Path | 15 |
| Edge Case | 6 |
| **Total** | **48** |

### Priority Distribution

| Priority | Count |
|----------|-------|
| Critical | 7 |
| High | 21 |
| Medium | 14 |
| Low | 6 |

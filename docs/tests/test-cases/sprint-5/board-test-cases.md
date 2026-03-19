# Board Module Test Cases — Sprint 5

## 1. Post CRUD

### TC-B-001: Create Post (Happy Path)
- **Given** a logged-in user with role BUYER
- **When** the user sends POST `/api/posts` with `{ postTtl: "Test Post", postCn: "Content here", postCtgrCd: "FREE" }`
- **Then** response status is 201, response body contains the created post with id, title, content, category, and author info

### TC-B-002: Create NOTICE Post — Admin Only
- **Given** a logged-in user with role BUYER
- **When** the user sends POST `/api/posts` with `{ postCtgrCd: "NOTICE" }`
- **Then** response status is 403 with error code `NOTICE_ADMIN_ONLY`

### TC-B-003: Create NOTICE Post — As SUPER_ADMIN
- **Given** a logged-in user with role SUPER_ADMIN
- **When** the user sends POST `/api/posts` with `{ postCtgrCd: "NOTICE", postTtl: "Announcement", postCn: "Important info" }`
- **Then** response status is 201, post is created successfully

### TC-B-004: Create Post — Validation Errors
- **Given** a logged-in user
- **When** the user sends POST `/api/posts` with empty title or content
- **Then** response status is 400 with validation error messages

### TC-B-005: Create Post — Title Exceeds Max Length
- **Given** a logged-in user
- **When** the user sends POST `/api/posts` with title > 200 characters
- **Then** response status is 400 with validation error

### TC-B-006: Get Post List (Default)
- **Given** multiple posts exist in the database
- **When** any user sends GET `/api/posts`
- **Then** response contains paginated list sorted by newest first, pinned posts at top, with pagination metadata

### TC-B-007: Get Post List — Filter by Category
- **Given** posts exist in categories FREE and QNA
- **When** user sends GET `/api/posts?category=QNA`
- **Then** response contains only QNA posts (plus pinned posts)

### TC-B-008: Get Post List — Search by Title/Content
- **Given** posts with various titles and content
- **When** user sends GET `/api/posts?search=ceramic`
- **Then** response contains only posts where title or content contains "ceramic" (case-insensitive)

### TC-B-009: Get Post List — Sort by Views
- **Given** posts with different view counts
- **When** user sends GET `/api/posts?sort=views`
- **Then** response posts are sorted by inqrCnt descending

### TC-B-010: Get Post List — Sort by Comments
- **Given** posts with different comment counts
- **When** user sends GET `/api/posts?sort=comments`
- **Then** response posts are sorted by cmntCnt descending

### TC-B-011: Get Post List — Pagination
- **Given** 25 posts exist
- **When** user sends GET `/api/posts?page=2&limit=10`
- **Then** response contains posts 11-20, pagination shows page 2 of 3, total 25

### TC-B-012: Get Post Detail
- **Given** a post exists with id "abc123"
- **When** user sends GET `/api/posts/abc123`
- **Then** response contains full post details including author info (name, avatar)

### TC-B-013: Get Post Detail — View Count Increment
- **Given** a post with inqrCnt = 5
- **When** user sends GET `/api/posts/:id`
- **Then** returned view count is 6, database value is incremented

### TC-B-014: Get Post Detail — Not Found
- **Given** no post exists with id "nonexistent"
- **When** user sends GET `/api/posts/nonexistent`
- **Then** response status is 404 with error code `POST_NOT_FOUND`

### TC-B-015: Update Post — Owner
- **Given** user A created a post
- **When** user A sends PATCH `/api/posts/:id` with updated title
- **Then** response status is 200, post title is updated

### TC-B-016: Update Post — Not Owner
- **Given** user A created a post
- **When** user B sends PATCH `/api/posts/:id`
- **Then** response status is 403 with error code `NOT_POST_OWNER`

### TC-B-017: Update Post — SUPER_ADMIN Override
- **Given** user A created a post
- **When** SUPER_ADMIN sends PATCH `/api/posts/:id`
- **Then** response status is 200, post is updated successfully

### TC-B-018: Delete Post — Owner
- **Given** user A created a post
- **When** user A sends DELETE `/api/posts/:id`
- **Then** response status is 200, post delYn set to 'Y'

### TC-B-019: Delete Post — Not Owner
- **Given** user A created a post
- **When** user B sends DELETE `/api/posts/:id`
- **Then** response status is 403

### TC-B-020: Create Post — Unauthenticated
- **Given** no auth token provided
- **When** user sends POST `/api/posts`
- **Then** response status is 401

## 2. Comments

### TC-B-021: Add Comment (Root Level)
- **Given** a logged-in user and an existing post
- **When** user sends POST `/api/posts/:id/comments` with `{ cmntCn: "Great post!" }`
- **Then** response status is 201, comment created with cmntDpth = 0, post cmntCnt incremented

### TC-B-022: Add Reply Comment (Nested, Depth 1)
- **Given** a root comment exists on a post
- **When** user sends POST `/api/posts/:id/comments` with `{ cmntCn: "Thanks!", prntCmntId: "<rootId>" }`
- **Then** response status is 201, comment created with cmntDpth = 1, prntCmntId set

### TC-B-023: Add Reply to Reply (Depth 2 — Rejected)
- **Given** a depth-1 reply comment exists
- **When** user sends POST `/api/posts/:id/comments` with prntCmntId pointing to the depth-1 comment
- **Then** response status is 400 with error code `MAX_DEPTH_EXCEEDED`

### TC-B-024: Get Comments for Post
- **Given** a post has 5 root comments and 3 replies
- **When** user sends GET `/api/posts/:id/comments`
- **Then** response contains all 8 non-deleted comments, sorted by creation date

### TC-B-025: Edit Own Comment
- **Given** user A created a comment
- **When** user A sends PATCH `/api/posts/:postId/comments/:commentId` with updated content
- **Then** response status is 200, content updated

### TC-B-026: Edit Comment — Not Owner
- **Given** user A created a comment
- **When** user B sends PATCH the comment
- **Then** response status is 403

### TC-B-027: Delete Own Comment
- **Given** user A created a comment
- **When** user A sends DELETE `/api/posts/:postId/comments/:commentId`
- **Then** response status is 200, comment soft-deleted, post cmntCnt decremented

### TC-B-028: Delete Comment — SUPER_ADMIN
- **Given** user A created a comment
- **When** SUPER_ADMIN sends DELETE on the comment
- **Then** response status is 200, comment soft-deleted

### TC-B-029: Comment on Deleted Post
- **Given** a post is soft-deleted (delYn = 'Y')
- **When** user sends POST `/api/posts/:id/comments`
- **Then** response status is 404 with error code `POST_NOT_FOUND`

### TC-B-030: Comment Content Validation
- **Given** a logged-in user
- **When** user sends POST comment with empty content or content > 2000 chars
- **Then** response status is 400 with validation error

## 3. Edge Cases

### TC-B-031: Get Deleted Post
- **Given** a soft-deleted post
- **When** any user sends GET `/api/posts/:id`
- **Then** response status is 404

### TC-B-032: Update Deleted Post
- **Given** a soft-deleted post
- **When** owner sends PATCH `/api/posts/:id`
- **Then** response status is 404

### TC-B-033: Category Filter with Search Combined
- **Given** posts in different categories
- **When** user sends GET `/api/posts?category=QNA&search=how`
- **Then** response contains only QNA posts matching "how"

### TC-B-034: Empty Search Results
- **Given** no posts match search term "xyz123nonexistent"
- **When** user sends GET `/api/posts?search=xyz123nonexistent`
- **Then** response contains empty items array with total = 0

### TC-B-035: Invalid Category Value
- **Given** any user
- **When** user sends GET `/api/posts?category=INVALID`
- **Then** response status is 400 with validation error

### TC-B-036: Page Beyond Range
- **Given** 5 total posts, 10 per page
- **When** user sends GET `/api/posts?page=2`
- **Then** response contains empty items array, pagination shows page 2 of 1

### TC-B-037: Invalid Post ID Format
- **Given** any user
- **When** user sends GET `/api/posts/not-a-valid-id`
- **Then** response status is 400 or 404

### TC-B-038: Concurrent View Count Increments
- **Given** a post with inqrCnt = 0
- **When** 10 concurrent GET requests to `/api/posts/:id`
- **Then** final inqrCnt should be 10 (atomic increment)

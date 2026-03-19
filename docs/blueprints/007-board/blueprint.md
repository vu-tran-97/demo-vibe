# Blueprint 007 — Board (Bulletin Board Module)

> Sprint 5 Feature 1: Community bulletin board with post CRUD, nested comments, search/filter, and view tracking.

## 1. Overview

The Board module provides a full-featured community bulletin board for the Vibe e-commerce platform. Users can create posts across multiple categories, engage through nested comments, and discover content via search, filtering, and sorting.

### Key Features
- **Post CRUD**: Create, read, update, and soft-delete posts with rich text content
- **Categories**: NOTICE (admin-only), FREE, QNA, REVIEW
- **Comment System**: Nested comments (max 1 level depth), edit/delete own comments
- **Search & Filter**: Full-text search by title/content, filter by category
- **Sort Options**: Newest, most viewed, most commented
- **View Count Tracking**: Increment on post detail view
- **Permission Control**: Only post/comment owner or SUPER_ADMIN can edit/delete

## 2. User Stories

| ID | Role | Story | Acceptance Criteria |
|----|------|-------|---------------------|
| B-01 | Any User | View post list with pagination | Category tabs, search bar, sort dropdown, 10 posts per page |
| B-02 | Logged-in User | Create a new post | Title (1-200 chars), content (1-10000 chars), category select |
| B-03 | Any User | View post detail | Full content, author info, view count increment, comment section |
| B-04 | Post Owner / SUPER_ADMIN | Edit post | Update title, content, category |
| B-05 | Post Owner / SUPER_ADMIN | Delete post | Soft delete (DEL_YN = 'Y') |
| B-06 | Logged-in User | Add a comment | Comment content (1-2000 chars), optional parent comment |
| B-07 | Comment Owner / SUPER_ADMIN | Edit own comment | Update comment content |
| B-08 | Comment Owner / SUPER_ADMIN | Delete own comment | Soft delete |
| B-09 | SUPER_ADMIN | Create NOTICE post | Only SUPER_ADMIN can select NOTICE category |
| B-10 | Any User | Search posts | Search by title and content, combined with category filter |

## 3. API Endpoints

### Posts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/posts` | Public | List posts (paginated, searchable, filterable, sortable) |
| GET | `/api/posts/:id` | Public | Get post detail (increments view count) |
| POST | `/api/posts` | Required | Create new post |
| PATCH | `/api/posts/:id` | Owner/Admin | Update post |
| DELETE | `/api/posts/:id` | Owner/Admin | Soft delete post |

### Comments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/posts/:id/comments` | Public | List comments for a post |
| POST | `/api/posts/:id/comments` | Required | Add comment (optional parentId for reply) |
| PATCH | `/api/posts/:postId/comments/:commentId` | Owner/Admin | Edit comment |
| DELETE | `/api/posts/:postId/comments/:commentId` | Owner/Admin | Soft delete comment |

### Query Parameters (GET /api/posts)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page (max 50) |
| category | string | - | Filter by POST_CTGR_CD |
| search | string | - | Search in title and content |
| sort | string | newest | Sort: newest, views, comments |

## 4. Database Tables

Reference: `docs/database/database-design.md` Section 5 (Board Module)

- **TB_COMM_BOARD_POST**: Posts with title, content, category, view/like/comment counts
- **TB_COMM_BOARD_CMNT**: Comments with parent reference (1-depth nesting)
- **TB_COMM_BOARD_ATCH**: Post attachments (future enhancement)
- **TR_COMM_BOARD_LIKE**: Post likes (future enhancement)

## 5. Frontend Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/dashboard/board` | BoardListPage | Post list with category tabs, search, sort, pagination |
| `/dashboard/board/[id]` | BoardDetailPage | Post detail with comment section |
| `/dashboard/board/create` | BoardCreatePage | Create post form |
| `/dashboard/board/[id]/edit` | BoardEditPage | Edit post form |

### Responsive Breakpoints
- **Mobile** (< 768px): Single column, stacked filters, full-width cards
- **Tablet** (768-1023px): Compact layout with side-by-side filters
- **Desktop** (1024px+): Full layout with all elements visible

## 6. Permission Matrix

| Action | BUYER | SELLER | SUPER_ADMIN |
|--------|-------|--------|-------------|
| View posts | Yes | Yes | Yes |
| Create post (FREE/QNA/REVIEW) | Yes | Yes | Yes |
| Create NOTICE post | No | No | Yes |
| Edit own post | Yes | Yes | Yes |
| Edit any post | No | No | Yes |
| Delete own post | Yes | Yes | Yes |
| Delete any post | No | No | Yes |
| Add comment | Yes | Yes | Yes |
| Edit own comment | Yes | Yes | Yes |
| Delete any comment | No | No | Yes |

## 7. Technical Notes

- View count increment uses atomic `{ increment: 1 }` to avoid race conditions
- Comment count on post is denormalized (cmntCnt field) for performance
- Pinned posts (PNND_YN = 'Y') always appear at the top of listings
- Soft delete: All queries filter by `delYn: 'N'`
- Search uses case-insensitive `contains` for MongoDB text matching

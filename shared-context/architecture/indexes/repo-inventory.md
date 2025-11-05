# Repository Inventory — SiderHub Source Tree

**Generated:** 2025-11-03T14:45:00-03:00 (Complete Reindex)
**Purpose:** Comprehensive map of the src/ directory structure, file counts, and alignment with architecture
**Total Files:** 186 TypeScript/TSX files

---

## Overview

The SiderHub codebase is organized into 4 main directories under `src/`:
1. **backend/** - Node.js/Express API, services, repositories, workers (88 files)
2. **frontend/** - React application with components, hooks, pages (76 files)
3. **shared/** - Common types, utilities, design tokens (14 files)
4. **types/** - Global TypeScript declarations (2 files)

---

## Backend Structure (`src/backend/` - 88 files)

### API Layer (`src/backend/api/` - 9 files)

Express routes organized by domain, exposing REST endpoints.

```
api/
├── index.ts                    # Main router aggregator
├── types.ts                    # API-specific type definitions
├── utils/
│   └── responses.ts            # ApiResponse helpers (respondSuccess/respondError)
├── auth/index.ts               # POST /login, /logout, /register, /refresh, GET /me
├── hub/index.ts                # GET /hub (dashboard data)
├── academy/index.ts            # Courses, lessons, progress, ratings, comments, replies
├── hidra/index.ts              # Campaigns, configs, dashboard, stats
├── cybervault/index.ts         # Resources library, downloads
└── admin/index.ts              # Dashboard, members, banners, feature toggles, invitations
```

**Key Responsibilities:**
- Zod validation schemas for request bodies/params
- RBAC enforcement via `roleGuard` middleware
- Standardized `ApiResponse<T>` format
- Rate limiting via `rateLimit` middleware

**Files:**
- `auth/index.ts` - Authentication endpoints
- `academy/index.ts` - Learning management endpoints (includes comments/replies/moderation)
- `hidra/index.ts` - WhatsApp campaign orchestration
- `cybervault/index.ts` - Resource library & downloads
- `admin/index.ts` - Admin panel endpoints (members, banners, toggles)
- `hub/index.ts` - Main hub dashboard aggregation

---

### Services Layer (`src/backend/services/` - 17 files)

Business logic orchestration, domain workflows.

```
services/
├── auth/
│   ├── AuthService.ts          # Login, register, session management
│   ├── TokenService.ts         # JWT generation/validation, refresh rotation
│   ├── PasswordService.ts      # bcrypt hashing/verification
│   └── index.ts
├── academy/
│   ├── AcademyService.ts       # Courses, lessons, progress, comments, replies, moderation
│   └── index.ts
├── hidra/
│   ├── HidraService.ts         # Campaigns, configs, dashboard stats
│   ├── EvolutionClient.ts      # HTTP client for Evolution API
│   ├── EncryptionService.ts    # API key encryption (abstract)
│   ├── CryptoEncryptionService.ts  # libsodium implementation
│   └── index.ts
├── cybervault/
│   ├── CybervaultService.ts    # Resources, downloads, tracking
│   └── index.ts
├── admin/
│   ├── AdminService.ts         # Members, banners, feature toggles, access overrides
│   └── index.ts
└── hub/
    ├── HubService.ts           # Aggregates data from Academy, Hidra, Cybervault
    └── index.ts
```

**Key Features:**
- **AcademyService:** Handles comments (with `pendingModeration`, `moderationStatus`), replies (3-level threading), approve/reject workflows
- **HidraService:** Campaign orchestration, Evolution API integration, encrypted config management
- **AuthService:** JWT-based authentication with refresh token rotation
- **HubService:** Dashboard aggregation from multiple domains
- **AdminService:** Member management with access maps, invitations, role assignments

**Current State:**
- Services are ~90% complete
- BullMQ workers integrated for async tasks (campaigns, metrics, cleanup)
- Moderation workflows fully implemented
- Encryption for Hidra API keys implemented

---

### Repositories Layer (`src/backend/repositories/` - 48 files)

Prisma data access layer, domain-specific CRUD operations.

```
repositories/
├── auth/ (10 files)
│   ├── UserRepository.ts + PrismaUserRepository.ts
│   ├── SessionRepository.ts + PrismaSessionRepository.ts
│   ├── InvitationRepository.ts + PrismaInvitationRepository.ts
│   ├── MemberAccessRepository.ts + PrismaMemberAccessRepository.ts
│   └── index.ts
├── academy/ (18 files)
│   ├── CourseRepository.ts + PrismaCourseRepository.ts
│   ├── LessonRepository.ts + PrismaLessonRepository.ts
│   ├── CourseProgressRepository.ts + PrismaCourseProgressRepository.ts
│   ├── LessonProgressRepository.ts + PrismaLessonProgressRepository.ts
│   ├── LessonRatingRepository.ts + PrismaLessonRatingRepository.ts
│   ├── LessonCommentRepository.ts + PrismaLessonCommentRepository.ts
│   ├── LessonCommentReplyRepository.ts + PrismaLessonCommentReplyRepository.ts
│   ├── CourseRecommendationRepository.ts + PrismaCourseRecommendationRepository.ts
│   ├── mappers.ts              # Prisma to Domain entity mappers
│   └── index.ts
├── hidra/ (8 files)
│   ├── CampaignRepository.ts + PrismaCampaignRepository.ts
│   ├── CampaignRunRepository.ts + PrismaCampaignRunRepository.ts
│   ├── HidraConfigRepository.ts + PrismaHidraConfigRepository.ts
│   ├── mappers.ts
│   └── index.ts
├── cybervault/ (5 files)
│   ├── ResourceRepository.ts + PrismaResourceRepository.ts
│   ├── ResourceDownloadRepository.ts + PrismaResourceDownloadRepository.ts
│   └── index.ts
└── admin/ (7 files)
    ├── BannerRepository.ts + PrismaBannerRepository.ts
    ├── FeatureToggleRepository.ts + PrismaFeatureToggleRepository.ts
    ├── MemberAccessOverrideRepository.ts + PrismaMemberAccessOverrideRepository.ts
    ├── HeroBannerRepository.ts
    └── index.ts
```

**Pattern:**
- Interface + Prisma implementation for each repository
- Mappers to convert Prisma models to domain DTOs
- Thin layer - no business logic, pure data access

**Recent Additions:**
- `LessonCommentReplyRepository` for threaded comments (up to 3 levels)
- Moderation fields support (moderation_status, moderated_by, moderated_at)

---

### Middleware (`src/backend/middleware/` - 4 files)

```
middleware/
├── authGuard.ts        # JWT verification, attaches user to req.user
├── roleGuard.ts        # RBAC enforcement (admin, mentor, member roles)
├── errorHandler.ts     # Global error handler, converts AppError to ApiResponse
└── rateLimit.ts        # Rate limiting (10 req/15min for login, 100/15min general)
```

**Features:**
- `authGuard`: Validates JWT, rejects expired/invalid tokens
- `roleGuard`: Checks user role against required roles
- `errorHandler`: Catches all errors, logs, returns standardized ApiError
- `rateLimit`: Protects endpoints from abuse

---

### Jobs/Workers (`src/backend/jobs/` - 6 files)

BullMQ-based asynchronous task processing.

```
jobs/
├── connection.ts               # Redis connection for BullMQ
├── index.ts                    # Exports queues and workers
├── queues/
│   └── index.ts                # Queue definitions (campaign, metrics, cleanup)
└── workers/
    ├── CampaignDispatchWorker.ts   # Processes campaign dispatch jobs
    ├── MetricsSyncWorker.ts        # Syncs metrics from Evolution API
    └── CleanupWorker.ts            # Cleanup expired sessions/tokens
```

**Current State:**
- Infrastructure present and integrated into `server.ts`
- Workers implemented with error handling and retry logic
- Health check endpoint planned

---

### Other Backend Files

```
backend/
├── server.ts           # Express app setup, middleware registration, route mounting
├── logger.ts           # Pino structured logging with correlation IDs
├── types/
│   └── express.d.ts    # Express Request type extensions (req.user)
└── errors/
    └── AppError.ts     # Custom error class with codes
```

---

## Frontend Structure (`src/frontend/` - 76 files)

### Application Shell

```
frontend/
├── main.tsx            # React app entry point
├── App.tsx             # Router setup, QueryClient provider, auth context
└── routes/
    └── ProtectedRoute.tsx  # Route guard for authenticated pages
```

---

### Pages (`src/frontend/pages/` - 15 files)

React page components, one per route.

```
pages/
├── index.ts
├── Auth/
│   └── Login.tsx           # Login form with useAuthForm
├── Hub/
│   └── Home.tsx            # Main dashboard (hero banner, SaaS carousel, academy highlights)
├── Academy/
│   ├── Dashboard.tsx       # Course list with progress cards
│   ├── CourseDetail.tsx    # Course overview with modules/lessons tree
│   └── LessonDetail.tsx    # Video player, progress tracking, comments with threads
├── Hidra/
│   ├── Dashboard.tsx       # Campaign metrics overview
│   ├── Campaigns.tsx       # Campaign list/table
│   ├── CampaignCreate.tsx  # Campaign creation form
│   ├── Wizard.tsx          # Multi-step campaign wizard (segments, templates, schedule)
│   └── Config.tsx          # Evolution API configuration
├── Cybervault/
│   ├── ResourceLibrary.tsx # Filterable resource library
│   └── ResourceDetail.tsx  # Resource detail with download tracking
└── Admin/
    ├── Dashboard.tsx       # Admin metrics overview
    ├── Members.tsx         # Member management with filters/roles
    └── Banners.tsx         # Banner/hero management
```

**Total Pages:** 15 implemented
**Coverage by Domain:**
- Auth: 1 page (Login)
- Hub: 1 page (Home)
- Academy: 3 pages
- Hidra: 5 pages
- Cybervault: 2 pages
- Admin: 3 pages

---

### Components (`src/frontend/components/` - 37 files)

Organized by domain + common reusable components.

```
components/
├── common/ (7 files)
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── ProgressBar.tsx
│   ├── Tabs.tsx
│   └── index.ts
├── hub/ (5 files)
│   ├── HeroBanner.tsx          # Hero carousel with CTA
│   ├── SaaSCarousel.tsx        # Available SaaS modules carousel
│   ├── AcademyHighlights.tsx   # Featured courses section
│   ├── MetricsOverview.tsx     # Dashboard metrics cards
│   └── index.ts
├── academy/ (8 files)
│   ├── CourseCard.tsx          # Course thumbnail with progress
│   ├── ModuleAccordion.tsx     # Collapsible module/lesson tree
│   ├── LessonPlayer.tsx        # Video.js player with tracking
│   ├── RatingStars.tsx         # Star rating component
│   ├── comments/
│   │   ├── CommentThread.tsx   # Threaded comments (3 levels)
│   │   ├── CommentForm.tsx     # Comment/reply form
│   │   ├── PendingBadge.tsx    # "Pending moderation" badge
│   └── index.ts
├── hidra/ (10 files)
│   ├── CampaignTable.tsx       # Campaign list with status
│   ├── MetricsCards.tsx        # Campaign metrics display
│   ├── TimelineChart.tsx       # Message timeline visualization
│   ├── EvolutionConfigForm.tsx # Evolution API config form
│   ├── wizard/
│   │   ├── SegmentSelector.tsx # Target segment selection
│   │   ├── TemplateEditor.tsx  # Message template editor
│   │   ├── ScheduleReview.tsx  # Campaign schedule review
│   │   └── index.ts
│   └── index.ts
├── cybervault/ (4 files)
│   ├── ResourceCard.tsx        # Resource thumbnail
│   ├── FilterBar.tsx           # Category/tag filters
│   ├── DownloadModal.tsx       # Download confirmation modal
│   └── index.ts
└── admin/ (4 files)
    ├── MemberTable.tsx         # Member list with roles/status
    ├── BannerForm.tsx          # Banner create/edit form
    ├── AccessMatrix.tsx        # Role/permission matrix
    └── index.ts
```

**Component Stats:**
- Common/Reusable: 7 components
- Hub: 5 components
- Academy: 8 components (including 3 comment components)
- Hidra: 10 components (including 3 wizard steps)
- Cybervault: 4 components
- Admin: 4 components

**Design System Adherence:**
- All components use design tokens from `src/shared/design/tokens.ts`
- Neon cyberpunk aesthetic (dark mode, #00FF00 primary, glows)
- Rajdhani + Inter fonts

---

### Hooks (`src/frontend/hooks/` - 17 files)

React Query hooks for data fetching + custom hooks.

```
hooks/
├── index.ts
├── useAuthForm.ts              # Form state for login/register
├── useHubData.ts               # Fetch hub dashboard data
├── useCourseProgress.ts        # Track course progress
├── useCourseTree.ts            # Fetch course modules/lessons tree
├── useLessonRating.ts          # Submit/fetch lesson ratings
├── useLessonComments.ts        # Fetch/create comments + replies
├── useCommentModeration.ts     # Moderate comments (approve/reject)
├── useLessonVideoTracking.ts  # Track video progress
├── useCampaignStats.ts         # Fetch Hidra campaign statistics
├── useHidraDashboard.ts        # Fetch Hidra dashboard overview
├── useHidraSegments.ts         # Fetch target segments
├── useHidraTemplates.ts        # Fetch message templates
├── useResourceLibrary.ts       # Fetch Cybervault resources with filters
├── useResourceDownload.ts      # Track resource downloads
├── useAdminDashboard.ts        # Fetch admin dashboard metrics
└── useAdminMembers.ts          # Fetch/manage members with filters
```

**Pattern:**
- All hooks use React Query (v5) with standardized query keys
- Error handling via `mapApiError` from shared utils
- MSW handlers for testing
- Optimistic updates for mutations

**Recent Additions:**
- `useLessonComments`: Extended for replies (3-level threading) + pendingModeration
- `useCommentModeration`: New hook for admin/mentor moderation
- Query key fix for `useCampaignStats` (resolved collision with dashboard)

---

### Layouts (`src/frontend/layouts/` - 4 files)

```
layouts/
├── index.ts
├── AuthLayout.tsx      # Minimal layout for login/register
├── HubLayout.tsx       # Main navigation, sidebar, header
└── AdminLayout.tsx     # Admin-specific navigation
```

---

### Store & Services

```
frontend/
├── store/
│   └── auth.ts         # Zustand store for auth state (user, tokens, isAuthenticated)
├── lib/
│   └── queryClient.ts  # React Query client config (staleTime, cacheTime, retries)
└── services/
    ├── index.ts
    ├── academyService.ts   # Frontend-specific Academy utilities
    └── hidraService.ts     # Frontend-specific Hidra utilities
```

---

## Shared Code (`src/shared/` - 14 files)

### Design Tokens (`src/shared/design/` - 1 file)

```
design/
└── tokens.ts           # Neon cyberpunk design system
    ├── colors: { primary, surfaces, accents, status, glows }
    ├── typography: { fonts, sizes, weights }
    ├── spacing, borders, animations, shadows
```

**Usage:**
- Imported in all frontend components
- Ensures consistency across UI
- Dark mode first (background: #0a0f0d, primary: #00FF00)

---

### Types (`src/shared/types/` - 9 files)

Shared TypeScript types used by both backend and frontend.

```
types/
├── index.ts                # Re-exports all types
├── common.types.ts         # ApiResponse, Pagination, SortOrder, DateRange
├── api.types.ts            # API-specific utility types
├── auth.types.ts           # User, Session, LoginRequest, RegisterRequest
├── academy.types.ts        # Course, Lesson, LessonComment, LessonRating, Progress
├── hidra.types.ts          # Campaign, HidraConfig, CampaignRun, MessageStatus
├── cybervault.types.ts     # Resource, ResourceCategory, ResourceDownload
├── admin.types.ts          # Banner, FeatureToggle, MemberAccess, Invitation
└── hub.types.ts            # HubDashboard, SaaSModule
```

**Pattern:**
- Single source of truth for domain contracts
- Used by both backend services/repositories and frontend hooks/components
- Includes Zod schemas for validation (in some types)

**Recent Updates:**
- `academy.types.ts`: Added `replies` array to `LessonComment`, `pendingModeration`, `moderationStatus`
- `admin.types.ts`: Extended `MemberAccess` with `accessMap`, `inviteStatus`

---

### Utilities (`src/shared/utils/` - 4 files)

```
utils/
├── apiClient.ts        # Axios-based HTTP client with auth token injection
├── errorHandler.ts     # mapApiError, error parsing utilities
├── validation.ts       # Common Zod schemas (email, password, uuid, pagination)
└── cn.ts               # Tailwind CSS class name merger (clsx + tailwind-merge)
```

**Key Features:**
- `apiClient`: Configured with base URL, interceptors for auth tokens, error handling
- `errorHandler`: Maps API errors to user-friendly messages
- `validation`: Reusable Zod schemas to avoid duplication

---

## Global Types (`src/types/` - 2 files)

```
types/
├── static-assets.d.ts      # Module declarations for images, fonts, etc.
└── videojs-plugins.d.ts    # TypeScript definitions for Video.js plugins
```

---

## Architecture Alignment Analysis

### Backend Completeness

| Domain | API Routes | Services | Repositories | Status |
|--------|-----------|----------|--------------|--------|
| **Auth** | ✅ Complete | ✅ Complete | ✅ Complete | 95% |
| **Hub** | ✅ Complete | ✅ Complete | N/A (aggregator) | 90% |
| **Academy** | ✅ Complete + Moderation | ✅ Complete + Replies | ✅ Complete + Replies | 85% |
| **Hidra** | ✅ Complete | ✅ Complete + Workers | ✅ Complete | 90% |
| **Cybervault** | ✅ Complete | ✅ Complete | ✅ Complete | 85% |
| **Admin** | ✅ Complete + Members | ✅ Complete + Access Map | ✅ Complete | 80% |

**Backend Overall:** ~88% complete

---

### Frontend Completeness

| Domain | Pages | Components | Hooks | Status |
|--------|-------|------------|-------|--------|
| **Auth** | ✅ Login (1) | Common components | ✅ useAuthForm | 90% |
| **Hub** | ✅ Home (1) | ✅ 5 components | ✅ useHubData | 75% |
| **Academy** | ✅ 3 pages | ✅ 8 components | ✅ 5 hooks | 60% |
| **Hidra** | ✅ 5 pages | ✅ 10 components | ✅ 4 hooks | 45% |
| **Cybervault** | ✅ 2 pages | ✅ 4 components | ✅ 2 hooks | 40% |
| **Admin** | ✅ 3 pages | ✅ 4 components | ✅ 2 hooks | 30% |

**Frontend Overall:** ~57% complete

---

## Gaps & Observations

### Critical Gaps

1. **API Contract Misalignment**
   - `GET /api/hub` structure doesn't match `useHubData` expected format
   - `POST /academy/lessons/:id/rating` returns `LessonRating` but frontend expects `LessonRatingSummary`
   - **Location:** `src/backend/api/hub/index.ts` vs `src/frontend/hooks/useHubData.ts`

2. **Missing Endpoints**
   - `GET /academy/lessons/:id/progress` - Frontend hook tries to fetch but endpoint not implemented
   - **Impact:** Player can't resume from last position

3. **Workers Testing**
   - BullMQ workers (CampaignDispatch, MetricsSync, Cleanup) lack unit tests
   - **Impact:** No verification of retry logic, error handling

4. **Frontend Component Completion**
   - Hidra wizard partially implemented (segments/templates need Evolution API integration)
   - Admin Members table needs connection to real API with filters
   - **Impact:** Features present in UI but not fully functional

### Positive Observations

1. **Consistent Architecture**
   - Clear separation: API → Services → Repositories
   - Shared types prevent drift between backend/frontend
   - Design tokens ensure UI consistency

2. **Recent Improvements**
   - Comment threading fully implemented (3 levels)
   - Moderation workflow complete (approve/reject)
   - BullMQ workers infrastructure present
   - Query Client consolidated (no duplicates)

3. **Test Coverage**
   - API routes have Supertest coverage
   - Hooks have Vitest + MSW coverage
   - E2E flows have Playwright coverage
   - **Current overall:** ~65% coverage

---

## Hotspots (Files with High Complexity)

1. **`src/backend/services/academy/AcademyService.ts`**
   - 500+ lines, handles courses, lessons, progress, comments, replies, moderation
   - **Recommendation:** Consider splitting into multiple services (CourseService, CommentService)

2. **`src/backend/services/hidra/HidraService.ts`**
   - Orchestrates campaigns, Evolution API calls, encryption
   - **Recommendation:** Extract Evolution API client to separate service

3. **`src/frontend/hooks/useLessonComments.ts`**
   - Complex nested reply handling (3 levels)
   - **Recommendation:** Extract reply flattening logic to utility

4. **`src/frontend/pages/Hidra/Wizard.tsx`**
   - Multi-step state management, validation across steps
   - **Recommendation:** Consider using react-hook-form context for form state

---

## Recommendations by Priority

### P0 (Critical - Complete in next sprint)

1. ✅ **Fix API contract misalignments** (hub, rating response)
2. ✅ **Implement GET /academy/lessons/:id/progress** endpoint
3. ✅ **Add worker tests** (CampaignDispatchWorker, MetricsSyncWorker)

### P1 (High - Complete within 2 weeks)

4. ✅ **Complete Hidra wizard integration** (Evolution API segments/templates)
5. ✅ **Connect Admin Members to real API** (filters, pagination)
6. ✅ **Refactor AcademyService** (split into smaller services)

### P2 (Medium - Nice to have)

7. Add observability (Prometheus metrics, Grafana dashboards)
8. Improve error handling (correlation IDs across all requests)
9. Add rate limiting differentiation (stricter for sensitive routes)
10. Extract common query logic into hooks utility

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| **Total TS/TSX Files** | 186 |
| **Backend Files** | 88 (47%) |
| **Frontend Files** | 76 (41%) |
| **Shared Files** | 14 (8%) |
| **Global Types** | 2 (1%) |
| **API Routes** | 9 files (6 domains) |
| **Services** | 17 files (6 domains) |
| **Repositories** | 48 files (5 domains) |
| **Components** | 37 files (6 categories) |
| **Hooks** | 17 files |
| **Pages** | 15 files (6 domains) |
| **Test Files** | ~63 (separate tests/ directory) |

---

**Last Updated:** 2025-11-03T14:45:00-03:00
**Maintained By:** subagent-context-indexer
**Next Review:** When significant code structure changes occur

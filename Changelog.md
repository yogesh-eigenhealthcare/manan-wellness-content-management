# Changelog

All notable changes and features implemented in the Manan Wellness Content Studio project.

---

## [2026-11-26] - Workflow Progress Bar, Atomic Draft Uploads, Status Badge Theming & Auth Reliability

### 📈 Workflow Progress Bar & Checkpoints

- **Five-Checkpoint Pipeline Progress Indicator**:
  - Implemented `WorkflowProgressBar` component at the top of `ContentDetailView`, displaying real-time progression across 5 milestones:
    1. **Idea approved** (`approved_for_production`)
    2. **In production** (`in_production`)
    3. **Final review** (`draft_review`, or **Changes requested** with rework indicator when `changes_requested`)
    4. **Ready to post** (`approved_to_post`)
    5. **Posted** (`posted`)
  - Displays progress track, step counter (`Step X of 5 · <status>`), completed checkmarks, active step ring indicator, and upcoming checkpoint numbers.
  - Automatically hidden for unapproved ideas (`idea_pending` and `idea_rejected`).
  - Added unit test coverage for `getWorkflowProgress` across all 8 workflow statuses in `src/lib/workflow.test.ts`.

---

### 🎨 Status Badge Theming & Dark Mode Contrast Fix

- **Reusable Semantic Status Badge Classes**:
  - Added dedicated status classes in `src/app/globals.css`: `.status-pill-emerald`, `.status-pill-sky`, `.status-pill-amber`, `.status-pill-rose`, and `.status-pill-orange`.
  - Fixed specificity clashing with `.responsive-data-table tbody td` by providing explicit colors with consistent high contrast:
    - **Light Mode**: High-contrast dark text on soft pastel backgrounds (e.g. `#065f46` emerald, `#075985` sky, `#78350f` amber, `#9f1239` rose, `#9a3412` orange).
    - **Dark Mode**: Luminous text on subtle translucent tinted backgrounds (e.g. `#a7f3d0` emerald, `#bae6fd` sky, `#fde68a` amber, `#fecdd3` rose, `#fed7aa` orange).
- **Theme Class Synchronization**:
  - Updated `ThemeContext.tsx` and the inline FOUC prevention script in `src/app/layout.tsx` to keep `document.documentElement.classList.add('dark')` / `remove('dark')` in sync alongside `<meta name="color-scheme">`.
  - Refactored `STATUS_META` in `src/lib/workflow.ts` to reference the semantic status pill classes.

---

### 📤 Atomic Draft Submissions & File Preview Enhancements

- **Atomic Firestore Draft Submissions**:
  - Refactored `submitDraftFile` and `submitDraftLink` in `src/hooks/useContentItems.ts` to use Firestore `writeBatch`, atomically updating `contentItems/{itemId}`, creating the new draft document in `drafts`, and adding the audit entry in `comments` in a single transaction.
  - Added safe character bounds for `actorName` (≤ 100), `notes` (≤ 2000), `fileName` (≤ 200), and `mimeType` (≤ 100) to ensure compliance with Firestore security rules.
  - Added error handling listeners to `useItemSubcollections`.
- **Draft Preview & Re-Upload Flow**:
  - Updated `DraftPreviewCard.tsx` to convert PDF data URLs to managed `Blob` object URLs, fixing iframe PDF rendering issues.
  - Added "Submitted draft" card showing the active version and draft type, with a toggleable "Re-upload & submit" flow.
  - Positioned submission errors directly above the submit button in `ContentDetailView.tsx` for immediate visibility.
- **Live Cloud Firestore Rules Deployment**:
  - Deployed updated `firestore.rules` to live project `manan-content-management`, enabling `latestDraftKind`, `latestDraftName`, and PDF/image uploads in production.
  - Expanded security rules unit tests in `tests/firestore.rules.test.ts` to verify `writeBatch` file uploads and re-uploads in `draft_review`.

---

### ⚡ Search Debouncing

- **Smooth Input Debouncing**:
  - Created `useDebounce` hook (250ms delay).
  - Integrated debounced search filtering across both the Channel Content table (`src/components/views/ContentView.tsx`) and the Kanban Board (`src/app/board/page.tsx`), preventing unnecessary re-renders during fast typing.

---

### 🔑 Google Authentication & Vercel Production Support

- **Authorized Production Domain**:
  - Added `manan-wellness-content-management.vercel.app` to Firebase Authentication `authorizedDomains`.
- **Popup-Blocked Fallback**:
  - Updated `signInWithGoogle` in `AuthContext.tsx` to automatically fall back to `signInWithRedirect` when popups are blocked by browsers (`auth/popup-blocked` or `auth/operation-not-supported-in-this-environment`).
  - Added `getRedirectResult(auth)` on mount to cleanly catch and report redirect auth outcomes.
- **COOP Headers**:
  - Configured `Cross-Origin-Opener-Policy: same-origin-allow-popups` in `next.config.ts` to preserve OAuth popup communication.

---

## [2026-11-25] - Studio Overhaul, Friendly Design System, Multi-Page Navigation & Review Enhancements

### 🎨 Design System & UI Overhaul (Friendly UI & YouTube Studio Layout)

- **Adopted Friendly Design System**:
  - Implemented the Friendly UI design language (`Plus Jakarta Sans` typography, soft pastel cards and accents, pill-shaped action badges, generous spacing, and approachable rounded corners).
  - Configured signature pastel color tokens: `--pastel-mint`, `--pastel-sky`, `--pastel-rose`, `--pastel-lavender`, and `--pastel-cream`.
  - Added high-contrast WCAG 2.2 AA compliant ink colors across buttons, badges, and dark mode variations.
- **YouTube Studio-Style Workspace**:
  - Full-width sticky studio header with official Manan Wellness branding, global studio search bar, and primary "Create" action.
  - Left navigation sidebar featuring channel identity, manager/member role indicators, and dedicated page links: Dashboard, Content, Board, Insights, and Settings.
  - Mobile drawer navigation support for responsive viewport transitions.

---

### 🗂️ Multi-Page Architecture & Next.js App Router

- Converted the single-page application into dedicated Next.js App Router pages:
  - `/dashboard`: High-level channel metrics, awaiting manager review queue, pipeline analytics, Creator Insider carousel, and recent studio ideas.
  - `/content`: Channel content table view with format tabs, stage filters, faceted search, and full pagination.
  - `/board`: Full-screen Kanban workflow board.
  - `/insights`: Analytical breakdown of mental health topic coverage, format distribution, team workload, and recommended next actions.
  - `/settings`: Appearance/theme preference (Light/Dark/System), team permissions, role pre-assignment, and hashtag bank.
  - `/item`: Dedicated full-page content detail view.

---

### 📝 Content Review & Multi-Tab Detail Workspace

- **Expanded Detail Workspace Tabs**:
  - **Reference post**: Split-screen view with reference details, editing notes, script links, and live 9:16 aspect ratio video/post preview.
  - **Recreated post**: Draft creation controls, script & hashtag editor, and recreated video/asset preview.
  - **Changes requested**: Dedicated tab tracking revision history, manager change requests, and inline timestamped comments (`@0:12`).
- **Flexible Draft Uploads**:
  - Added mutual exclusion support allowing creators to submit either an external video link (Google Drive, YouTube, Loom, MP4) or upload an image / PDF document (PNG, JPG, WEBP, PDF up to 650 KB) with preview.
- **9:16 Letterboxed Scroll-Free Preview**:
  - Standardized reference and recreated previews to clean 9:16 aspect ratio container with black top/bottom letterboxing and no inner scrollbars.

---

### 📊 Dashboard & Analytics Refactor

- **Creator Insider Carousel**:
  - Interactive carousel showcasing curated video tips and guides for growing social media presence with embedded YouTube player modal.
- **Pipeline KPI Summary Strip**:
  - Added Friendly pastel metric blocks highlighting published content, active production, pending reviews, and total ideas.
- **Pipeline Analytics**:
  - Visual breakdown of Gate 1 approval rates, drafts in rework, and publishing queues.

---

### 🖼️ Thumbnail Proxy API & Table Previews

- **Thumbnail Resolver & Server Proxy**:
  - Implemented `/api/thumbnail` server route to reliably proxy and extract oEmbed thumbnails from Instagram Reels and posts without client-side CORS or embed blocking.
  - Added fallback thumbnail handlers for YouTube, Google Drive, and standard video/carousel formats.
- **Table & Board Visuals**:
  - Integrated video/post thumbnail previews directly into table rows and Kanban cards.

---

### 📋 Board & Table Improvements

- **Kanban Card Streamlining**:
  - Removed dense descriptions and vertical column scrollbars from Kanban board.
  - Added progressive column pagination (`Show more` loader) displaying 4 initial items per column.
- **Content Table Pagination**:
  - Integrated configurable rows per page (10, 15, 25, 50) and page navigation controls.
- **Content Taxonomy**:
  - Renamed "Reels" category to "Reels / Shorts".
  - Introduced new dedicated "Long form" content category across filters, modals, and Firestore schema.

---

### 🔒 Firebase Auth & Security

- Resolved Google OAuth sign-in and email/password authentication handling.
- Validated two-gate Cloud Firestore security rules ensuring manager-only approvals for Gate 1 (idea approval) and Gate 2 (final draft cut).

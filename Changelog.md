# Changelog

All notable changes and features implemented in the Manan Wellness Content Studio project.

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

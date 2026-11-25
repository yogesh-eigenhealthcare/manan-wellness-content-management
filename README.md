# Manan Wellness Content Studio

Two-gate Instagram Reel & Content Approval Platform built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Firebase Authentication**, **Cloud Firestore**, and **Firebase Hosting** (`manan-content-management`).

## Workflow (Two Approval Gates)

1. **Gate 1 — Idea Review**: Any team member submits a reference reel/carousel link, topic, effort level, CTA, and adaptation idea (`idea_pending`). Only a **Manager** can approve it for recreation (`approved_for_production`) or park/decline it (`idea_rejected`).
2. **Production & Draft Link**: Team members work on approved items (`in_production`), edit inline scripts/hashtags or link Google Docs, and paste a recreated draft video link (`draft_review`) — supporting Google Drive, YouTube/Shorts, Vimeo, Loom, Streamable, and direct `.mp4` links.
3. **Gate 2 — Final Video Review**: The **Manager** watches the reference video and the recreated draft **side-by-side**, then approves for posting (`approved_to_post`) or requests changes (`changes_requested`) so the team can submit `v2`, `v3`, etc.
4. **Publishing**: Team copies caption + hashtags and marks the item `posted` with the live Instagram link.

---

## Adding the Marketing Manager Email (Before or After Launch)

1. Open `scripts/managers.json` and add the manager's email address:
   ```json
   {
     "managers": [
       {
         "email": "manager@mananwellness.com",
         "teamTag": "Marketing Manager"
       }
     ]
   }
   ```
2. Run:
   ```bash
   npm run seed:managers
   ```
   *(Or pass an email directly: `node scripts/seed-managers.mjs --email=manager@mananwellness.com`.)*
3. Once at least one Manager is signed in, they can also promote/demote team members and manage pre-assigned emails directly in the **Team Roles** modal inside the app.

---

## Importing Your Google Sheet Data

The deduplicated marketing data from `Manan_wellness_content` (excluding clinical patient tabs `pt_list` and `Manan_wellness_clinic`) is stored in `scripts/data/sheet-export.json`:
- **100 deduplicated content items** (merging `Reel_content`, `Reels_post`, and `Post_content `, with `"done"` rows mapped to `approved_to_post`)
- **6 hashtag preset groups** from `Hashtags`

To import into live Firestore (requires `GOOGLE_APPLICATION_CREDENTIALS` or Application Default Credentials):
```bash
npm run import:sheet
```

---

## Local Development & Verification

```bash
# Run unit tests (workflow, video embeds, sheet parser)
npm test

# Run Firestore security rules tests against the local emulator
npm run test:rules

# Typecheck and build static export for Firebase Hosting (outputs to out/)
npm run typecheck && npm run build

# Run local Auth + Firestore emulators (in terminal 1)
npm run emulators

# Run Next.js dev server against local emulators (in terminal 2)
NEXT_PUBLIC_USE_EMULATORS=true npm run dev
```

---

## Deploying to Firebase (`manan-content-management`)

1. Authenticate Firebase CLI and select the project:
   ```bash
   npx -y firebase-tools@latest login
   npx -y firebase-tools@latest use manan-content-management
   ```
2. In Firebase Console (`manan-content-management`):
   - Enable **Authentication** providers: **Google** and **Email/Password**.
   - Ensure **Cloud Firestore** database is created.
3. Build and deploy Hosting + Firestore rules & indexes:
   ```bash
   npm run build
   npx -y firebase-tools@latest deploy
   ```

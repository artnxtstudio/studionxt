# StudioNXT — Living Archive for Artists

StudioNXT is an AI-powered digital archive for artists. Mira, the AI layer, is powered by Claude (Anthropic) — it greets artists on the Wall, generates questions about works, generates artist biographies, and will synthesise voice sessions into a living legacy document. Gemini (Google) handles bio generation on the profile page.

## Live App
https://studionxt.vercel.app

## GitHub
https://github.com/artnxtstudio/studionxt

## Firebase Project
studionxt-2657b

---

## Tech Stack

- **Next.js 14** + TypeScript
- **Firebase** — Firestore (database), Storage (images), Auth (login)
- **Claude Sonnet** (Anthropic) — Mira AI layer via `/api/mira`
- **Gemini 1.5 Flash** (Google) — Bio generation via `/api/gemini`
- **Vercel** — Deployment
- **Tailwind CSS** — Styling

---

## What Is Built

### Authentication
- Google Sign-In (one click) + Email/Password
- Forgot password flow
- Auth guard on all pages — redirects to `/login` if not signed in
- User avatar dropdown (name, email, Profile, Sign out)

### Onboarding (6 steps)
Name → Practice type → Mediums → Country → Career length → Primary intent

### Wall (`/studio`)
Home feed — artworks, WIP, voice sessions in reverse chronological order. Mira greeting with time-aware message and question of the day.

### Archive (`/archive`)
Five tabs: Works · Series · Voices · Documents · Studio (WIP). Grid and list views, search, filters by status and series.

### Upload Flow (4 steps)
About → Dimensions → Classification (Unique / Edition) → Location. Supports device upload and Google Drive.

### Artwork Detail
Image + accordion sections: About, Location, Edition, Mira, Valuation. Edition ledger with per-copy tracking. Delete with confirmation.

### Folio (`/folio`)
Public-facing grid of selected works. Arrange mode. Hero badge. Public/private toggle per work.

### Public Artist Page (`/artist/[username]`)
FAMM-inspired gallery grid. 5-column auto-fill. White lightbox with museum details. About and Contact as modals. No auth required.

### Series System
Assign series on artwork detail. Filter in Archive. Series tab with cover images. Series labels on Folio.

### Bio Library (`/bio-library`)
Full CRUD for biography versions. Mira generates 150-word biography. Versioning with `isActive` flag — one bio live at a time. Edit inline. Word count tracking.

### Profile Page (`/profile`)
Artist name, avatar, practice details. Bio Library link. Legacy Contact section (gold) — saves to Firestore. Links to public page, copy link, edit Folio.

### Voice Sessions
Guided and free mode. Audio recording. Emotional register. Artist statement and curator note.

### WIP (`/archive/wip`)
Timeline with photos. Status: Active / Paused / Abandoned.

### Mira AI
- API: `/api/mira` — Claude Sonnet (server-side only)
- Wall greeting, question of the day, artwork observations, bio generation

---

## Security

- Firestore rules: all private data owner-only, public artworks require `isPublic == true`
- Storage rules: all paths owner-only (public images served via Firebase download URL tokens)
- No private keys in client — all `NEXT_PUBLIC_` vars are Firebase client config
- Anthropic and Gemini API keys server-side only

---

## Local Setup

### 1. Clone
```bash
git clone https://github.com/artnxtstudio/studionxt.git
cd studionxt
```

### 2. Install
```bash
npm install
```

### 3. Environment variables
Create `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_GOOGLE_PICKER_KEY=your_picker_key
ANTHROPIC_API_KEY=your_anthropic_key
GEMINI_API_KEY=your_gemini_key
```

### 4. Run locally
```bash
npm run dev
```
Open http://localhost:3000

---

## Key Flows to Test

- **Onboarding** — sign up, complete 6-step onboarding, arrive at Wall
- **Upload** — + button → Upload image → 4-step form → artwork saved
- **Archive** — Works tab, Series tab, filter by status and series
- **Folio** — toggle works public, arrange order, view public page
- **Bio Library** — generate bio with Mira, set active, view on public page
- **Legacy Contact** — Profile → gold section → add contact details
- **Public page** — visit `/artist/[username]` (no login required)

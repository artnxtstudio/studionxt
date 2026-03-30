# StudioNXT — Session Handoff 4
**Generated:** March 2026
**Author:** Madhavan Pillai
**Purpose:** Complete state after session 4

---

## What Was Built This Session

### Upload Flow
- Fixed critical save bug — silent failure with clear error message
- Fixed image upload race condition
- Added success toast on Wall after save
- Fixed storage rules path mismatch
- Added Google Drive picker
- Upload screen: Take photo (mobile only), Upload from device, Google Drive

### Archive
- Removed all emoji — SVG icons throughout
- Fixed tab hover — text no longer disappears on active state
- Fixed auth guard
- Public toggle dot on each artwork card
- Two dropdown filters — Status and Series (Style B, fixed width truncation)
- Series tab — grid layout matching Works tab
- Documents tab — Bio Library shortcut card

### Wall
- Renamed Studio → Wall everywhere
- Auth guard fixed
- Success toast on redirect from upload

### Navigation
- Desktop: Wall, Archive, Folio
- Mobile: Wall, Archive, +, Voices, Profile
- Public artist pages excluded from Nav entirely

### Folio Page
- Full grid layout — same feel as Works
- Arrange mode — up/down arrows appear only when needed
- Hero badge on image corner (gold)
- Purple dot toggle — public/private per work
- Number shown in Arrange mode

### Series System
- Assign series on artwork detail Record tab
- Autocomplete from existing series names
- Series tab in Archive — grid of series cards with cover image
- Filter by series in Archive — dropdown
- Series label on public Folio work cards
- Series shown in lightbox detail panel

### Public Artist Page
- FAMM-inspired gallery grid
- 5-column auto-fill, natural image ratio, dark image box
- White lightbox — image top, museum details below
- About and Contact now as modals (not static sections)
- About modal: stats strip + full bio paragraphs
- Contact modal: purple background, enquiry email link
- Empty state when no works shared
- Hero image reads isFeatured field
- Works sorted by publicOrder then createdAt

### Security
- /public/{username} collection — safe fields only
- Artist document locked — no longer world-readable
- Artwork reads require isPublic !== false for public access
- Storage rules: artworks, documents, wip all covered
- Onboarding writes public document on completion
- Full audit in SECURITY_AUDIT.md

### Bio Library (/bio-library)
- New page — full CRUD for biography versions
- Mira generates 150-word biography (strict prompt)
- Every version saved to artists/{uid}/bios/{id}
- isActive flag — one bio is active at a time
- Set active → updates /public/{username} immediately
- Edit any version inline
- Delete non-active versions
- Accordion expand — click card to read full bio
- wordCount tracked per version
- source: 'mira' | 'manual' tracked
- editedAt timestamp on edited versions
- Profile page links to Bio Library
- Documents tab has Bio Library shortcut card

### Profile Page
- Replaced bio card with Bio Library link
- saveProfile writes to /public/{username}
- View public page, Copy link, Edit Folio buttons
- Avatar shows initial letter (no emoji)

### WIP New Page
- Branded buttons — camera mobile only, upload primary on desktop

### Git
- Identity fixed: Madhavan Pillai with real email

---

## Current File Structure (key files)
```
src/
  app/
    studio/page.tsx              — Wall (home feed)
    archive/page.tsx             — Archive (Works/Series/Voices/Documents/Studio)
    upload/page.tsx              — Upload (device + Google Drive)
    artwork/page.tsx             — Artwork detail + series assignment
    folio/page.tsx               — Folio grid + Arrange mode
    bio-library/page.tsx         — Bio Library (CRUD + versioning)
    artist/[username]/
      page.tsx                   — Route handler
      PublicArtistPage.tsx       — Public gallery (modals, grid, lightbox)
    profile/page.tsx             — Profile + legacy + public page links
    archive/wip/new/page.tsx     — WIP new (branded)
  components/
    Nav.tsx                      — Desktop + mobile nav
    ArtworkEdit.tsx
    EditionLedger.tsx
    LocationCard.tsx
    CarolVoice.tsx
    PriceIntelligence.tsx
    AuthGuard.tsx
    AuthProvider.tsx
firestore.rules
storage.rules
docs/
  SECURITY_AUDIT.md
  STYLE_GUIDE.md
  SESSION_HANDOFF_3.md
  SESSION_HANDOFF_4.md          — This file
```

---

## Firestore Collections
```
/artists/{uid}                   — Private artist document
  /artworks/{id}                 — Artwork records
    series: string[]             — Series labels (NEW)
    isPublic: boolean            — Folio visibility
    isFeatured: boolean          — Hero image flag
    publicOrder: number          — Folio display order
  /bios/{id}                     — Bio versions (NEW)
    text: string
    wordCount: number
    source: 'mira' | 'manual'
    isActive: boolean
    createdAt: string
    editedAt?: string
  /voices/{id}
  /wip/{id}
  /documents/{id}
  /settings/legacy
  /settings/pricing

/public/{username}               — Safe public document
  uid, username, name, bio
  practiceType, country, email
  updatedAt
```

---

## Environment Variables Required
```
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_GOOGLE_CLIENT_ID
NEXT_PUBLIC_GOOGLE_PICKER_KEY
ANTHROPIC_API_KEY              (server-side — /api/mira)
GEMINI_API_KEY                 (server-side — /api/gemini, currently unused)
```

---

## Outstanding Issues

| Issue | Priority | Notes |
|-------|----------|-------|
| Stripe payments | 🔴 Blocked | Waiting for company registration Stuttgart |
| Google Sign-In Vercel OAuth | 🟡 Check | May need studionxt.vercel.app in both Firebase Auth domains and Google Cloud OAuth origins |
| Firestore rules E2E test | 🟡 Test | Open incognito, verify /studio redirects, public page loads |
| Artist email on public doc | 🟡 v1.1 | Move to /settings — currently in public document |
| The Mira Letter | ⚪ v1.1 | Living document synthesised from voices + artworks |
| Estate access | ⚪ v1.2 | Legacy Key, heartbeat, Estate View |
| Stripe | ⚪ After company reg | €15/month Active, €500 Permanent |

---

## Next Steps (in order)

1. Test with Carol — sit with her, watch her use it
2. Fix anything she finds confusing
3. Stripe when company is registered
4. The Mira Letter (v1.1)

---

## Strategic Decisions Made

| Decision | Detail |
|----------|--------|
| Bio Library location | Profile page link + Documents tab shortcut |
| Series model | String array on artwork — no separate collection |
| Public page | Modals for About and Contact — page is gallery only |
| Folio | Grid with Arrange mode — no drag and drop yet |
| Multiple folios | Not built — one Folio per artist for v1 |
| Bio word limit | Strict 150 words, 3 paragraphs |
| Bio versioning | Full CRUD in /bios subcollection |

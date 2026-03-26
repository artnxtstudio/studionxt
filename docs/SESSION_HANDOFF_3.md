# StudioNXT — Session Handoff 3
**Generated:** March 2026  
**Author:** Madhavan Pillai  
**Purpose:** Complete state after session 3

---

## What Was Built This Session

### Upload Flow
- Fixed critical save bug — silent failure replaced with error message
- Fixed image upload race condition (base64 vs File object)
- Fixed `sessionStorage` pending image — now converts base64 to Blob before upload
- Added success toast on Wall after save (`?saved=1` URL signal)
- Fixed storage rules path mismatch (`artworks/` not `artists/`)
- Added Google Drive picker (requires `NEXT_PUBLIC_GOOGLE_PICKER_KEY` + `NEXT_PUBLIC_GOOGLE_CLIENT_ID`)
- Upload screen redesigned: Take photo (mobile only, `md:hidden`), Upload from device, Google Drive

### Archive Page
- Removed all emoji — replaced with SVG icons
- Fixed tab hover (inactive tabs were going invisible on hover)
- Fixed auth guard — null user now redirected properly
- Added public toggle dot on each artwork card in grid
- Added `updateDoc` import for toggle
- Document storage rules fixed (`documents/{userId}/`)

### Wall (Studio → Wall rename)
- Mobile bottom nav renamed Studio → Wall
- Auth guard fixed — null user redirected to login
- Removed emoji from feed items
- Fixed Mira greeting comma formatting

### Navigation
- Desktop nav: Voices removed, Folio added
- Mobile nav: Studio → Wall label
- Public artist pages (`/artist/`) excluded from Nav entirely

### Folio Page (`/folio`)
- New page — artist's public presence management
- Shows works on Folio (ordered, with hero star + up/down arrows)
- Shows works not on Folio (with + Add button)
- Saves `isPublic`, `isFeatured`, `publicOrder` to Firestore
- Links to live public page ("View Folio →")

### Public Artist Page (`/artist/[username]`)
- Complete redesign inspired by FAMM collection
- FAMM typography: Avenir Next Condensed headings, `rgb(54,40,91)` text
- 5-column auto-fill grid (280px min), 1-column mobile
- Dark image boxes — natural ratio, no crop
- Conditional nav links (Works always, About only if bio, Contact only if email)
- White lightbox — image top, museum-style details panel below
- Conditional fields — empty fields never shown
- Enquire button links to `mailto:` with subject line
- About section only renders if bio exists
- Contact section only renders if email exists
- Hero image reads `isFeatured` field
- Works sorted by `publicOrder` then `createdAt`

### Security
- Firestore rules: artworks public read now requires `isPublic != false`
- Storage rules: added `documents/{userId}/` path
- Full security audit documented in `docs/SECURITY_AUDIT.md`

---

## Current File Structure (key files)
```
src/
  app/
    studio/page.tsx          — Wall (home feed)
    archive/page.tsx         — Archive (Works/Voices/Documents/Studio tabs)
    upload/page.tsx          — Upload flow (4 steps + Google Drive)
    artwork/page.tsx         — Artwork detail page
    folio/page.tsx           — Public presence management
    artist/[username]/
      page.tsx               — Route handler
      PublicArtistPage.tsx   — Public gallery page
    profile/page.tsx         — Profile + legacy contact
    mira/page.tsx            — Mira chat
    pricing/page.tsx         — Valuation settings
  components/
    Nav.tsx                  — Desktop + mobile nav
    ArtworkEdit.tsx          — Edit artwork form
    EditionLedger.tsx        — Edition management
    LocationCard.tsx         — Location display
    CarolVoice.tsx           — Voice session on artwork
    PriceIntelligence.tsx    — Valuation component
    AuthGuard.tsx            — Auth protection
    AuthProvider.tsx         — Firebase auth context
firestore.rules              — Firestore security rules
storage.rules                — Storage security rules
docs/
  SECURITY_AUDIT.md          — Security audit report
  STYLE_GUIDE.md             — Design system documentation
  SESSION_HANDOFF_3.md       — This file
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
NEXT_PUBLIC_ANTHROPIC_API_KEY   (or set in /api/mira route)
GEMINI_API_KEY                  (server-side, /api/gemini route)
```

---

## Outstanding Issues

| Issue | Priority | Notes |
|-------|----------|-------|
| Google Sign-In on Vercel | 🔴 Critical | Add studionxt.vercel.app to Firebase Auth domains + Google Cloud OAuth origins |
| Profile page saveProfile | 🔴 Critical | Function + username/DOB UI not yet complete |
| Username not set for new users | 🔴 Critical | Public page won't work until profile saves username |
| Google API key HTTP referrer restriction | 🟡 Medium | Add in Google Cloud Console |
| Artist email exposed in public doc | 🟡 Medium | Move to /settings in v1.1 |
| Firestore rules E2E test | 🟡 Medium | Test before onboarding real artists |
| "View your public page" link on Profile | 🟡 Medium | Quick add |
| Folio link from Profile page | 🟡 Medium | Quick add |

---

## Next Steps (in order)

1. Complete Profile page — saveProfile + username field + DOB
2. Fix Google Sign-In OAuth domains on Vercel
3. Add "View your public page" to Profile
4. Test Firestore rules end-to-end
5. Onboard first test artists
6. Stripe payments (after company registered)

---

## Strategic Decisions Made This Session

| Decision | Detail |
|----------|--------|
| Nav structure | Wall, Archive, Folio on desktop. Wall, Archive, +, Voices, Profile on mobile |
| Folio name | Kept as "Folio" — short, art world adjacent |
| Public page design | FAMM-inspired gallery — image first, no editorial |
| Lightbox | White background, image top, museum details below |
| Voices in nav | Mobile only — recording is a mobile-first behaviour |
| Public page URL | `/artist/[username]` — username set during onboarding |

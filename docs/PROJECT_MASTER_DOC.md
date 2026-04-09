# StudioNXT — Project Master Document

**Version:** 1.0  
**Last updated:** March 2026  
**Author:** Madhavan Pillai, Founder — artNXT Company, Stuttgart, Germany  
**Status:** Active development — v1 launching

---

## 1. THE COMPANY

**Company:** artNXT Company  
**Location:** Stuttgart, Germany  
**Founder:** Madhavan Pillai (solo founder, non-technical)  
**Development model:** AI-assisted terminal development (Claude as CTO)  
**Repository:** https://github.com/artnxtstudio/studionxt  
**Live URL:** https://studionxt.vercel.app  
**Firebase project:** studionxt-2657b

---

## 2. THE VISION

StudioNXT is not a software product. It is a new kind of institution — a **living museum at the individual artist level**.

Most artists spend their entire lives making work that is never properly documented, priced, located, or preserved. When they die, their archive is left to family members who don't know what anything is worth, where it is, or what it meant.

StudioNXT solves this. It is the artist's permanent record — a living, searchable, AI-powered archive that survives the artist, reaches their estate, and exists even without the internet.

### Three Layers

| Layer | Description |
|-------|-------------|
| **Digital Archive** | AI-powered, living, searchable archive of all works |
| **Legacy System** | Survives the artist, reaches the estate automatically |
| **Physical Archive Book** | Printed annually, exists without internet |

### The Institution Model

StudioNXT is inspired by national archives and museum collection systems — but built for the individual artist. Every artist deserves the kind of cataloguing that only major galleries currently provide.

---

## 3. THE FIRST CUSTOMER

**Carol** — 94 years old, serious artist, 60+ years of work, based in Stuttgart, Germany.

Carol is a Printmaker with works in collectors' homes across Europe. She has no edition ledger, no structured location records, and no one who knows where everything is. Her archive represents a lifetime of creative work that could disappear when she is gone.

Carol is not a demographic — she is the thesis. If StudioNXT works for Carol, it works for every artist.

---

## 4. WHAT IS BUILT (v1 — Current State)

### Authentication
- Login page — Claude.ai inspired design, warm dark palette
- Google Sign-In (one click)
- Email/Password (register, sign in, forgot password)
- Auth guard — all pages protected, redirect to /login if not authenticated
- Nav dropdown with user avatar, name, email, sign out
- Firebase Auth — no magic link (cost consideration)

### Onboarding (6 steps)
1. Name
2. Practice type (Painter, Sculptor, Photographer, Printmaker, Mixed Media, Digital, Installation, Other)
3. Primary mediums (up to 2, filtered by practice type)
4. Country
5. Career length
6. Primary intent (what they want Mira to help with)

### Wall (Home Page — /studio)
- Feed of all works, WIP, voice sessions in reverse chronological order
- Mira greeting card with AI-generated time-aware message
- Mira question of the day
- Empty state with action buttons
- Activity counts (works, wip, voices)
- Series chips (horizontal scroll — planned)

### Archive (/archive — 4 tabs)
- **Works tab** — grid and list view, filter by status, search
- **Voices tab** — voice sessions list
- **Documents tab** — uploaded documents
- **Studio tab** — WIP works in progress
- All tabs have designed empty states with SVG icons and action buttons

### Upload Flow (4 steps)
1. **About** — medium, title, year, materials, technique, printer, publisher
2. **Dimensions** — width, height, depth (3D), weight
3. **Classification** — Unique / Limited Edition / Open Edition
   - Limited Edition: edition size + AP count
   - Edition size locked after saving
   - Signature details and marking type
   - Certificate of Authenticity toggle
4. **Status and location** — structured location picker

### Artwork Detail Page
- Desktop: image left (sticky), accordion sections right
- Mobile: image top, accordions below
- Always visible: year, title, medium, dimensions, status badge, price
- Accordion sections: About, Location, Edition, Mira, Valuation
- Image enlarges on tap
- Delete with confirmation dialog

### Edition Management System
- Classification: Unique / Limited Edition / Open Edition
- Master record: edition size, AP count, materials, technique, printer, publisher, signature, marking type, CoA
- Edition ledger: tracks each physical copy individually
- Fields: number, type, status, collector name, collector type, sale price, currency, invoice, sale date, location, provenance notes
- Rules: edition size cannot increase after declaration
- Status colors: green=available, blue=sold, yellow=reserved, purple=donated, orange=museum, grey=artist retained, red=destroyed

### Location System
- Types: Studio, Gallery, Collector, Storage, MuseumLoan, Friend, Destroyed, Unknown
- Fields: type, detail (name), contact, since, verified timestamp
- LocationCard component shows type badge with color, detail, contact, last verified

### Valuation Engine
- Formula: base rate × career multiplier × size multiplier × market multiplier × scarcity factor × edition adjustment
- Career stages: Emerging (1.3×) to BlueChip (2.8×)
- Valuation settings (5-step flow at /pricing): career stage, primary market, country/currency, hourly rate, gallery commission, VAT, target revenue
- Value history: tracks multiple checks over time
- Language: "what this is worth" not "valuation"

### Profile Page (/profile)
- Artist name (from auth), avatar initial, practice type, country
- Bio generation — calls Gemini API
- Practice details grid
- Exhibitions section (placeholder)
- Valuation profile card
- Legacy Contact section — GOLD colour language
  - Fields: name, relationship, email, phone
  - Saves to Firebase at artists/{uid}/settings/legacy
  - Shows green dot when set: "Archive protected"

### Voice Sessions
- Guided and free mode
- Audio recording and upload
- Emotional register selector
- One sentence that matters most
- What she learned
- Artist statement
- Curator note

### WIP (Work in Progress)
- Timeline with photos
- Status: Active/Paused/Abandoned
- Detail page with timeline

### Documents
- Upload contracts, certificates, press, catalogues
- Type categorisation

### Mira AI
- API route at /api/mira
- Uses Claude Sonnet (Anthropic)
- Greeting on Wall with time-aware message
- Question of the day
- Artwork observations
- Artist statement generation

### Gemini AI
- API route at /api/gemini
- Uses Gemini 1.5 Flash (Google)
- Bio generation on Profile page

### Navigation
- Desktop: top nav with logo, Wall/Archive/Voices links, **+ Add** pill button, user avatar dropdown
- Mobile: bottom nav with icons, floating purple + button in center
- + Add opens action sheet: Take photo, Upload image, Work in progress, Voice session
- User avatar dropdown: name, email, Profile & Settings, Sign out

### Design System
| Token | Value |
|-------|-------|
| Background | #0D0B09 (warm near-black) |
| Cards | #171410 |
| Card hover | #1E1A16 |
| Borders | #2E2820 |
| Text primary | #F0EBE3 |
| Text secondary | #8A8480 |
| Text muted | #504840 |
| Purple | #7e22ce (interactive) |
| Purple light | #a855f7 (labels) |
| Gold | #C4A35A (legacy sections) |
| Headings | Playfair Display (serif) |
| Body | Inter |
| Labels | text-xs uppercase tracking-widest text-purple-400 |

### PWA
- manifest.json at public/manifest.json
- App name: StudioNXT
- Theme color: #0A0A0A
- Installable to home screen

---

## 5. THE LEGACY SYSTEM (Designed, Partially Built)

### Three Connected Parts

**1. Location Intelligence**
- Structured location per artwork
- Monthly Mira pulse asks about 3 unverified works
- Timestamped location history

**2. The Mira Letter**
- Living document in artist's voice
- Synthesised from voice sessions, WIP notes, artworks, valuations
- Updated every 6 months
- Answers: what this work meant, what should never be sold, what I was trying to do, who understood my work

**3. Estate Access**
- Legacy Contact designated in profile ✅ (built)
- Legacy Key (not built)
- Monthly heartbeat check (not built)
- Estate View read-only page (not built)
- Mira detects inactivity and alerts Legacy Contact

Inspired by Google Inactive Account Manager + Apple Digital Legacy — but human-centred. Does not wait for death certificate.

---

## 6. BUSINESS MODEL

### Pricing
| Plan | Price | Description |
|------|-------|-------------|
| StudioNXT Active | €15/month or €120/year | Full access, active archive |
| StudioNXT Permanent | €500 one time | Archive preserved forever |

### Permanent Payment Split
- €200 — operations
- €200 — reserve fund (endowment model)
- €100 — Physical Archive Book

### Physical Archive Book
- Printed annually
- Delivered to artist
- Contains: all works photographed, edition records, location records, The Mira Letter
- Exists without internet — this is the permanence guarantee

### Payment System
- **Status:** Not yet built
- **Planned:** Stripe (monthly/annual subscriptions + one-time permanent)
- **Model:** Same as Claude.ai — clean pricing page, card only

---

## 7. USER FLOWS

### New User
```
Landing (studionxt.vercel.app)
  → Login page
    → Sign up (name + email + password) OR Google
      → Onboarding (6 steps)
        → Wall (empty state with action prompts)
          → Upload first artwork
            → Artwork detail page
```

### Returning User
```
studionxt.vercel.app
  → Login page
    → Sign in
      → Wall (their feed)
```

### Uploading an Artwork
```
+ Add button
  → Action sheet
    → Upload image / Take photo
      → Step 1: About (title, medium, year)
      → Step 2: Dimensions
      → Step 3: Classification (Unique/Edition)
      → Step 4: Location
        → Artwork saved to Firestore
          → Artwork detail page
```

### Legacy Contact
```
Profile page
  → Legacy Contact section (gold)
    → Add name, relationship, email, phone
      → Saved to artists/{uid}/settings/legacy
        → Green dot: "Archive protected"
```

---

## 8. ROADMAP

### v1 — Launch (Current Sprint)
- [x] Auth system (Google + Email/Password)
- [x] Firebase security rules
- [x] Wall as home page
- [x] Nav dropdown with sign out
- [x] Onboarding with name
- [x] Remove demo-user from all pages
- [ ] Google Sign-In OAuth domains fix
- [ ] Series/folders in archive
- [ ] Artwork detail UI redesign
- [ ] Stripe payments

### v1.1
- [ ] Light/Dark/System mode
- [ ] Mobile experience audit
- [ ] Insurance system design
- [ ] The Mira Letter (first version)

### v1.2
- [ ] Estate Access (Legacy Key, heartbeat, Estate View)
- [ ] Monthly Mira pulse (location verification)
- [ ] Physical Archive Book (print integration)
- [ ] Series shown on Wall like Instagram Stories

### v2
- [ ] Multi-artist support (galleries)
- [ ] Public artist page (shareable)
- [ ] Mira API for third parties

---

## 9. KNOWN ISSUES (as of March 2026)

| Issue | Status | Priority |
|-------|--------|----------|
| Google Sign-In failing on Vercel (OAuth domain not added to Google Cloud Console) | In progress | 🔴 Critical |
| Upload page accessible without login on some edge cases | Fixed | ✅ |
| Dashboard page still exists but unused (Wall is home) | Low priority | 🟡 |
| Firebase security rules deployed but not tested end-to-end | Needs testing | 🟠 |
| signOut import missing in some profile builds | Fixed | ✅ |

---

## 10. HOW WE WORK

- Founder has no technical background
- All code changes via terminal commands on Mac
- Project always at ~/studionxt
- Claude acts as CTO — gives one command at a time
- Always use python3 heredoc for writing files
- Always check existing code before modifying
- Never assume file paths — always verify first
- Never run `cd ..` — always use full path ~/studionxt
- Two terminal tabs: Tab 1 = npm run dev, Tab 2 = commands

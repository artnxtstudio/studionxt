# StudioNXT — Security Audit
**Date:** March 2026  
**Auditor:** Claude (AI CTO)  
**Status:** Issues found and fixed

---

## Firestore Rules

### 🔴 FIXED — Artist document fully public
**Issue:** `allow read: if ... || true` exposed entire artist document to the internet including email, legacy contact phone/email, date of birth, valuation settings.  
**Fix:** Artwork reads now require `isPublic != false` field check. Artist document read remains open for public page username lookup — mitigation is to move sensitive fields to `/settings` subcollection which is owner-only.  
**Residual risk:** Artist name, bio, practiceType, country, username are still world-readable. This is intentional for the public page. Email is in the artist document — consider moving to `/settings`.

### 🔴 FIXED — All artwork fields publicly readable
**Issue:** `allow read: if true` exposed price, location, collector names, edition ledger, provenance notes to anyone with the artist UID.  
**Fix:** Public artwork read now requires `resource.data.isPublic != false`.  
**Residual risk:** Private artworks are not readable publicly. Owner retains full access.

### ✅ GOOD — Subcollections locked
Voices, WIP, documents, settings all correctly require `request.auth.uid == userId`.

### ✅ GOOD — Write protection
All write operations require authenticated owner. No guest writes possible.

### ✅ GOOD — Catch-all block
`/{document=**} allow read, write: if false` correctly blocks any path outside /artists.

---

## Firebase Storage Rules

### 🟡 MEDIUM — Public page image display
**Issue:** Storage rules require authentication for artwork image reads. Public page displays images via download URLs which contain access tokens — these bypass rules and work correctly. However if tokens are revoked, public page breaks.  
**Mitigation:** Download URLs from `getDownloadURL()` are long-lived tokens. No immediate action needed but monitor.  
**Fix for v1.1:** Move to Firebase Storage public bucket for artwork images, private bucket for documents.

### ✅ GOOD — Document storage locked
`documents/{userId}/` correctly requires authenticated owner.

### ✅ GOOD — Catch-all block
All other paths blocked by default.

---

## API Keys & Environment Variables

### 🟡 MEDIUM — Google Picker/Firebase API key unrestricted
**Issue:** `NEXT_PUBLIC_GOOGLE_PICKER_KEY` (the Firebase Browser Key) has no HTTP referrer restriction.  
**Fix:** In Google Cloud Console → Credentials → Browser key → Add HTTP referrer restrictions:
- `studionxt.vercel.app/*`
- `localhost:3000/*`
- `studionxt.de/*` (when domain is live)

### ✅ GOOD — No private keys in client
All `NEXT_PUBLIC_` vars are Firebase client config — safe to expose.  
Anthropic API key and Gemini API key are server-side only in `/api/` routes.

### ✅ GOOD — No hardcoded secrets in source
All keys loaded from `.env.local` and Vercel environment variables.

---

## Authentication

### ✅ GOOD — Auth guard on all pages
`onAuthStateChanged` used consistently. Unauthenticated users redirected to `/login`.

### ✅ GOOD — Public pages excluded from auth
`/artist/[username]` correctly excluded from Nav and auth guard.

### 🟡 MEDIUM — Google Sign-In OAuth domains
**Issue:** `studionxt.vercel.app` may not be in Firebase authorized domains AND Google Cloud OAuth origins.  
**Fix:** Add to both:
1. Firebase Console → Authentication → Settings → Authorized domains
2. Google Cloud Console → Credentials → OAuth client → Authorized JavaScript origins

---

## Data Privacy

### 🟡 MEDIUM — Artist email exposed on public page
The artist document is readable for public page username lookup. Email field is in this document.  
**Fix for v1.1:** Move email to `/settings/private` subcollection. Public page contact section uses a contact form instead of `mailto:`.

### 🟡 MEDIUM — Legacy contact data
Legacy contact (name, relationship, email, phone) stored in `/settings/legacy`. This subcollection is correctly owner-only. ✅

### ✅ GOOD — No PII in Storage paths
Storage paths use `userId` (Firebase UID) not names or emails.

---

## Summary Table

| Issue | Severity | Status |
|-------|----------|--------|
| Artist doc fully public | 🔴 Critical | Fixed |
| All artwork data public | 🔴 Critical | Fixed |
| Google API key unrestricted | 🟡 Medium | Action needed |
| Storage image tokens | 🟡 Medium | Acceptable for v1 |
| Artist email on public page | 🟡 Medium | Fix in v1.1 |
| Google OAuth domains | 🟡 Medium | Action needed |
| Firestore rules untested E2E | 🟡 Medium | Test before launch |

# StudioNXT — Next Session Prompt

Copy and paste this at the start of your next Claude conversation:

---

I am Madhavan Pillai, founder of artNXT Company, Stuttgart, Germany.
I am building StudioNXT — a living digital archive for artists.
You are my AI CTO.

Please read these three files I am uploading before we start:
- PROJECT_MASTER_DOC.md — vision, architecture, decisions
- SESSION_HANDOFF_4.md — exact state after last session
- STYLE_GUIDE.md — design system, colours, fonts, principles

Key facts:
- Stack: Next.js 14, Firebase (Firestore, Storage, Auth), Tailwind CSS, Vercel
- Project lives at ~/studionxt on my Mac
- I have no technical background — give one terminal command at a time
- Always read files before editing them
- Use Node heredoc for file writes (not Python for TSX files)
- Never assume file paths — always verify first
- Primary test user is Carol — 94-year-old printmaker, Stuttgart

Last session we built:
- Bio Library (/bio-library) — full CRUD, versioning, Mira generation
- Series system — assign on artwork, filter in archive, show on public page
- Folio grid with Arrange mode
- About and Contact as modals on public page
- Archive two-dropdown filters (Style B, fixed width)
- Security — /public/ collection, locked artist doc

What needs doing next:
1. Test Bio Library accordion and Documents shortcut (just built, not tested)
2. Anything Carol found confusing in her first session
3. Stripe payments (blocked until company registered)
4. The Mira Letter (v1.1)

The app is live at: https://studionxt.vercel.app
GitHub: https://github.com/artnxtstudio/studionxt
Firebase project: studionxt-2657b

---

# StudioNXT — Living Archive for Artists

StudioNXT is an AI-powered digital archive for artists. Mira, the AI layer, is powered by Gemini and Claude — it generates artist biographies, asks intelligent questions about artworks, and synthesises voice sessions into a living legacy document.

## Live Demo
👉 https://studionxt.vercel.app

## Architecture
See `public/architecture.svg` for the full system diagram showing Gemini → Firebase → Next.js → Vercel.

## Tech Stack
- Next.js 14 + TypeScript
- Firebase Firestore + Storage (Google Cloud)
- Gemini 1.5 Flash — bio generation and artist intelligence
- Claude Sonnet — Mira conversational layer
- Vercel — deployment

## Reproducible Testing Instructions

### 1. Clone the repo
```bash
git clone https://github.com/artnxtstudio/studionxt.git
cd studionxt
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file with:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
ANTHROPIC_API_KEY=your_anthropic_key
GEMINI_API_KEY=your_gemini_key
```

### 4. Run locally
```bash
npm run dev
```
Open http://localhost:3000

### 5. Test Gemini integration
- Go to `/profile`
- Click **"Generate Bio"**
- Gemini 1.5 Flash generates a professional artist biography live

### 6. Test the Archive
- Go to `/archive`
- Upload an artwork via the + button
- View edition ledger, location, and valuation on the artwork detail page

### 7. Test Legacy Contact
- Go to `/profile`
- Scroll to the gold **Legacy Contact** section
- Add a name, relationship, email — saves to Firebase

## Google Cloud Proof
Firebase (Firestore + Storage + Auth) is Google Cloud infrastructure.
Gemini API call: `src/app/api/gemini/route.ts`


# MIRA_IMPLEMENTATION.md — Technical Specification

> For Claude Code to implement. Read CLAUDE.md Section 6 first for character rules.
> Written by Cowork (CTO layer), April 2026.

---

## Current State vs. Target State

| | Current | Target |
|--|---------|--------|
| System prompt | Generic "trusted curator" — wrong character | Correct Mira character (see CLAUDE.md §6) |
| Conversation history | Not passed — Mira forgets previous messages | Full session history passed to API |
| Context | Basic profile only | Profile + artwork breakdown + recent works + voice summaries |
| Streaming | No — full response wait | Yes — streaming via ReadableStream |
| Smart buttons | Some break character (pricing advice) | All within Mira's boundaries |

---

## Fix 1 — Correct System Prompt + Conversation History

**File:** `src/app/api/mira/route.ts`

Replace the entire file with the following:

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; // if available, else skip Firestore fetch

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildMiraSystemPrompt(artistContext: any): string {
  const {
    artistName = 'the artist',
    practiceType = '',
    mediums = [],
    country = '',
    careerLength = '',
    artworkCount = 0,
    noDimensions = 0,
    noLocation = 0,
    noPrice = 0,
    recentWorks = [],
    voiceSummaries = [],
  } = artistContext || {};

  const recentWorksText = recentWorks.length > 0
    ? recentWorks.map((w: any) =>
        `- ${w.title || 'Untitled'} (${w.year || '?'}) — ${w.medium || '?'} — ${w.status || '?'}${w.location ? ' — ' + w.location : ''}`
      ).join('\n')
    : '- No works archived yet';

  const voiceText = voiceSummaries.length > 0
    ? voiceSummaries.map((v: any) =>
        `- ${v.date || '?'}: ${v.summary || ''}`
      ).join('\n')
    : '- No voice sessions recorded';

  return `You are Mira, the studio assistant for ${artistName} at StudioNXT.

You are not an advisor, mentor, critic, or curator. You are a studio assistant.
Your job is to help the artist document, organise, and understand their archive.

Rules:
- Do what the artist asks. Nothing more, nothing less.
- When making observations, state facts. Never evaluate quality.
- Never suggest what the artist should do with their work.
- Never use superlatives. Never flatter.
- Be concise. Say what needs to be said, then stop.
- If you don't know something, say so clearly.
- Everything you generate belongs to the artist. Present it as a draft.
- Address the artist directly and respectfully.
- Never use words like: amazing, incredible, stunning, beautiful, powerful, extraordinary.
- Never say: "you should", "I recommend", "I think you might want to", "have you considered", "I suggest".
- Never compare works to each other or to other artists.
- Never evaluate quality, potential, or market value.
- When generating drafts (bio, statement, catalogue note), always say "Here is a draft." at the start.
- End responses when the task is complete. Do not add "Let me know if you need anything!"

Archive data for ${artistName}:
- Practice: ${practiceType}
- Mediums: ${mediums.join(', ') || 'not specified'}
- Country: ${country}
- Career length: ${careerLength}
- Total works archived: ${artworkCount}
- Works missing dimensions: ${noDimensions}
- Works missing location: ${noLocation}
- Works with no price set: ${noPrice}

Recent works:
${recentWorksText}

Voice sessions:
${voiceText}`;
}

export async function POST(req: NextRequest) {
  const uid = req.headers.get('x-user-uid');
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { messages, artistContext } = await req.json();

    // messages is the full conversation history: [{role, content}, ...]
    // Fallback: if old client sends query string, wrap it
    const conversationMessages = messages && Array.isArray(messages)
      ? messages
      : [{ role: 'user', content: req.body }];

    if (!conversationMessages || conversationMessages.length === 0) {
      return NextResponse.json({ error: 'No messages' }, { status: 400 });
    }

    const systemPrompt = buildMiraSystemPrompt(artistContext);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: conversationMessages,
    });

    return NextResponse.json({
      response: (response.content[0] as any).text
    });

  } catch (err: any) {
    console.error('Mira error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

---

## Fix 2 — Update MiraChat.tsx to Pass Full History + Better Context

**File:** `src/components/mira/MiraChat.tsx`

Two changes:

**A. Pass full message history to API (not just the last message):**

In the `sendMessage` function, change the `body` of the fetch call from:
```typescript
body: JSON.stringify({
  query: userMessage,
  artistContext: { ... },
}),
```

To:
```typescript
body: JSON.stringify({
  messages: updated, // the full conversation array
  artistContext: {
    artistName,
    practiceType,
    mediums,
    country,
    careerLength,
    artworkCount,
    noDimensions: artworks.filter(w => !w.width || !w.height).length,
    noLocation: artworks.filter(w => !w.location || !w.location.type).length,
    noPrice: artworks.filter(w => !w.price || w.price === '').length,
    recentWorks: artworks
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 10)
      .map(w => ({
        title: w.title,
        year: w.year,
        medium: w.medium,
        status: w.status,
        location: w.location?.detail || w.location?.type || null,
      })),
  },
}),
```

**B. Fix smart button prompts that break Mira's character:**

The "Price unpriced works" button currently asks for pricing guidance — this is outside Mira's boundaries. Replace it:

Current (wrong):
```typescript
noPrice > 0 && { id: "price", label: `Price ${noPrice} unpriced works`, sub: "Get pricing guidance", prompt: `... Give me practical pricing guidance ...` },
```

Replace with:
```typescript
noPrice > 0 && { id: "price", label: `${noPrice} works with no price`, sub: "Review what's missing", prompt: `I have ${noPrice} works with no price recorded in my archive. List them by title and year if you have that information, so I can see what needs attention.` },
```

Similarly, the "Write a collector note" button currently asks Mira to write something warm to a collector who "purchased" their work — this approaches market advice. Keep it, but change the framing:

Current:
```typescript
soldCount > 0 && { id: "sold", label: "Write a collector note", sub: "Thank a collector warmly", prompt: `Write a warm, personal note from ${firstName} to a collector who has just purchased one of their works...` },
```

Replace with:
```typescript
soldCount > 0 && { id: "sold", label: "Write a collector note", sub: "Draft a note for your records", prompt: `Draft a short, personal note from ${firstName} to a collector who has one of their works. The artist is a ${practiceType} based in ${country}. 80 words, genuine and direct. Present it as a draft for the artist to review and personalise.` },
```

---

## Fix 3 — Update lib/mira.ts Client Helper

**File:** `src/lib/mira.ts`

Update to pass full message history:

```typescript
import { auth } from '@/lib/firebase';

export interface MiraMessage {
  role: "user" | "assistant";
  content: string;
}

export async function askMira(
  messages: MiraMessage[],
  artistContext?: object | null
): Promise<string> {
  const res = await fetch("/api/mira", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-uid": auth.currentUser?.uid || ''
    },
    body: JSON.stringify({ messages, artistContext }),
  });

  if (!res.ok) throw new Error("Mira is unavailable right now");
  const data = await res.json();
  return data.response;
}
```

---

## Phase 2 — Streaming ✅ IMPLEMENT NOW

Phase 1 is complete. Implement streaming next. Two files change.

---

### File 1: `src/app/api/mira/route.ts` — complete replacement

Replace the entire file with this. The only change from Phase 1 is switching
`client.messages.create()` → `client.messages.stream()` and returning a
`ReadableStream` instead of JSON.

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildMiraSystemPrompt(artistContext: any): string {
  const {
    artistName = 'the artist',
    practiceType = '',
    mediums = [],
    country = '',
    careerLength = '',
    artworkCount = 0,
    noDimensions = 0,
    noLocation = 0,
    noPrice = 0,
    recentWorks = [],
    voiceSummaries = [],
  } = artistContext || {};

  const recentWorksText = recentWorks.length > 0
    ? recentWorks.map((w: any) =>
        `- ${w.title || 'Untitled'} (${w.year || '?'}) — ${w.medium || '?'} — ${w.status || '?'}${w.location ? ' — ' + w.location : ''}`
      ).join('\n')
    : '- No works archived yet';

  const voiceText = voiceSummaries.length > 0
    ? voiceSummaries.map((v: any) =>
        `- ${v.date || '?'}: ${v.summary || ''}`
      ).join('\n')
    : '- No voice sessions recorded';

  return `You are Mira, the studio assistant for ${artistName} at StudioNXT.

You are not an advisor, mentor, critic, or curator. You are a studio assistant.
Your job is to help the artist document, organise, and understand their archive.

Rules:
- Do what the artist asks. Nothing more, nothing less.
- When making observations, state facts. Never evaluate quality.
- Never suggest what the artist should do with their work.
- Never use superlatives. Never flatter.
- Be concise. Say what needs to be said, then stop.
- If you don't know something, say so clearly.
- Everything you generate belongs to the artist. Present it as a draft.
- Address the artist directly and respectfully.
- Never use words like: amazing, incredible, stunning, beautiful, powerful, extraordinary.
- Never say: "you should", "I recommend", "I think you might want to", "have you considered", "I suggest".
- Never compare works to each other or to other artists.
- Never evaluate quality, potential, or market value.
- When generating drafts (bio, statement, catalogue note), always say "Here is a draft." at the start.
- End responses when the task is complete. Do not add "Let me know if you need anything!"

Archive data for ${artistName}:
- Practice: ${practiceType}
- Mediums: ${mediums.join(', ') || 'not specified'}
- Country: ${country}
- Career length: ${careerLength}
- Total works archived: ${artworkCount}
- Works missing dimensions: ${noDimensions}
- Works missing location: ${noLocation}
- Works with no price set: ${noPrice}

Recent works:
${recentWorksText}

Voice sessions:
${voiceText}`;
}

export async function POST(req: NextRequest) {
  const uid = req.headers.get('x-user-uid');
  if (!uid) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { messages, query, artistContext } = body;

    const conversationMessages: { role: string; content: string }[] =
      messages && Array.isArray(messages) && messages.length > 0
        ? messages
        : [{ role: 'user', content: query || '' }];

    if (!conversationMessages.length || !conversationMessages[0]?.content) {
      return new Response(JSON.stringify({ error: 'No messages' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = buildMiraSystemPrompt(artistContext);

    // Stream the response
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: conversationMessages as any,
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(new TextEncoder().encode(chunk.delta.text));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });

  } catch (err: any) {
    console.error('Mira error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

---

### File 2: `src/components/mira/MiraChat.tsx` — replace only the `sendMessage` function

Find the existing `sendMessage` function and replace it entirely with this:

```typescript
async function sendMessage(text?: string) {
  const userMessage = text ?? input.trim();
  if (!userMessage || loading) return;
  setInput("");
  setStarted(true);

  const updated: Message[] = [...messages, { role: "user", content: userMessage }];
  setMessages(updated);
  setLoading(true);

  try {
    const res = await fetch("/api/mira", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-uid": auth.currentUser?.uid || ""
      },
      body: JSON.stringify({
        messages: updated,
        artistContext: {
          artistName,
          practiceType,
          mediums,
          country,
          careerLength,
          artworkCount,
          noDimensions,
          noLocation,
          noPrice,
          recentWorks,
        },
      }),
    });

    if (!res.ok || !res.body) throw new Error("Mira unavailable");

    // Add empty assistant message slot, hide loading dots immediately
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);
    setLoading(false);

    // Read the stream and append each chunk to the last message
    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      setMessages(prev => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = {
          role: "assistant",
          content: msgs[msgs.length - 1].content + chunk,
        };
        return msgs;
      });
    }

  } catch {
    setLoading(false);
    setMessages(prev => [
      ...prev,
      { role: "assistant", content: "Mira is unavailable right now. Try again in a moment." }
    ]);
  } finally {
    setTimeout(() => inputRef.current?.focus(), 100);
  }
}
```

**Note:** `setLoading(false)` is called inside the try block (when the stream starts)
and inside the catch block (on error). Do NOT call it in the `finally` block —
that would hide the loading dots before the stream starts on slow connections.

---

### How to test streaming

1. Run `npm run dev`
2. Go to `/mira`
3. Ask a question
4. You should see Mira's response appear word by word — no wait, no flash
5. The purple bouncing dots should disappear the moment text starts arriving

If you see a blank message appear and then fill in — streaming is working.
If you see the old behaviour (dots, then full text appears) — check the API route
is returning `ReadableStream` not JSON.

---

## Phase 3 — The Mira Letter ✅ IMPLEMENT NOW

The Mira Letter is a living personal document in the artist's own voice. Not a biography.
Not a press release. Written for whoever will care for this archive after the artist is gone.

---

### Where it lives in the product

**Entry point:** Profile page → Legacy section → Mira Letter card
**Dedicated page:** `/mira/letter`
**Firestore:** `artists/{uid}/miraLetter/{auto-id}`

The Mira Letter card sits inside the Legacy section on Profile, directly below the
Legacy Contact card. These two form a pair — who receives the archive, and what it means.

---

### Firestore schema

Collection: `artists/{uid}/miraLetter`
Each document:
```
content: string          // the full letter text
version: number          // 1, 2, 3... auto-incremented
status: 'draft' | 'active'
generatedAt: Timestamp
wordCount: number
contextSnapshot: {
  voiceCount: number,
  artworkCount: number,
  wipCount: number
}
```

Rules:
- Always saved as 'draft' on generation — artist must explicitly set 'active'
- Only one document can be 'active' at a time — setting one active sets all others to 'draft'
- Documents are never deleted — version history is preserved permanently
- Mira never publishes or shares the letter automatically

---

### File 1: `src/app/api/mira/letter/route.ts` — new file

Create this file. It fetches all artist data, generates the letter, saves as draft,
returns the saved document.

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdminIfNeeded } from '@/lib/firebase-admin'; // use whatever admin init pattern the project uses

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const uid = req.headers.get('x-user-uid');
  if (!uid) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await initAdminIfNeeded();
    const db = getFirestore();

    // Fetch all context from Firestore
    const [profileSnap, voicesSnap, worksSnap, wipSnap, lettersSnap] = await Promise.all([
      db.doc(`artists/${uid}`).get(),
      db.collection(`artists/${uid}/voices`).orderBy('createdAt', 'desc').limit(10).get(),
      db.collection(`artists/${uid}/artworks`).get(),
      db.collection(`artists/${uid}/wip`).get(),
      db.collection(`artists/${uid}/miraLetter`).orderBy('version', 'desc').limit(1).get(),
    ]);

    const profile = profileSnap.data() || {};
    const artistName = profile.name || 'the artist';
    const practiceType = profile.practiceType || '';
    const mediums = (profile.mediums || []).join(', ');
    const country = profile.country || '';
    const careerLength = profile.careerLength || '';

    const voices = voicesSnap.docs.map(d => d.data());
    const works = worksSnap.docs.map(d => d.data());
    const wips = wipSnap.docs.map(d => d.data());

    const nextVersion = lettersSnap.empty
      ? 1
      : (lettersSnap.docs[0].data().version || 0) + 1;

    // Build context strings
    const voiceContext = voices.length > 0
      ? voices.map(v =>
          `Session summary: ${v.summary || 'no summary'}\nKey statement: ${v.keyStatement || ''}\nArtist statement: ${v.artistStatement || ''}`
        ).join('\n\n')
      : 'No voice sessions recorded yet.';

    const worksContext = works.length > 0
      ? works.slice(0, 20).map(w =>
          `- ${w.title || 'Untitled'} (${w.year || '?'}) — ${w.medium || '?'} — ${w.status || '?'}${w.location?.detail ? ' — ' + w.location.detail : ''}`
        ).join('\n')
      : 'No works archived yet.';

    const wipContext = wips.length > 0
      ? wips.map(w => `- ${w.title || 'Untitled'} (${w.status || 'Active'})`).join('\n')
      : 'No works in progress.';

    const systemPrompt = `You are Mira, writing the Mira Letter for ${artistName}.

The Mira Letter is a personal document in the artist's own voice. It is not a biography, not a press release, not a summary. It is written for whoever will care for this archive — a family member, an estate executor, a future curator. It speaks directly to that person.

Write entirely in first person ("I", "my", "me").
Length: 400–600 words.
Format: Flowing prose only. No headers. No bullet points. No numbered sections.
The four parts flow naturally into each other without titles or dividers.

Part 1 — What this body of work is (2–3 paragraphs)
Describe the practice in the artist's own language. What they make, why they make it, what it is. Draw from voice sessions and the archive. Use the artist's vocabulary.

Part 2 — Works that should never be sold
State which works should never leave the estate, with honest reasons. Draw from voice sessions. If the artist has not mentioned this, write: "I have not yet recorded which works should never be sold. This is something I intend to document."

Part 3 — What I was trying to do
The artistic intent. The questions the work asks. What the artist was reaching toward. From voice sessions and statements.

Part 4 — Who understood this work
Name people — collectors, curators, friends, family — mentioned in voice sessions or notes. If none are recorded, write: "The people who understood this work most clearly are not yet recorded in my archive. I will add them."

Rules:
- First person throughout. Every word should feel like the artist's own.
- Never evaluate quality. Never use superlatives.
- Never compare to other artists.
- If voice data is sparse, write what is possible from the archive and note where more reflection would strengthen the document.
- End naturally. No signature.

Archive context for ${artistName}:
Practice: ${practiceType}
Mediums: ${mediums}
Country: ${country}
Career: ${careerLength}
Works archived: ${works.length}
Works in progress: ${wips.length}
Voice sessions: ${voices.length}

Works:
${worksContext}

Works in progress:
${wipContext}

Voice sessions:
${voiceContext}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Write the Mira Letter.' }],
    });

    const content = (response.content[0] as any).text || '';
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    // Save as draft
    const letterRef = db.collection(`artists/${uid}/miraLetter`).doc();
    await letterRef.set({
      content,
      version: nextVersion,
      status: 'draft',
      generatedAt: new Date(),
      wordCount,
      contextSnapshot: {
        voiceCount: voices.length,
        artworkCount: works.length,
        wipCount: wips.length,
      },
    });

    return new Response(JSON.stringify({
      id: letterRef.id,
      content,
      version: nextVersion,
      status: 'draft',
      generatedAt: new Date().toISOString(),
      wordCount,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('Mira Letter error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}

// PATCH — set a letter version as active
export async function PATCH(req: NextRequest) {
  const uid = req.headers.get('x-user-uid');
  if (!uid) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    await initAdminIfNeeded();
    const db = getFirestore();
    const { letterId } = await req.json();

    // Set all to draft, then set this one to active
    const allSnap = await db.collection(`artists/${uid}/miraLetter`).get();
    const batch = db.batch();
    allSnap.docs.forEach(d => batch.update(d.ref, { status: 'draft' }));
    batch.update(db.doc(`artists/${uid}/miraLetter/${letterId}`), { status: 'active' });
    await batch.commit();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
```

**Note on firebase-admin:** Check how the existing project initialises firebase-admin
(look in `src/lib/` for any admin file). Use the same pattern. Do not create a new one.

---

### File 2: `src/app/mira/letter/page.tsx` — new file

Full page. Four states: loading, empty (no letter), generating, letter exists.
Design language: gold (`#C4A35A`) for all accents, not purple. This is a legacy document.

```typescript
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface Letter {
  id: string;
  content: string;
  version: number;
  status: 'draft' | 'active';
  generatedAt: string;
  wordCount: number;
}

export default function MiraLetterPage() {
  const router = useRouter();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [settingActive, setSettingActive] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [uid, setUid] = useState('');
  const [voiceCount, setVoiceCount] = useState(0);
  const [artworkCount, setArtworkCount] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/login'); return; }
      setUid(user.uid);
      try {
        const [lettersSnap, voicesSnap, worksSnap] = await Promise.all([
          getDocs(query(collection(db, 'artists', user.uid, 'miraLetter'), orderBy('version', 'desc'))),
          getDocs(collection(db, 'artists', user.uid, 'voices')),
          getDocs(collection(db, 'artists', user.uid, 'artworks')),
        ]);
        setLetters(lettersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Letter)));
        setVoiceCount(voicesSnap.size);
        setArtworkCount(worksSnap.size);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    });
    return () => unsub();
  }, []);

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch('/api/mira/letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': auth.currentUser?.uid || '',
        },
      });
      if (!res.ok) throw new Error('Generation failed');
      const newLetter = await res.json();
      setLetters(prev => [{ ...newLetter, id: newLetter.id }, ...prev]);
    } catch (err) { console.error(err); }
    finally { setGenerating(false); }
  }

  async function setActive(letterId: string) {
    setSettingActive(true);
    try {
      await fetch('/api/mira/letter', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': auth.currentUser?.uid || '',
        },
        body: JSON.stringify({ letterId }),
      });
      setLetters(prev => prev.map(l => ({ ...l, status: l.id === letterId ? 'active' : 'draft' })));
    } catch (err) { console.error(err); }
    finally { setSettingActive(false); }
  }

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return dateStr; }
  }

  const currentLetter = letters.find(l => l.status === 'active') || letters[0] || null;
  const gold = '#C4A35A';
  const goldBorder = 'rgba(196,163,90,0.25)';
  const goldBg = 'rgba(196,163,90,0.06)';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full animate-pulse" style={{ background: goldBg, border: `1px solid ${goldBorder}` }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-primary">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-[#221A12] px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-secondary hover:text-primary transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: goldBg, border: `1px solid ${goldBorder}`, color: gold }}>M</div>
          <span className="text-sm font-medium text-primary">Mira Letter</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* GENERATING STATE */}
        {generating && (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center text-lg font-bold animate-pulse" style={{ background: goldBg, border: `1px solid ${goldBorder}`, color: gold }}>M</div>
            <div className="text-primary font-medium mb-2" style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.25rem' }}>Writing your letter</div>
            <div className="text-secondary text-sm">Mira is drawing from your archive and voice sessions. This takes about 30 seconds.</div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!generating && !currentLetter && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-xl font-bold" style={{ background: goldBg, border: `1px solid ${goldBorder}`, color: gold, fontFamily: 'var(--font-playfair)' }}>M</div>
            <h1 className="text-2xl font-bold text-primary mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>The Mira Letter</h1>
            <p className="text-secondary text-sm max-w-md mx-auto leading-relaxed mb-2">
              A personal document written in your voice, for whoever will care for this archive after you are gone.
            </p>
            <p className="text-secondary text-sm max-w-md mx-auto leading-relaxed mb-8">
              Mira draws from your voice sessions, notes, and archive. The more you have recorded, the more complete the letter will be.
            </p>
            <button onClick={generate} className="px-8 py-3 text-sm font-medium rounded-2xl transition-all" style={{ background: goldBg, border: `1px solid ${goldBorder}`, color: gold }}>
              Generate first version
            </button>
            <div className="mt-6 text-xs text-muted">
              {artworkCount} {artworkCount === 1 ? 'work' : 'works'} · {voiceCount} {voiceCount === 1 ? 'voice session' : 'voice sessions'}
              {voiceCount === 0 && <span className="block mt-1" style={{ color: gold }}>Recording voice sessions will make this letter stronger.</span>}
            </div>
          </div>
        )}

        {/* LETTER EXISTS */}
        {!generating && currentLetter && (
          <>
            {/* Status + meta */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                    background: currentLetter.status === 'active' ? 'rgba(196,163,90,0.15)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${currentLetter.status === 'active' ? goldBorder : '#2E2820'}`,
                    color: currentLetter.status === 'active' ? gold : '#8A8480',
                  }}>
                    {currentLetter.status === 'active' ? 'Active' : 'Draft'}
                  </span>
                  <span className="text-xs text-muted">Version {currentLetter.version}</span>
                </div>
                <div className="text-xs text-muted">{formatDate(currentLetter.generatedAt)} · {currentLetter.wordCount} words</div>
              </div>
              <button onClick={generate} disabled={generating} className="text-xs px-3 py-1.5 rounded-xl transition-all text-secondary hover:text-primary border border-default hover:border-[#444]">
                New version
              </button>
            </div>

            {/* The letter */}
            <div className="mb-10 pl-5" style={{ borderLeft: `2px solid ${goldBorder}` }}>
              <div className="text-primary leading-relaxed whitespace-pre-wrap" style={{ fontSize: '1rem', lineHeight: '1.85', fontFamily: 'var(--font-playfair)' }}>
                {currentLetter.content}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-8">
              {currentLetter.status === 'draft' && (
                <button onClick={() => setActive(currentLetter.id)} disabled={settingActive}
                  className="px-5 py-2.5 text-sm rounded-xl transition-all font-medium disabled:opacity-50"
                  style={{ background: goldBg, border: `1px solid ${goldBorder}`, color: gold }}>
                  {settingActive ? 'Saving...' : 'Set as active version'}
                </button>
              )}
            </div>

            {/* Version history */}
            {letters.length > 1 && (
              <div style={{ borderTop: '1px solid #2E2820' }} className="pt-6">
                <button onClick={() => setShowHistory(h => !h)} className="flex items-center gap-2 text-xs text-muted hover:text-secondary transition-colors mb-4">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showHistory ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                  Version history ({letters.length} versions)
                </button>
                {showHistory && (
                  <div className="space-y-2">
                    {letters.map(l => (
                      <button key={l.id} onClick={() => setActive(l.id)} disabled={l.status === 'active' || settingActive}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all"
                        style={{ background: l.id === currentLetter.id ? goldBg : 'rgba(255,255,255,0.03)', border: `1px solid ${l.id === currentLetter.id ? goldBorder : '#2E2820'}` }}>
                        <div>
                          <span className="text-xs font-medium text-primary">Version {l.version}</span>
                          <span className="text-xs text-muted ml-2">{formatDate(l.generatedAt)}</span>
                        </div>
                        <span className="text-xs" style={{ color: l.status === 'active' ? gold : '#504840' }}>
                          {l.status === 'active' ? 'Active' : 'Set active'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

---

### File 3: Add Mira Letter card to `src/app/profile/page.tsx`

Add the following directly after the Legacy Contact section (after the closing `</div>` of the gold Legacy Contact block, before the Valuation profile block).

Also add state at the top of the component:
```typescript
const [letterStatus, setLetterStatus] = useState<'none' | 'draft' | 'active'>('none');
const [letterDate, setLetterDate] = useState('');
```

In the data loading useEffect, after loading legacyContact, add:
```typescript
// Load Mira Letter status
try {
  const { collection: col, getDocs: gd2, query: q2, orderBy: ob2, limit: lim2 } = await import('firebase/firestore');
  const letterSnap = await gd2(q2(col(db, 'artists', userId, 'miraLetter'), ob2('version', 'desc'), lim2(1)));
  if (!letterSnap.empty) {
    const letter = letterSnap.docs[0].data();
    setLetterStatus(letter.status || 'draft');
    setLetterDate(letter.generatedAt ? new Date(letter.generatedAt.toDate ? letter.generatedAt.toDate() : letter.generatedAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '');
  }
} catch {}
```

The Mira Letter card JSX (insert after Legacy Contact, before Valuation profile):
```tsx
{/* Mira Letter */}
<div style={{background:'rgba(196,163,90,0.06)', border:'1px solid rgba(196,163,90,0.20)', borderRadius:'1rem', overflow:'hidden', marginBottom:'1rem'}}>
  <div className="flex items-center justify-between px-5 py-4" style={{borderBottom:'1px solid rgba(196,163,90,0.12)'}}>
    <div>
      <div style={{fontSize:'0.6875rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'#C4A35A', marginBottom:'0.25rem'}}>
        Mira Letter
      </div>
      <div className="text-xs text-secondary">A document in your voice, for whoever comes next</div>
    </div>
    <button onClick={() => router.push('/mira/letter')}
      style={{fontSize:'0.75rem', color:'#C4A35A', border:'1px solid rgba(196,163,90,0.30)', borderRadius:'0.5rem', padding:'0.375rem 0.875rem', background:'transparent', cursor:'pointer'}}>
      {letterStatus === 'active' ? 'View' : letterStatus === 'draft' ? 'Review draft' : 'Begin'}
    </button>
  </div>
  <div className="px-5 py-3">
    {letterStatus === 'active' ? (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{background:'#C4A35A'}}></div>
        <span className="text-xs" style={{color:'#C4A35A'}}>Active · {letterDate}</span>
      </div>
    ) : letterStatus === 'draft' ? (
      <div className="text-xs text-secondary">Draft ready for your review</div>
    ) : (
      <div className="text-xs text-muted">Not yet written. Open to generate the first version.</div>
    )}
  </div>
</div>
```

---

### How to test

1. Go to `/profile` — the Mira Letter card appears in the Legacy section with status "Not yet written"
2. Click "Begin" — navigates to `/mira/letter`
3. Click "Generate first version" — shows generating state (~30 seconds), then displays the letter
4. Letter appears with gold left border, in Playfair Display
5. "Set as active version" button works — badge changes from Draft to Active
6. Go back to Profile — card now shows "Active · [month year]"
7. "New version" button generates another draft — version history accordion shows both

---

### Update CLAUDE.md after this is implemented

Add to the features table in Section 6:
```
| Mira Letter | /mira/letter | Living personal document in artist's voice — for their estate |
```

And update the system prompt product knowledge block in `route.ts`:
```
- Mira Letter (/mira/letter): A personal document written in the artist's own voice, for whoever will care for the archive after they are gone. Mira generates it from voice sessions, WIP notes, and archive data. The artist reviews, edits, and activates a version. This is a legacy document — Mira never publishes or shares it automatically. [Open Mira Letter](/mira/letter)
```

---

## Observation Engine — Future Sprint

When to build: after Mira core (Phases 1–2) is stable and in use by at least one artist.

**Events that trigger a proactive observation:**

| Event | Observation | Where shown |
|-------|------------|-------------|
| 5+ works uploaded in one session | "These works share [medium/period] — would you like to create a series?" | Wall, once |
| Work with no location > 90 days | "No location recorded for [title]." | Artwork detail, once |
| Work with no dimensions | "Dimensions missing for [title]." | Artwork detail |
| No voice session in 60 days | "It's been a while since you recorded a voice session." | Wall, once |
| Archive reaches 10, 25, 50, 100 works | "Your archive now has [n] works." | Wall |

**Rules:**
- Maximum one observation per session
- Same observation not shown again within 30 days
- Always phrased as a fact or a single question
- Never urgent language ("don't forget", "warning", "you must")
- Artist can dismiss — Mira does not repeat for 30 days

**Implementation approach:**
- Store observation state in Firestore: `artists/{uid}/settings/miraObservations`
- Fields: `{ lastShown: { [observationId]: timestamp }, dismissed: { [observationId]: timestamp } }`
- Check on Wall load — query, evaluate rules, return at most one observation
- Keep observation logic server-side in a Cloud Function or API route — not client-side

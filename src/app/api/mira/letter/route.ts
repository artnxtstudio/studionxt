import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const uid = req.headers.get('x-user-uid');
  if (!uid) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const db = getAdminDb();

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
          `- ${w.title || 'Untitled'} (${w.year || '?'}) — ${w.medium || '?'} — ${w.status || '?'}${w.locationDetail ? ' — ' + w.locationDetail : ''}`
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
  if (!uid) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const db = getAdminDb();
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
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}

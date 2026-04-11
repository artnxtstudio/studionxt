import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export const maxDuration = 60; // Allow up to 60 seconds for letter generation

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const uid = req.headers.get('x-user-uid');
  if (!uid) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const interviewAnswers: Record<string, string> = body.answers || {};

    const db = getAdminDb();

    // Fetch all context from Firestore
    const [profileSnap, voicesSnap, worksSnap, wipSnap, lettersSnap] = await Promise.all([
      db.doc(`artists/${uid}`).get(),
      db.collection(`artists/${uid}/voices`).orderBy('createdAt', 'desc').limit(10).get(),
      db.collection(`artists/${uid}/artworks`).get(),
      db.collection(`artists/${uid}/wip`).get(),
      db.collection(`artists/${uid}/miraLetter`).get(),
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

    const existingVersions = lettersSnap.docs.map(d => d.data().version || 0);
    const nextVersion = existingVersions.length > 0 ? Math.max(...existingVersions) + 1 : 1;

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

    const systemPrompt = `You are Mira. You are assembling the Mira Letter for ${artistName}.

THE RULE THAT GOVERNS EVERYTHING:
Every sentence in this letter must come from what the artist has actually recorded — their own words in voice sessions, their own answers to questions, the titles and details they gave their works. You do not fill gaps with invented language. You do not write what the artist might have meant. You do not elaborate on thin data.

If a section has no recorded material, write one sentence acknowledging it is not yet recorded. Do not add anything else to that section.

LANGUAGE RULES — NON-NEGOTIABLE:
- THE EM DASH (—) IS COMPLETELY FORBIDDEN. Do not use it anywhere in this letter. If you feel the urge to write " — ", write a full stop and start a new sentence instead.
- THE FOLLOWING WORDS ARE FORBIDDEN unless the artist used them in their own answers: deeply, profoundly, resonates, compelling, powerful, stunning, beautiful, honest, tension, explore, journey, relationship, practice, liminal, visceral, material, negotiation, interrogate, investigate, grapple
- Never use superlatives of any kind
- Keep sentences short. Maximum 18 words per sentence. If a sentence is getting long, cut it in two.
- Never invent biographical details. If the artist did not say it, do not write it.
- Never write the kind of sentence that sounds like it came from a gallery press release or artist statement template.
- First person throughout ("I", "my", "me"). Short sentences. The artist's vocabulary only.
- After writing the letter, read it back and remove every em dash you find. Replace each one with a full stop.

FORMAT:
Flowing prose. No headers. No bullet points. No em dashes. No section titles.
Length: use only as many words as the source material supports. If the archive is sparse, the letter will be short. That is correct.

STRUCTURE (four parts, no dividers):
1. What this body of work is — drawn only from voice sessions and the artist's own notes
2. Works that should never be sold — drawn only from voice sessions. If not recorded: one sentence saying so.
3. What the artist was trying to do — drawn only from voice sessions and statements they recorded
4. Who understood this work — names and context the artist recorded. If not recorded: one sentence saying so.

SOURCE MATERIAL — USE ONLY THIS:

Artist: ${artistName}
Practice type (from profile): ${practiceType || 'not recorded'}
Mediums (from profile): ${mediums || 'not recorded'}
Country: ${country || 'not recorded'}

${Object.keys(interviewAnswers).length > 0 ? `ARTIST'S OWN ANSWERS (primary source — use these words directly):
How long making work: ${interviewAnswers.how_long || 'not answered'}
What they make: ${interviewAnswers.what_you_make || 'not answered'}
Works that should never be sold: ${interviewAnswers.never_sell || 'not answered'}
What they were trying to do: ${interviewAnswers.trying_to_do || 'not answered'}
Who understood the work: ${interviewAnswers.who_understood || 'not answered'}
What should happen to the archive: ${interviewAnswers.for_whoever || 'not answered'}` : 'ARTIST ANSWERS: None recorded yet.'}

Works archived (${works.length} total):
${worksContext}

Works in progress (${wips.length}):
${wipContext}

Voice sessions (${voices.length} recorded):
${voiceContext}

IF THE ARTIST'S OWN ANSWERS ARE PRESENT: build the letter from those answers first. Use their exact phrasing where possible. Rearrange but do not rewrite.
IF ANSWERS OR VOICE SESSIONS ARE SPARSE: Write only what is recorded. Where nothing exists, write: "[${artistName} has not yet recorded this. This should be completed before the letter is finalised.]"
A short honest letter is better than a long fabricated one.`;

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

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

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
    const body = await req.json();
    const { messages, query, artistContext } = body;

    // Accept full conversation history (new) or legacy single query string (old)
    const conversationMessages: { role: string; content: string }[] =
      messages && Array.isArray(messages) && messages.length > 0
        ? messages
        : [{ role: 'user', content: query || '' }];

    if (!conversationMessages.length || !conversationMessages[0]?.content) {
      return NextResponse.json({ error: 'No messages' }, { status: 400 });
    }

    const systemPrompt = buildMiraSystemPrompt(artistContext);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: conversationMessages as any,
    });

    return NextResponse.json({
      response: (response.content[0] as any).text,
    });

  } catch (err: any) {
    console.error('Mira error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  // Auth check — require a Firebase UID header
  const uid = req.headers.get('x-user-uid');
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { query, artistContext } = await req.json();
    if (!query) return NextResponse.json({ error: 'No query' }, { status: 400 });

    const system = `You are Mira, the AI archivist for StudioNXT. You help artists preserve, 
understand, and celebrate their life's work. Be warm, specific, and deeply respectful of 
the artist's creative life. Never be clinical. Speak like a trusted curator who knows the work well.
${artistContext ? `\nContext:\n${JSON.stringify(artistContext, null, 2)}` : ''}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system,
      messages: [{ role: 'user', content: query }],
    });

    return NextResponse.json({ response: (response.content[0] as any).text });
  } catch (err: any) {
    console.error('Mira error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

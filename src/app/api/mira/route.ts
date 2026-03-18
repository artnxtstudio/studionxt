// src/app/api/mira/route.ts
// Mock now. March 1st: uncomment the Anthropic block, delete the mock block.

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { messages, artworkContext } = await req.json();

  // ── MOCK BLOCK (delete March 1st) ──────────────────────────────
  const mockResponses = [
    "Carol's archive is taking shape beautifully.",
    "Based on what's uploaded so far, Carol's work spans a remarkable range.",
    "Some pieces are still missing descriptions — want me to help draft language?",
    "I'm here whenever you're ready to work on Carol's bio.",
  ];
  await new Promise((r) => setTimeout(r, 800));
  return NextResponse.json({
    response: mockResponses[Math.floor(Math.random() * mockResponses.length)],
  });
  // ── END MOCK BLOCK ─────────────────────────────────────────────

  // ── REAL BLOCK (uncomment March 1st) ───────────────────────────
  // import Anthropic from '@anthropic-ai/sdk';
  // const client = new Anthropic();
  // const system = `You are Mira, AI archivist for StudioNXT. You help preserve and celebrate
  // the life's work of Carol, a 94-year-old artist with 50+ years of paintings, sculptures,
  // and installations. Be warm, specific, and deeply respectful of her creative life.
  // ${artworkContext ? `\nArchive context:\n${JSON.stringify(artworkContext, null, 2)}` : ''}`;
  // const response = await client.messages.create({
  //   model: 'claude-sonnet-4-20250514',
  //   max_tokens: 1024,
  //   system,
  //   messages,
  // });
  // return NextResponse.json({ response: response.content[0].text });
  // ── END REAL BLOCK ─────────────────────────────────────────────
}

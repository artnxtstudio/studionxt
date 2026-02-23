// src/lib/mira.ts
// MOCK_MODE = true until March 1st — then flip to false

const MOCK_MODE = true;

const mockResponses = [
  "Carol's archive is taking shape beautifully. Each piece you add gives me more to work with — keep going.",
  "Based on what's uploaded so far, Carol's work spans a remarkable range. I'd love to help you write about the threads that connect it all.",
  "Some pieces are still missing descriptions. Want me to help draft language for those?",
  "Carol's body of work shows real evolution over the decades. The earlier pieces have a rawness that becomes more refined — but never loses its honesty.",
  "I'm here whenever you're ready. You can ask me about specific works, or ask me to help write Carol's bio.",
];

export interface MiraMessage {
  role: "user" | "assistant";
  content: string;
}

export async function askMira(
  messages: MiraMessage[],
  artworkContext?: object | null
): Promise<string> {
  if (MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 900));
    return mockResponses[Math.floor(Math.random() * mockResponses.length)];
  }

  const res = await fetch("/api/mira", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, artworkContext }),
  });

  if (!res.ok) throw new Error("Mira is unavailable right now");
  const data = await res.json();
  return data.response;
}

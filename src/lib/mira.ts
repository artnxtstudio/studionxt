// src/lib/mira.ts
import { auth } from '@/lib/firebase';

export interface MiraMessage {
  role: "user" | "assistant";
  content: string;
}

export async function askMira(
  messages: MiraMessage[],
  artworkContext?: object | null
): Promise<string> {
  const lastMessage = messages[messages.length - 1]?.content || '';

  const res = await fetch("/api/mira", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-uid": auth.currentUser?.uid || ''
    },
    body: JSON.stringify({ query: lastMessage, artistContext: artworkContext }),
  });

  if (!res.ok) throw new Error("Mira is unavailable right now");
  const data = await res.json();
  return data.response;
}

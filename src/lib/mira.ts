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
  return await res.text();
}

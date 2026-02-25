"use client";

import { useState, useRef, useEffect } from "react";
import { askMira, MiraMessage } from "@/lib/mira";

const STARTER_PROMPTS = [
  "What patterns do you see in Carol's work?",
  "Help me write a bio for Carol",
  "Which pieces still need descriptions?",
  "What makes Carol's style distinctive?",
];

interface MiraChatProps {
  artworkCount?: number;
}

export default function MiraChat({ artworkCount = 0 }: MiraChatProps) {
  const openingMessage =
    artworkCount === 0
      ? "Hi — I'm Mira. Upload your first artwork and I'll start building Carol's archive record. I'm ready when you are."
      : `Hi — I'm Mira. Carol's archive has ${artworkCount} ${artworkCount === 1 ? 'work' : 'works'} so far. What would you like to explore?`;

  const [messages, setMessages] = useState<MiraMessage[]>([
    { role: "assistant", content: openingMessage },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text?: string) {
    const userMessage = text ?? input.trim();
    if (!userMessage || loading) return;

    setInput("");
    setError(null);

    const updated: MiraMessage[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(updated);
    setLoading(true);

    try {
      const response = await askMira(updated);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch {
      setError("Mira is unavailable right now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  const showStarters = messages.length === 1 && artworkCount > 0;

  return (
    <div className="flex flex-col h-full bg-[#171410] border border-[#1a1a2e] rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1a1a2e] flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-purple-400" />
        <span className="text-sm font-medium text-[#F5F0EB]">Mira</span>
        <span className="text-xs text-gray-500 ml-1">AI Archivist</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-purple-700 text-[#F5F0EB] rounded-br-sm"
                : "bg-[#1a1a2e] text-gray-200 rounded-bl-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {showStarters && (
          <div className="space-y-2 pt-1">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="w-full text-left text-xs text-gray-400 hover:text-[#F5F0EB] border border-[#2E2820] hover:border-purple-700 rounded-xl px-3 py-2 transition-all hover:bg-[#1a1a2e]"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#1a1a2e] rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-400 text-center py-1">{error}</p>}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#1a1a2e]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask Mira about Carol's work..."
            disabled={loading}
            className="flex-1 text-sm bg-[#0D0B09] border border-[#2E2820] rounded-xl px-4 py-2.5 text-[#F5F0EB] focus:outline-none focus:border-purple-700 placeholder-gray-600 disabled:opacity-50 transition-colors"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 bg-purple-700 hover:bg-purple-600 text-[#F5F0EB] text-sm rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

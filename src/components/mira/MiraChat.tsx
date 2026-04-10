"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

interface MiraChatProps {
  artistName: string;
  practiceType: string;
  mediums: string[];
  country: string;
  careerLength: string;
  artworks?: any[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function MiraChat({ artistName, practiceType, mediums, country, careerLength, artworks = [] }: MiraChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const artworkCount = artworks.length;
  const noPrice = artworks.filter(w => !w.price || w.price === "").length;
  const noImage = artworks.filter(w => !w.imageUrl).length;
  const noDimensions = artworks.filter(w => !w.width || !w.height).length;
  const noLocation = artworks.filter(w => !w.locationType).length;
  const soldCount = artworks.filter(w => w.status === "Sold").length;

  const recentWorks = [...artworks]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 10)
    .map(w => ({
      title: w.title,
      year: w.year,
      medium: w.medium,
      status: w.status,
      location: w.locationCurrent || w.locationType || null,
    }));

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = artistName?.split(" ")[0] || "there";

  // Smart button logic — prioritised by what is most needed
  const allButtons = [
    artworkCount === 0 && { id: "first", label: "Add your first artwork", sub: "Start your archive", prompt: `I have no works archived yet. What information does StudioNXT collect for each work, and what do I need to have ready before I start adding them?` },
    { id: "bio", label: "Write my biography", sub: "Professional, third person", prompt: `Write a professional artist biography for ${artistName}, a ${practiceType} based in ${country} with ${careerLength} of experience working in ${(mediums||[]).join(", ")}. Third person, warm and authoritative, 150 words.` },
    noPrice > 0 && { id: "price", label: `${noPrice} ${noPrice === 1 ? "work" : "works"} with no price`, sub: "Review what's missing", prompt: `I have ${noPrice} works with no price recorded in my archive. List them by title and year so I can see what needs attention.` },
    artworkCount > 0 && { id: "statement", label: "Write an artist statement", sub: "First person, 120 words", prompt: `Write an artist statement for ${artistName}, a ${practiceType} working in ${(mediums||[]).join(", ")} based in ${country}. ${artworkCount} works archived. First person, reflective and honest, 120 words. Focus on intent and process.` },
    artworkCount > 2 && { id: "summary", label: "Summarise my practice", sub: "Patterns across your archive", prompt: `Summarise ${firstName}'s artistic practice: ${artworkCount} works archived, mediums include ${(mediums||[]).join(", ")}, career length ${careerLength}, based in ${country}. Two paragraphs — one about the body of work, one about what makes it distinctive.` },
    noImage > 0 && { id: "image", label: `${noImage} works missing images`, sub: "What to photograph first", prompt: `I have ${noImage} works with no photograph. As a ${practiceType}, which works should I prioritise photographing first and why? What makes a good archive photograph?` },
    soldCount > 0 && { id: "sold", label: "Write a collector note", sub: "Draft a note for your records", prompt: `Draft a short, personal note from ${firstName} to a collector who has one of their works. The artist is a ${practiceType} based in ${country}. 80 words, genuine and direct. Present it as a draft for the artist to review and personalise.` },
    { id: "voice", label: "Record your voice with Mira", sub: "Guided archive interview", isRoute: true, route: "/archive/voices/new" },
  ].filter(Boolean).slice(0, 4) as { id: string; label: string; sub: string; prompt?: string; isRoute?: boolean; route?: string }[];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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

  function reset() {
    setMessages([]);
    setStarted(false);
    setInput("");
  }

  return (
    <div className="flex flex-col h-full">

      {/* Empty state — greeting + smart buttons */}
      {!started && messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-700 to-purple-900 flex items-center justify-center text-white text-lg font-bold mb-6 shadow-lg shadow-purple-900/40">
            M
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2 text-center" style={{fontFamily: "var(--font-playfair)"}}>
            {timeGreeting}, {firstName}.
          </h2>
          <p className="text-secondary text-sm text-center mb-10 max-w-sm leading-relaxed">
            {artworkCount === 0
              ? "Your archive is ready. Let\'s start building it together."
              : `You have ${artworkCount} ${artworkCount === 1 ? "work" : "works"} archived. What would you like to work on today?`}
          </p>

          {/* Smart buttons — 2x2 grid */}
          {allButtons.length > 0 && (
            <div className="grid grid-cols-2 gap-3 w-full max-w-lg mb-10">
              {allButtons.map(btn => (
                <button
                  key={btn.id}
                  onClick={() => btn.isRoute ? router.push(btn.route!) : sendMessage(btn.prompt)}
                  className="group text-left px-4 py-4 bg-card border border-default hover:border-purple-800 hover:bg-[#1a1410] rounded-2xl transition-all duration-200"
                >
                  <div className="text-xs font-medium text-primary group-hover:text-purple-300 transition-colors leading-snug mb-1">{btn.label}</div>
                  <div className="text-xs text-muted group-hover:text-secondary transition-colors">{btn.sub}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={"flex " + (msg.role === "user" ? "justify-end" : "justify-start items-start gap-3")}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-700 to-purple-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5 shadow-md shadow-purple-900/40">
                  M
                </div>
              )}
              <div className={"rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap " + (
                msg.role === "user"
                  ? "bg-card-hover text-primary max-w-sm rounded-br-sm"
                  : "bg-card border border-default text-primary max-w-lg rounded-tl-sm"
              )}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-700 to-purple-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md shadow-purple-900/40">
                M
              </div>
              <div className="bg-card border border-default rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center h-4">
                  {[0, 150, 300].map(delay => (
                    <span key={delay} className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2">
        {messages.length > 0 && (
          <button onClick={reset} className="text-xs text-muted hover:text-secondary mb-3 transition-colors flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            New conversation
          </button>
        )}
        <div className="flex gap-2 items-end bg-card border border-default focus-within:border-purple-800 rounded-2xl px-4 py-3 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask Mira anything about your archive..."
            disabled={loading}
            className="flex-1 text-sm bg-transparent text-primary focus:outline-none placeholder-gray-600 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-8 h-8 flex items-center justify-center bg-purple-700 hover:bg-purple-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>

    </div>
  );
}

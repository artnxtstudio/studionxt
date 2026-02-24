'use client';

import { useRouter } from 'next/navigation';

export default function AboutPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="sticky top-0 z-10 bg-[#0A0A0A]/95 backdrop-blur border-b border-[#111] px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-gray-500 text-sm hover:text-white transition-colors">← Back</button>
        <span className="text-xs text-gray-600 uppercase tracking-widest">About</span>
        <div className="w-10" />
      </div>
      <div className="max-w-2xl mx-auto px-6 py-16 space-y-20">
        <div>
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-4">StudioNXT</div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-6">Built for Artists,<br />By Artists</h1>
          <p className="text-gray-400 text-lg leading-relaxed">An intelligent archiving system that helps you preserve, understand, and celebrate your creative legacy.</p>
        </div>
        <div>
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-6">Why we built this</div>
          <div className="space-y-5 text-gray-400 text-base leading-relaxed">
            <p>We work directly with artists as art managers. We're in the studios, we handle the submissions, and we deal with the chaos every single day.</p>
            <p>Here's what we see constantly: An artist gets an email from a gallery asking for their portfolio. Sounds simple, right? But now they're digging through three different hard drives, two laptops from previous years, an old phone in a drawer, Dropbox, Google Drive, and maybe an external SSD they can't find. Half the files are named <span className="text-white font-mono text-sm bg-[#111] px-2 py-0.5 rounded">IMG_2847.jpg</span> and nobody remembers what's what.</p>
            <p>Or a collector wants to buy a piece they saw two years ago. <span className="text-gray-300 italic">"The blue one, remember?"</span> Hours of searching. Maybe you find it, maybe you don't.</p>
            <p>Or you need to apply for a grant, and they want documentation of your last five years of work. Good luck piecing that together from scattered files with no dates, no context, and no story.</p>
            <p className="text-white">The art world has been completely left behind by the technology revolution. Accountants have better tools than artists. Real estate agents have better systems than galleries. It's absurd.</p>
            <p>We got tired of watching talented artists lose opportunities because they couldn't find their own work fast enough. We got tired of seeing decades of creative output treated like random files in a folder.</p>
            <p>So we built StudioNXT. Not as another tech product for artists to learn. As the studio assistant every artist actually needs but can't afford to hire.</p>
          </div>
        </div>
        <div className="border-t border-[#1a1a1a]" />
        <div>
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-6">Made by artNXT</div>
          <p className="text-gray-400 text-base leading-relaxed mb-6">StudioNXT is a product of artNXT, an art technology company based in Stuttgart, Germany. We sit at the intersection of Europe's rich artistic heritage and its culture of precision engineering.</p>
          <p className="text-gray-400 text-base leading-relaxed">Stuttgart isn't just where we're located — it shapes how we build. This is a city that understands craft, values the long game, and respects tradition while pushing innovation. That's exactly how we approach art technology.</p>
        </div>
        <div className="bg-[#111] border border-[#222] rounded-2xl p-8">
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-4">Our mission</div>
          <p className="text-white text-lg leading-relaxed font-medium">Every artist creates a body of work that tells a story. Our mission is to make that story visible, searchable, and preserved for future generations.</p>
        </div>
        <div>
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-6">What we believe</div>
          <div className="space-y-0">
            {[
              { title: 'Artist-centric design', desc: "Artists aren't users, they're partners. Every decision starts with "Does this serve the artist's practice?"" },
              { title: 'Privacy as a right', desc: "Your work is yours. We don't train AI on your artwork. We don't share it. Your archive is private, period." },
              { title: 'Accessible excellence', desc: "Professional-grade tools shouldn't require institutional budgets. World-class archiving for every working artist." },
              { title: 'Built for longevity', desc: "Artists think in decades. StudioNXT is built to last, with export capabilities and no lock-in." },
            ].map(item => (
              <div key={item.title} className="flex gap-4 py-5 border-b border-[#111] last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0 mt-2" />
                <div>
                  <div className="text-sm font-semibold text-white mb-1">{item.title}</div>
                  <div className="text-sm text-gray-500 leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-6">Looking forward</div>
          <p className="text-gray-400 text-base leading-relaxed">StudioNXT is just the beginning. We're building an ecosystem of intelligent tools for the entire artistic lifecycle — from creation to preservation to legacy.</p>
        </div>
        <div className="text-center pt-8 border-t border-[#111]">
          <div className="text-xs text-gray-600 mb-1">Made in Stuttgart</div>
          <div className="text-xs text-gray-600">Built for artists everywhere</div>
        </div>
      </div>
    </div>
  );
}

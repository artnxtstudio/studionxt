'use client';

import { useRouter } from 'next/navigation';

export default function AboutPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="sticky top-0 z-10 bg-[#0A0A0A]/95 backdrop-blur border-b border-[#111] px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-gray-500 text-sm hover:text-white transition-colors">Back</button>
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
            <p>We work directly with artists as art managers. We are in the studios, we handle the submissions, and we deal with the chaos every single day.</p>
            <p>An artist gets an email from a gallery asking for their portfolio. Sounds simple. But now they are digging through three different hard drives, two laptops, an old phone in a drawer, Dropbox, Google Drive. Half the files are named IMG_2847.jpg and nobody remembers what is what.</p>
            <p>A collector wants to buy a piece they saw two years ago. The blue one, remember? Hours of searching. Maybe you find it, maybe you do not.</p>
            <p>You need to apply for a grant, and they want documentation of your last five years of work. Good luck piecing that together from scattered files with no dates, no context, and no story.</p>
            <p className="text-white">The art world has been completely left behind by the technology revolution. Accountants have better tools than artists. Real estate agents have better systems than galleries. It is absurd.</p>
            <p>We got tired of watching talented artists lose opportunities because they could not find their own work fast enough. We built StudioNXT as the studio assistant every artist needs but cannot afford to hire.</p>
          </div>
        </div>
        <div className="border-t border-[#1a1a1a]" />
        <div>
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-6">Made by artNXT</div>
          <p className="text-gray-400 text-base leading-relaxed mb-6">StudioNXT is a product of artNXT, an art technology company based in Stuttgart, Germany. We sit at the intersection of Europe's rich artistic heritage and its culture of precision engineering.</p>
          <p className="text-gray-400 text-base leading-relaxed">Stuttgart is not just where we are located — it shapes how we build. A city that understands craft, values the long game, and respects tradition while pushing innovation.</p>
        </div>
        <div className="bg-[#111] border border-[#222] rounded-2xl p-8">
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-4">Our mission</div>
          <p className="text-white text-lg leading-relaxed font-medium">Every artist creates a body of work that tells a story. Our mission is to make that story visible, searchable, and preserved for future generations.</p>
        </div>
        <div>
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-6">What we believe</div>
          <div className="space-y-0">
            {[
              { title: 'Artist-centric design', desc: 'Artists are partners, not users. Every decision starts with: does this serve the practice?' },
              { title: 'Privacy as a right', desc: 'Your work is yours. We do not train AI on your artwork. We do not share it. Your archive is private, period.' },
              { title: 'Accessible excellence', desc: 'Professional-grade tools should not require institutional budgets. World-class archiving for every working artist.' },
              { title: 'Built for longevity', desc: 'Artists think in decades. StudioNXT is built to last, with export capabilities and no lock-in.' },
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
          <p className="text-gray-400 text-base leading-relaxed">StudioNXT is just the beginning. We are building an ecosystem of intelligent tools for the entire artistic lifecycle — from creation to preservation to legacy.</p>
        </div>
        <div className="text-center pt-8 border-t border-[#111]">
          <div className="text-xs text-gray-600 mb-1">Made in Stuttgart</div>
          <div className="text-xs text-gray-600">Built for artists everywhere</div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';

export default function AboutPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background text-primary">

      {/* Nav */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-default px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-secondary text-sm hover:text-primary transition-colors">← Back</button>
        <span className="text-xs text-muted uppercase tracking-widest">About StudioNXT</span>
        <div className="w-10" />
      </div>

      <div className="max-w-2xl mx-auto px-6 py-16 space-y-16">

        {/* Hero */}
        <div>
          <img src="https://firebasestorage.googleapis.com/v0/b/studionxt-2657b.firebasestorage.app/o/artnxt.png?alt=media&token=991c5ea4-8d04-48ae-b82d-67d6f5900890" alt="StudioNXT" style={{ width: '72px', height: '72px', display: 'block', marginBottom: '24px' }} />
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-4">What is StudioNXT</div>
          <h1 className="text-4xl font-bold text-primary leading-tight mb-6" style={{fontFamily:'var(--font-playfair)'}}>
            A living museum<br />at the individual<br />artist level.
          </h1>
          <p className="text-secondary text-lg leading-relaxed">
            StudioNXT is not a software product. It is a new kind of institution — built for the artist who has spent decades making work that deserves more than a folder on a hard drive.
          </p>
        </div>

        {/* The problem */}
        <div className="border-l-2 border-purple-700 pl-6">
          <p className="text-primary text-lg leading-relaxed italic" style={{fontFamily:'var(--font-playfair)'}}>
            "Most artists spend their entire lives making work that is never properly documented, priced, located, or preserved. When they are gone, their archive is left to family members who don't know what anything is worth, where it is, or what it meant."
          </p>
          <p className="text-muted text-sm mt-4">— The problem StudioNXT was built to solve</p>
        </div>

        {/* Three layers */}
        <div>
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-6">Three layers</div>
          <div className="space-y-4">
            {[
              {
                num: '01',
                title: 'Digital Archive',
                desc: 'AI-powered, living, searchable. Every artwork catalogued with edition ledgers, location tracking, valuation intelligence, and the artist\'s own voice attached to each work.',
              },
              {
                num: '02',
                title: 'Legacy System',
                desc: 'Survives the artist, reaches the estate. Mira detects inactivity and alerts the Legacy Contact. Does not wait for a death certificate. Human-centred from the first day to the last.',
              },
              {
                num: '03',
                title: 'Physical Archive Book',
                desc: 'Printed annually, delivered to the artist. Contains all works photographed, edition records, location records, and The Mira Letter. Exists without the internet.',
              },
            ].map(l => (
              <div key={l.num} className="bg-card border border-default rounded-2xl p-6">
                <div className="text-xs text-muted uppercase tracking-widest mb-2">{l.num}</div>
                <div className="text-lg font-semibold text-primary mb-2" style={{fontFamily:'var(--font-playfair)'}}>{l.title}</div>
                <p className="text-secondary text-sm leading-relaxed">{l.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mira */}
        <div>
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-4">Meet Mira</div>
          <h2 className="text-2xl font-bold text-primary mb-4" style={{fontFamily:'var(--font-playfair)'}}>The intelligence layer</h2>
          <p className="text-secondary leading-relaxed mb-4">
            Mira is StudioNXT's AI — powered by Claude (Anthropic) and Gemini (Google). She greets you in the morning, asks questions about your work, generates your biography, and over time synthesises everything into The Mira Letter — a living document in your own voice that answers: what this work meant, what should never be sold, what you were trying to do.
          </p>
          <p className="text-secondary leading-relaxed">
            Mira is not a chatbot. She is an archivist.
          </p>
        </div>

        {/* First customer */}
        <div className="bg-card border border-default rounded-2xl p-8">
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-4">Our first customer</div>
          <h2 className="text-2xl font-bold text-primary mb-4" style={{fontFamily:'var(--font-playfair)'}}>A Printmaker. 94. Stuttgart.</h2>
          <p className="text-secondary leading-relaxed mb-4">
            Our first customer has 60+ years of work, collectors across Europe, and no structured archive. She is not a demographic — she is the thesis.
          </p>
          <p className="text-secondary leading-relaxed">
            If StudioNXT works for her, it works for every artist.
          </p>
        </div>

        {/* Pricing */}
        <div>
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-6">Two plans</div>
          <div className="space-y-4">
            <div className="bg-card border border-default rounded-2xl p-6">
              <div className="text-lg font-semibold text-primary mb-1" style={{fontFamily:'var(--font-playfair)'}}>StudioNXT Active</div>
              <div className="text-2xl font-bold text-primary mb-3">€15 <span className="text-secondary text-sm font-normal">/ month</span></div>
              <p className="text-secondary text-sm leading-relaxed">Full access to the living archive. Works, editions, locations, voices, Mira, valuation intelligence. €120/year.</p>
            </div>
            <div className="bg-card border-2 rounded-2xl p-6" style={{borderColor:'var(--gold)', background:'var(--gold-bg)'}}>
              <div className="text-xs uppercase tracking-widest mb-2" style={{color:'var(--gold)'}}>Permanent</div>
              <div className="text-lg font-semibold text-primary mb-1" style={{fontFamily:'var(--font-playfair)'}}>StudioNXT Permanent</div>
              <div className="text-2xl font-bold text-primary mb-3">€500 <span className="text-secondary text-sm font-normal">once</span></div>
              <p className="text-secondary text-sm leading-relaxed mb-3">Archive preserved forever. Includes the Physical Archive Book. The payment splits: €200 operations, €200 endowment reserve, €100 Archive Book.</p>
              <p className="text-sm leading-relaxed" style={{color:'var(--gold)'}}>This is permanence. Not a subscription.</p>
            </div>
          </div>
        </div>

        {/* The company */}
        <div>
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-4">The company</div>
          <h2 className="text-2xl font-bold text-primary mb-4" style={{fontFamily:'var(--font-playfair)'}}>artNXT Company</h2>
          <p className="text-secondary leading-relaxed mb-4">
            StudioNXT is built by artNXT Company, Stuttgart, Germany. Founded by Madhavan Pillai — a solo founder with no technical background, who built the entire platform through AI-assisted development.
          </p>
          <p className="text-secondary leading-relaxed">
            We are a small company with a serious mission. We believe every artist's life work deserves a permanent, professional record.
          </p>
        </div>

        {/* Contact */}
        <div className="bg-card border border-default rounded-2xl p-6 text-center">
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-3">Get in touch</div>
          <p className="text-secondary text-sm mb-4">Questions, feedback, or want to bring StudioNXT to your artist community?</p>
          <a href="mailto:hello@studionxt.com" className="text-primary font-medium hover:text-purple-400 transition-colors">
            hello@studionxt.com
          </a>
        </div>

      </div>
    </div>
  );
}

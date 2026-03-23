'use client';

import { useRouter } from 'next/navigation';

export default function TermsPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background text-primary">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-default px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-secondary text-sm hover:text-primary transition-colors">← Back</button>
        <span className="text-xs text-muted uppercase tracking-widest">Terms of Service</span>
        <div className="w-10" />
      </div>
      <div className="max-w-2xl mx-auto px-6 py-16 space-y-10">
        <div>
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-3">Legal</div>
          <h1 className="text-3xl font-bold text-primary mb-2" style={{fontFamily:'var(--font-playfair)'}}>Terms of Service</h1>
          <p className="text-muted text-sm">Last updated: March 2026 · artNXT Company, Stuttgart, Germany</p>
        </div>

        {[
          {
            title: '1. Agreement',
            content: 'By creating a StudioNXT account, you agree to these Terms. StudioNXT is operated by artNXT Company, Stuttgart, Germany. Contact: hello@studionxt.com'
          },
          {
            title: '2. The Service',
            content: 'StudioNXT provides a digital archive for artworks, editions, locations and documents; AI-powered tools (Mira) for artist statements and biography generation; a legacy system for archive access designation; and valuation intelligence.'
          },
          {
            title: '3. Your Account',
            content: 'You are responsible for keeping your password secure and all activity under your account. You must be at least 16 years old to use StudioNXT. Provide accurate information about yourself and your artwork.'
          },
          {
            title: '4. Your Content',
            content: 'You own your content. All artwork images, records, voice sessions, and documents you upload remain your property. We claim no ownership over your creative work. By uploading, you grant us a limited licence to store, display, and process your content to provide the service.'
          },
          {
            title: '5. Acceptable Use',
            content: 'You agree not to upload copyright-infringing content, create false artwork records, attempt to access other users\' data, or use StudioNXT for unlawful purposes.'
          },
          {
            title: '6. Pricing and Payment',
            content: 'StudioNXT Active: €15/month or €120/year. StudioNXT Permanent: €500 one-time. Payment via Stripe. Subscriptions auto-renew unless cancelled. No refunds for partial periods except as required by German law.'
          },
          {
            title: '7. The Legacy System',
            content: 'The legacy contact feature is a convenience tool. It does not constitute a legal will or grant legal rights to the designated contact. Consult a lawyer for formal estate planning.'
          },
          {
            title: '8. Termination',
            content: 'You may delete your account at any time. We may suspend accounts that violate these Terms. Data is deleted within 30 days of account termination.'
          },
          {
            title: '9. Limitation of Liability',
            content: 'StudioNXT is provided "as is." To the maximum extent permitted by German law, our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.'
          },
          {
            title: '10. Governing Law',
            content: 'These Terms are governed by German law. Disputes shall be resolved in the courts of Stuttgart, Germany.'
          },
        ].map(s => (
          <div key={s.title} className="border-b border-default pb-8">
            <h2 className="text-lg font-semibold text-primary mb-3" style={{fontFamily:'var(--font-playfair)'}}>{s.title}</h2>
            <p className="text-secondary leading-relaxed text-sm">{s.content}</p>
          </div>
        ))}

        <p className="text-muted text-xs">This document is a draft pending legal review. · Dieses Dokument ist ein Entwurf.</p>
      </div>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background text-primary">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-default px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-secondary text-sm hover:text-primary transition-colors">← Back</button>
        <span className="text-xs text-muted uppercase tracking-widest">Privacy Policy</span>
        <div className="w-10" />
      </div>
      <div className="max-w-2xl mx-auto px-6 py-16 space-y-10">
        <div>
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-3">Legal</div>
          <h1 className="text-3xl font-bold text-primary mb-2" style={{fontFamily:'var(--font-playfair)'}}>Privacy Policy</h1>
          <p className="text-muted text-sm">Last updated: March 2026 · artNXT Company, Stuttgart, Germany</p>
        </div>

        {[
          {
            title: '1. Who We Are',
            content: 'StudioNXT is operated by artNXT Company, Stuttgart, Germany (founder: Madhavan Pillai). Contact: hello@studionxt.com'
          },
          {
            title: '2. What Data We Collect',
            content: 'We collect account data (name, email, password via Firebase Auth), archive data you create (artwork records, images, voice sessions, documents, edition records, legacy contact), and usage data (IP address, browser type, timestamps). We collect only what is necessary to provide the service.'
          },
          {
            title: '3. How We Use Your Data',
            content: 'We use your data exclusively to provide your archive, enable AI features (Mira, bio generation), and send service communications. We do not sell your data, use your artwork images for AI training, or show advertising.'
          },
          {
            title: '4. AI Services',
            content: 'Mira uses Claude by Anthropic (privacy policy: anthropic.com/privacy). Bio generation uses Gemini by Google (privacy policy: policies.google.com/privacy). We do not use your data to train AI models.'
          },
          {
            title: '5. Data Storage',
            content: 'Your data is stored via Google Firebase (Firestore and Firebase Storage), certified under the EU-US Data Privacy Framework. Servers may be located in the EU or United States.'
          },
          {
            title: '6. Your Rights (GDPR)',
            content: 'You have the right to access, correct, delete, and export your data. You may object to processing or withdraw consent at any time. Contact hello@studionxt.com to exercise any right. You may also lodge a complaint with the Landesbeauftragte für den Datenschutz Baden-Württemberg.'
          },
          {
            title: '7. Data Retention',
            content: 'We retain your data while your account is active. Upon account deletion, all personal data is deleted within 30 days. StudioNXT Permanent subscribers retain their archive data permanently by agreement.'
          },
          {
            title: '8. Cookies',
            content: 'We use only essential cookies for authentication and session management. No tracking or advertising cookies.'
          },
          {
            title: '9. Children',
            content: 'StudioNXT is not intended for users under 16 years of age.'
          },
          {
            title: '10. Changes',
            content: 'We will notify you by email of material changes at least 30 days before they take effect.'
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

'use client';

import { useRouter } from 'next/navigation';

const WHO = 'StudioNXT is operated by artNXT Company, registered in Stuttgart, Baden-Wurttemberg, Germany. For all privacy questions, contact us through our website.';
const ARTWORK_AI = 'Your artwork is yours. Period. Images are stored securely in our database. AI analysis happens in real-time when you request it. We do not use your artwork to train our AI models. We do not share your artwork with third parties. Your archive is private by default. We use Anthropic Claude AI to power Mira. When you interact with Mira, text descriptions and context are sent to Anthropic servers for processing. Your images are not sent to Anthropic.';
const STORAGE = 'Servers are located in the European Union. All data is encrypted in transit and at rest. Account and artwork data is kept while your account is active. After account deletion, data is permanently removed within 30 days.';
const RIGHTS_NOTE = 'To exercise your rights, contact us through our website. We will respond within 30 days.';
const CHILDREN = 'StudioNXT is not intended for anyone under 16 years old. We do not knowingly collect data from children.';
const CHANGES = 'We may update this Privacy Policy occasionally. Changes will be posted here with a new date. Significant changes will be communicated via email.';
const CONTACT = 'For privacy questions contact us through our website contact form. We respond within 30 days. You may also lodge a complaint with: Der Landesbeauftragte fur den Datenschutz und die Informationsfreiheit Baden-Wurttemberg, Konigstrasse 10a, 70173 Stuttgart, Germany.';

const sections: any[] = [
  { id: 'who', title: 'Who we are', content: WHO },
  { id: 'collect', title: 'What data we collect', blocks: [
    { label: 'Account information', items: ['Name', 'Email address', 'Password (encrypted)', 'Location (optional)', 'Payment info processed by provider, not stored by us'] },
    { label: 'Artwork data', items: ['Images you upload', 'Titles, descriptions, and notes', 'Dates and metadata', 'Voice notes and text annotations'] },
    { label: 'Usage data', items: ['How you interact with StudioNXT', 'Features you use', 'Chat conversations with Mira'] },
    { label: 'Technical data', items: ['IP address', 'Browser type and version', 'Device information', 'Operating system'] },
  ]},
  { id: 'use', title: 'How we use your data', blocks: [
    { label: 'To provide our service', items: ['Analyse your uploaded artwork using AI', 'Store and organise your archive', 'Enable search and chat functionality', 'Sync across your devices'] },
    { label: 'We will never', negative: true, items: ['Sell your data to anyone', 'Use your artwork to train AI models', 'Share your work publicly without permission', 'Send spam or unwanted marketing'] },
  ]},
  { id: 'artwork', title: 'Your artwork and AI', content: ARTWORK_AI },
  { id: 'storage', title: 'How we store your data', content: STORAGE },
  { id: 'rights', title: 'Your rights under GDPR', blocks: [
    { label: 'You have the right to', items: ['Access — request a copy of all data we hold', 'Rectification — correct inaccurate data', 'Erasure — delete your data when no longer needed', 'Portability — export in a machine-readable format', 'Object — object to processing based on legitimate interest', 'Withdraw consent — for marketing or optional features'] },
  ], content: RIGHTS_NOTE },
  { id: 'cookies', title: 'Cookies', blocks: [
    { label: 'Essential cookies', items: ['Keep you logged in', 'Remember your preferences', 'Security and authentication'] },
    { label: 'We do not use', negative: true, items: ['Advertising cookies', 'Third-party tracking cookies', 'Social media cookies'] },
  ]},
  { id: 'children', title: 'Children', content: CHILDREN },
  { id: 'changes', title: 'Changes to this policy', content: CHANGES },
  { id: 'contact', title: 'Contact and complaints', content: CONTACT },
];

export default function PrivacyPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#0D0B09] text-[#F5F0EB]">
      <div className="sticky top-0 z-10 bg-[#0D0B09]/95 backdrop-blur border-b border-[#221A12] px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-gray-500 text-sm hover:text-[#F5F0EB] transition-colors">Back</button>
        <span className="text-xs text-gray-600 uppercase tracking-widest">Privacy</span>
        <div className="w-10" />
      </div>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-16">
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-4">Legal</div>
          <h1 className="text-4xl font-bold text-[#F5F0EB] mb-4">Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Last updated: February 8, 2026 · artNXT Company · Stuttgart, Germany</p>
        </div>
        <div className="bg-[#171410] border border-purple-900 rounded-2xl p-6 mb-16">
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-4">The short version</div>
          <div className="space-y-2">
            {['Your artwork is yours. We never use it to train AI.', 'Your data stays private and secure in the EU.', 'We do not sell or share your data.', 'You can export or delete everything at any time.', 'We comply with GDPR and German law.'].map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-gray-300">
                <span className="text-purple-400 flex-shrink-0">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-12">
          {sections.map((section, i) => (
            <div key={section.id} className="pb-12 border-b border-[#221A12] last:border-0">
              <div className="flex items-start gap-4 mb-5">
                <div className="text-xs text-purple-400 font-mono mt-1 flex-shrink-0">{String(i + 1).padStart(2, '0')}</div>
                <h2 className="text-lg font-semibold text-[#F5F0EB]">{section.title}</h2>
              </div>
              <div className="ml-8 space-y-5">
                {section.content && <p className="text-gray-400 text-sm leading-relaxed">{section.content}</p>}
                {section.blocks && section.blocks.map((block: any) => (
                  <div key={block.label}>
                    <div className={'text-xs uppercase tracking-widest mb-3 ' + (block.negative ? 'text-red-500' : 'text-gray-500')}>{block.label}</div>
                    <div className="space-y-1.5">
                      {block.items.map((item: string) => (
                        <div key={item} className="flex items-start gap-2 text-sm text-gray-400">
                          <span className={'flex-shrink-0 ' + (block.negative ? 'text-red-600' : 'text-purple-400')}>{block.negative ? '✕' : '·'}</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="text-center pt-12 border-t border-[#221A12]">
          <div className="text-xs text-gray-600 mb-1">artNXT Company · Stuttgart, Germany</div>
          <div className="text-xs text-gray-600">GDPR compliant · EU data storage</div>
        </div>
      </div>
    </div>
  );
}

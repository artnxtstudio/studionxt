'use client';

import { useRouter } from 'next/navigation';

const sections = [
  { id: 'who', title: 'Who we are', content: 'StudioNXT is operated by artNXT Company, registered in Stuttgart, Baden-Württemberg, Germany. For all privacy-related questions or requests, please contact us through our website contact form.' },
  { id: 'collect', title: 'What data we collect', blocks: [
    { label: 'Account information', items: ['Name', 'Email address', 'Password (encrypted)', 'Location (optional)', 'Payment information (processed by our payment provider, not stored by us)'] },
    { label: 'Artwork data', items: ['Images you upload', 'Titles, descriptions, and notes you add', 'Dates and metadata you provide', 'Voice notes and text annotations'] },
    { label: 'Usage data', items: ['How you interact with StudioNXT', 'Features you use', 'Chat conversations with the AI'] },
    { label: 'Technical data', items: ['IP address', 'Browser type and version', 'Device information', 'Operating system'] },
  ]},
  { id: 'use', title: 'How we use your data', blocks: [
    { label: 'To provide our service', items: ['Analyse your uploaded artwork using AI', 'Store and organise your archive', 'Enable search and chat functionality', 'Generate timelines, insights, and exhibitions', 'Sync across your devices'] },
    { label: 'We will never', negative: true, items: ['Sell your data to anyone', 'Use your artwork to train AI models', 'Share your work publicly without your permission', 'Send spam or unwanted marketing'] },
  ]},
  { id: 'artwork', title: 'Your artwork and AI', content: 'Your artwork is yours. Period.\n\nImages are stored securely in our database. AI analysis happens in real-time when you request it. We do not use your artwork to train our AI models. We do not share your artwork with third parties. Your archive is private by default.\n\nWe use Anthropic Claude AI to power Mira, your studio assistant. When you interact with Mira, text descriptions and context are sent to Anthropic\'s servers for processing. Your images are not sent to Anthropic. Anthropic processes data according to their API terms and does not retain it for training purposes.' },
  { id: 'storage', title: 'How we store your data', content: 'Servers are located in the European Union. All data is encrypted in transit (HTTPS/TLS) and encrypted at rest.\n\nAccount and artwork data is kept while your account is active. After account deletion, data is permanently removed within 30 days. Backups are deleted within 90 days.' },
  { id: 'rights', title: 'Your rights under GDPR', blocks: [
    { label: 'You have the right to', items: ['Access — request a copy of all data we hold about you', 'Rectification — correct inaccurate or incomplete data', 'Erasure — delete your data when no longer needed', 'Portability — export your data in a machine-readable format', 'Object — object to processing based on legitimate interest', 'Withdraw consent — for marketing or optional features'] },
  ], content: 'To exercise your rights, contact us through our website. We will respond within 30 days.' },
  { id: 'cookies', title: 'Cookies', blocks: [
    { label: 'Essential cookies (always on)', items: ['Keep you logged in', 'Remember your preferences', 'Security and authentication'] },
    { label: 'We do not use', negative: true, items: ['Advertising cookies', 'Third-party tracking cookies', 'Social media cookies'] },
  ]},
  { id: 'children', title: "Children's privacy", content: 'StudioNXT is not intended for anyone under 16 years old. We do not knowingly collect data from children. If you believe we have data from a child under 16, contact us immediately.' },
  { id: 'changes', title: 'Changes to this policy', content: 'We may update this Privacy Policy occasionally. Changes will be posted here with a new date. Significant changes will be communicated via email.' },
  { id: 'contact', title: 'Contact and complaints', content: 'For privacy questions or to exercise your rights, contact us through our website contact form. We respond to all requests within 30 days.\n\nYou have the right to lodge a complaint with the German data protection authority:\n\nDer Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg\nKönigstraße 10a, 70173 Stuttgart, Germany\nwww.baden-wuerttemberg.datenschutz.de' },
];

export default function PrivacyPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="sticky top-0 z-10 bg-[#0A0A0A]/95 backdrop-blur border-b border-[#111] px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-gray-500 text-sm hover:text-white transition-colors">← Back</button>
        <span className="text-xs text-gray-600 uppercase tracking-widest">Privacy</span>
        <div className="w-10" />
      </div>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-16">
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-4">Legal</div>
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Last updated: February 8, 2026</p>
          <p className="text-gray-500 text-sm mt-1">artNXT Company · Stuttgart, Germany · GDPR compliant</p>
        </div>
        <div className="bg-[#111] border border-purple-900 rounded-2xl p-6 mb-16">
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-4">The short version</div>
          <div className="space-y-2">
            {['Your artwork is yours. We never use it to train AI.','Your data stays private and secure in the EU.','We do not sell or share your data.','You can export or delete everything at any time.','We comply with GDPR and German law.'].map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-gray-300">
                <span className="text-purple-400 flex-shrink-0 mt-0.5">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-12">
          {sections.map((section: any, i) => (
            <div key={section.id} className="pb-12 border-b border-[#111] last:border-0">
              <div className="flex items-start gap-4 mb-5">
                <div className="text-xs text-purple-400 font-mono mt-1 flex-shrink-0">{String(i+1).padStart(2,'0')}</div>
                <h2 className="text-lg font-semibold text-white">{section.title}</h2>
              </div>
              <div className="ml-8 space-y-5">
                {section.content && <div className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{section.content}</div>}
                {section.blocks && section.blocks.map((block: any) => (
                  <div key={block.label}>
                    <div className={'text-xs uppercase tracking-widest mb-3 ' + (block.negative ? 'text-red-500' : 'text-gray-500')}>{block.label}</div>
                    <div className="space-y-1.5">
                      {block.items.map((item: string) => (
                        <div key={item} className="flex items-start gap-3 text-sm text-gray-400">
                          <span className={'flex-shrink-0 mt-1 ' + (block.negative ? 'text-red-600' : 'text-purple-400')}>{block.negative ? '✕' : '·'}</span>
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
        <div className="text-center pt-12 mt-12 border-t border-[#111]">
          <div className="text-xs text-gray-600 mb-1">artNXT Company · Stuttgart, Germany</div>
          <div className="text-xs text-gray-600">GDPR compliant · EU data storage</div>
        </div>
      </div>
    </div>
  );
}

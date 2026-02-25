'use client';

const TYPE_LABELS: Record<string, string> = {
  Studio: 'In studio',
  Gallery: 'At gallery',
  Collector: 'With collector',
  Storage: 'In storage',
  MuseumLoan: 'Museum loan',
  Friend: 'With someone',
  Destroyed: 'Destroyed',
  Unknown: 'Location unknown',
};

const TYPE_COLORS: Record<string, string> = {
  Studio: 'text-green-400 border-green-900',
  Gallery: 'text-blue-400 border-blue-900',
  Collector: 'text-purple-400 border-purple-900',
  Storage: 'text-yellow-400 border-yellow-900',
  MuseumLoan: 'text-orange-400 border-orange-900',
  Friend: 'text-cyan-400 border-cyan-900',
  Destroyed: 'text-red-500 border-red-900',
  Unknown: 'text-gray-500 border-gray-700',
};

interface Props { artwork: any; }

export default function LocationCard({ artwork }: Props) {
  const type = artwork.locationType || (artwork.locationCurrent ? 'Studio' : 'Unknown');
  const label = TYPE_LABELS[type] || type;
  const color = TYPE_COLORS[type] || 'text-gray-400 border-gray-700';
  const detail = artwork.locationDetail || artwork.locationCurrent || '';
  const contact = artwork.locationContact || '';
  const verified = artwork.locationVerified
    ? new Date(artwork.locationVerified).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#1a1a1a]">
        <div className="text-xs text-purple-400 uppercase tracking-widest">Location</div>
      </div>
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className={"text-xs px-3 py-1 rounded-full border font-medium " + color}>
            {label}
          </div>
          {type === 'Destroyed' && (
            <div className="text-xs text-red-500">Recorded as destroyed</div>
          )}
        </div>
        {detail && type !== 'Studio' && type !== 'Unknown' && (
          <div>
            <div className="text-xs text-gray-500 mb-0.5">
              {type === 'Gallery' ? 'Gallery' : type === 'Collector' ? 'Collector' : type === 'Storage' ? 'Facility' : type === 'MuseumLoan' ? 'Museum' : type === 'Destroyed' ? 'Note' : 'Details'}
            </div>
            <div className="text-sm text-white">{detail}</div>
          </div>
        )}
        {contact && (
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Contact</div>
            <div className="text-sm text-gray-300">{contact}</div>
          </div>
        )}
        {verified && (
          <div className="pt-1 border-t border-[#1a1a1a]">
            <div className="text-xs text-gray-600">Last verified {verified}</div>
          </div>
        )}
        {!verified && (
          <div className="pt-1 border-t border-[#1a1a1a]">
            <div className="text-xs text-gray-600">Location not yet verified</div>
          </div>
        )}
      </div>
    </div>
  );
}

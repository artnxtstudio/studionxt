'use client';

import { useState } from 'react';

const CAREER_STAGES = ['Emerging', 'MidCareer', 'Institutional', 'MuseumLevel', 'BlueChip'];
const SALES_CONTEXTS = ['StudioSale', 'RegionalGallery', 'InternationalFair', 'GlobalMarket'];
const SALES_LABELS: Record<string, string> = {
  StudioSale: 'Studio sale',
  RegionalGallery: 'Regional gallery',
  InternationalFair: 'International fair',
  GlobalMarket: 'Global market',
};

interface Props {
  artwork: any;
  artistProfile?: any;
}

export default function PriceIntelligence({ artwork, artistProfile }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [salesContext, setSalesContext] = useState('RegionalGallery');
  const [careerStage, setCareerStage] = useState(artistProfile?.careerStage || 'Emerging');
  const [galleryCommission, setGalleryCommission] = useState('50');
  const [manualOverride, setManualOverride] = useState(0);
  const [adv, setAdv] = useState({
    materialsCost: '', fabricationCost: '', studioCost: '',
    logisticsCost: '', hoursWorked: '', hourlyRate: '50',
    structuralComplexity: false, fragileMaterial: false, internationalShipping: false,
  });

  function setA(key: string, value: string | boolean) {
    setAdv(a => ({ ...a, [key]: value }));
  }

  async function calculate() {
    setLoading(true);
    setResult(null);
    try {
      const body: any = {
        mode,
        artwork,
        artistProfile: { ...artistProfile, careerStage, hourlyRate: parseFloat(adv.hourlyRate) || 50 },
        inputs: {
          salesContext,
          galleryCommissionPercent: parseFloat(galleryCommission) || undefined,
          manualOverridePercent: manualOverride || undefined,
        },
      };
      if (mode === 'advanced') {
        body.inputs = {
          ...body.inputs,
          materialsCost: parseFloat(adv.materialsCost) || 0,
          fabricationCost: parseFloat(adv.fabricationCost) || 0,
          studioCost: parseFloat(adv.studioCost) || 0,
          logisticsCost: parseFloat(adv.logisticsCost) || 0,
          hoursWorked: parseFloat(adv.hoursWorked) || 0,
          hourlyRate: parseFloat(adv.hourlyRate) || 50,
          artworkCategory: artwork.depth ? '3D' : '2D',
          artworkType: 'Unique',
          width: parseFloat(artwork.width) || 24,
          height: parseFloat(artwork.height) || 36,
          depth: artwork.depth ? parseFloat(artwork.depth) : undefined,
          careerStage,
          salesContext,
          structuralComplexity: adv.structuralComplexity,
          fragileMaterial: adv.fragileMaterial,
          internationalShipping: adv.internationalShipping,
          galleryCommissionPercent: parseFloat(galleryCommission) || undefined,
          manualOverridePercent: manualOverride || undefined,
        };
        body.mode = 'advanced';
      }
      const res = await fetch('/api/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const inp = 'w-full bg-[#0a0a0a] border border-[#333] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors';
  const lbl = 'text-xs text-purple-400 mb-1.5 block';
  const confidenceColor: Record<string, string> = {
    high: 'text-green-400', medium: 'text-yellow-400', low: 'text-red-400',
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between px-5 py-4 bg-[#111] border border-[#222] hover:border-purple-700 rounded-2xl transition-all group">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-900/50 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-white">Price intelligence</div>
            <div className="text-xs text-gray-500">Mira valuates this work</div>
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 group-hover:text-purple-400 transition-colors">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    );
  }

  return (
    <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden">
      <div className="flex justify-between items-center px-5 py-4 border-b border-[#1a1a1a]">
        <div className="text-sm font-medium text-white">Price intelligence</div>
        <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white text-xs transition-colors">Close</button>
      </div>

      {!result && (
        <div className="p-5 space-y-5">
          <div className="flex gap-2">
            {(['simple', 'advanced'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={'flex-1 py-2 rounded-xl border text-xs transition-all ' + (mode === m ? 'border-purple-500 bg-purple-900/30 text-white' : 'border-[#333] text-gray-500 hover:border-purple-700')}>
                {m === 'simple' ? 'Quick estimate' : 'Full calculation'}
              </button>
            ))}
          </div>
          <div>
            <label className={lbl}>Career stage</label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {CAREER_STAGES.map(s => (
                <button key={s} onClick={() => setCareerStage(s)}
                  className={'py-2 rounded-xl border text-xs transition-all ' + (careerStage === s ? 'border-purple-500 bg-purple-900/30 text-white' : 'border-[#333] text-gray-500 hover:border-purple-700')}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={lbl}>Sales context</label>
            <div className="grid grid-cols-2 gap-2">
              {SALES_CONTEXTS.map(s => (
                <button key={s} onClick={() => setSalesContext(s)}
                  className={'py-2.5 px-3 rounded-xl border text-xs transition-all text-left ' + (salesContext === s ? 'border-purple-500 bg-purple-900/30 text-white' : 'border-[#333] text-gray-500 hover:border-purple-700')}>
                  {SALES_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={lbl}>Gallery commission %</label>
            <input value={galleryCommission} onChange={e => setGalleryCommission(e.target.value)} placeholder="50" className={inp} />
          </div>
          {mode === 'advanced' && (
            <div className="space-y-4 border-t border-[#1a1a1a] pt-4">
              <div className="text-xs text-purple-400 uppercase tracking-widest">Production costs (USD)</div>
              <div className="grid grid-cols-2 gap-3">
                {[['materialsCost','Materials'],['fabricationCost','Fabrication'],['studioCost','Studio'],['logisticsCost','Logistics']].map(([key, lbl2]) => (
                  <div key={key}>
                    <label className={lbl}>{lbl2}</label>
                    <input value={(adv as any)[key]} onChange={e => setA(key, e.target.value)} placeholder="0" className={inp} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Hours worked</label>
                  <input value={adv.hoursWorked} onChange={e => setA('hoursWorked', e.target.value)} placeholder="0" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Hourly rate (USD)</label>
                  <input value={adv.hourlyRate} onChange={e => setA('hourlyRate', e.target.value)} placeholder="50" className={inp} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-purple-400 uppercase tracking-widest">Risk factors</div>
                {[['structuralComplexity','Structural complexity'],['fragileMaterial','Fragile materials'],['internationalShipping','International shipping']].map(([key, lbl3]) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={(adv as any)[key]} onChange={e => setA(key, e.target.checked)} className="w-4 h-4 accent-purple-500" />
                    <span className="text-sm text-gray-300">{lbl3}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <button onClick={calculate} disabled={loading}
            className="w-full py-3 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-sm rounded-xl transition-all">
            {loading ? 'Mira is calculating...' : 'Calculate valuation'}
          </button>
        </div>
      )}

      {result && (
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Retail price', value: result.formatted?.retail, highlight: true },
              { label: 'Insurance', value: result.formatted?.insurance, highlight: false },
              { label: 'Secondary', value: result.formatted?.secondary, highlight: false },
            ].map(item => (
              <div key={item.label} className={'rounded-xl p-4 text-center ' + (item.highlight ? 'bg-purple-900/30 border border-purple-700' : 'bg-[#0a0a0a] border border-[#222]')}>
                <div className={'text-base font-bold mb-1 ' + (item.highlight ? 'text-white' : 'text-gray-300')}>{item.value}</div>
                <div className="text-xs text-gray-500">{item.label}</div>
              </div>
            ))}
          </div>

          {result.formatted?.artistNet && (
            <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-4 flex justify-between items-center">
              <div>
                <div className="text-xs text-gray-500 mb-1">After {galleryCommission}% gallery commission</div>
                <div className="text-lg font-bold text-green-400">{result.formatted.artistNet}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">Profit margin</div>
                <div className="text-lg font-bold text-white">{result.result?.profitMarginPercent}%</div>
              </div>
            </div>
          )}

          <div className="bg-[#0a0a0a] border border-[#1a1a2e] rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">M</div>
              <div>
                <div className="text-xs text-purple-400 mb-1.5">Mira · <span className={confidenceColor[result.confidence] || 'text-gray-400'}>{result.confidence} confidence</span></div>
                <div className="text-sm text-gray-300 leading-relaxed">{result.miraExplanation}</div>
              </div>
            </div>
          </div>

          <div>
            <button onClick={() => setShowBreakdown(b => !b)} className="text-xs text-gray-500 hover:text-white transition-colors">
              {showBreakdown ? 'Hide' : 'Show'} full breakdown →
            </button>
            {showBreakdown && result.result && (
              <div className="mt-3 bg-[#0a0a0a] border border-[#222] rounded-xl overflow-hidden">
                {[
                  ['Base cost', result.formatted?.baseCost],
                  ['Career multiplier', result.result.careerMultiplier + 'x'],
                  ['Size multiplier', result.result.sizeMultiplier + 'x'],
                  ['Market multiplier', result.result.marketMultiplier + 'x'],
                  ['Risk factor', Math.round(result.result.riskFactor * 100) + '%'],
                  ['Profit', result.formatted?.profit],
                ].map(([k, v], i, arr) => (
                  <div key={k} className={'flex justify-between px-4 py-2.5 text-xs ' + (i < arr.length - 1 ? 'border-b border-[#111]' : '')}>
                    <span className="text-gray-500">{k}</span>
                    <span className="text-white font-medium">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Manual adjustment ({manualOverride > 0 ? '+' : ''}{manualOverride}%)</label>
            <input type="range" min="-20" max="20" value={manualOverride} onChange={e => setManualOverride(parseInt(e.target.value))} className="w-full accent-purple-500" />
            <div className="flex justify-between text-xs text-gray-600 mt-1"><span>-20%</span><span>0</span><span>+20%</span></div>
          </div>

          <div className="flex gap-3">
            {manualOverride !== 0 && (
              <button onClick={calculate} disabled={loading} className="flex-1 py-2.5 border border-purple-700 hover:bg-purple-700 text-purple-400 hover:text-white text-xs rounded-xl transition-all">
                Recalculate
              </button>
            )}
            <button onClick={() => { setResult(null); setManualOverride(0); }} className="flex-1 py-2.5 border border-[#333] text-gray-500 text-xs rounded-xl hover:border-gray-500 transition-all">
              Start over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

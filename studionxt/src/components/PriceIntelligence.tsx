'use client';

import { useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface Props {
  artwork: any;
}

export default function Valuation({ artwork }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function calculate() {
    setLoading(true);
    setResult(null);
    try {
      // Fetch pricing settings from client
      let pricingSettings = {};
      try {
        await new Promise<void>(resolve => {
          const unsub = onAuthStateChanged(auth, async user => {
            unsub();
            const uid = user?.uid || 'demo-user';
            const snap = await getDoc(doc(db, 'artists', uid, 'settings', 'pricing'));
            if (snap.exists()) pricingSettings = snap.data();
            resolve();
          });
        });
      } catch { /* use defaults */ }

      const res = await fetch('/api/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'auto', artwork, pricingSettings }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const confidenceColor: Record<string, string> = {
    high: 'text-green-400', medium: 'text-yellow-400', low: 'text-orange-400',
  };

  if (!open) {
    return (
      <button onClick={() => { setOpen(true); calculate(); }}
        className="w-full flex items-center justify-between px-5 py-4 bg-[#111] border border-[#222] hover:border-purple-700 rounded-2xl transition-all group">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-900/50 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-white">What is this worth?</div>
            <div className="text-xs text-gray-500">Mira valuates from your archive</div>
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
        <div>
          <div className="text-sm font-semibold text-white">Valuation</div>
          <div className="text-xs text-gray-500 mt-0.5">Mira reads your full archive</div>
        </div>
        <button onClick={() => { setOpen(false); setResult(null); }} className="text-gray-500 hover:text-white text-xs transition-colors">Close</button>
      </div>

      {loading && (
        <div className="p-8 flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center text-white font-bold animate-pulse">M</div>
          <div className="text-center">
            <div className="text-sm text-white mb-1">Mira is analysing your work</div>
            <div className="text-xs text-gray-500">Reading archive, career stage, market context...</div>
          </div>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Suggested retail', value: result.formatted?.retail, highlight: true },
              { label: 'Insurance value', value: result.formatted?.insurance, highlight: false },
              { label: 'Secondary market', value: result.formatted?.secondary, highlight: false },
            ].map(item => (
              <div key={item.label} className={'rounded-xl p-4 text-center ' + (item.highlight ? 'bg-purple-900/30 border border-purple-700' : 'bg-[#0a0a0a] border border-[#222]')}>
                <div className={'font-bold mb-1 ' + (item.highlight ? 'text-white text-lg' : 'text-gray-300 text-base')}>{item.value}</div>
                <div className="text-xs text-gray-500">{item.label}</div>
              </div>
            ))}
          </div>

          {result.formatted?.artistNet && (
            <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-4 flex justify-between">
              <div>
                <div className="text-xs text-gray-500 mb-1">After gallery commission</div>
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

          {result.reasons && (
            <div className="space-y-2">
              {result.reasons.map((r: string, i: number) => (
                <div key={i} className="flex items-start gap-3 text-sm text-gray-400">
                  <span className="text-purple-400 flex-shrink-0 font-medium">{i + 1}.</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          )}

          <div>
            <button onClick={() => setShowBreakdown(b => !b)} className="text-xs text-gray-500 hover:text-white transition-colors">
              {showBreakdown ? 'Hide' : 'Show'} calculation breakdown →
            </button>
            {showBreakdown && result.result && (
              <div className="mt-3 bg-[#0a0a0a] border border-[#222] rounded-xl overflow-hidden">
                {[
                  ['Career stage', result.pricingSettings?.careerStage || '—'],
                  ['Career multiplier', (result.result.careerMultiplier || '—') + '×'],
                  ['Market multiplier', (result.result.marketMultiplier || '—') + '×'],
                  ['Size multiplier', (result.result.sizeMultiplier || '—') + '×'],
                  ['Risk factor', Math.round((result.result.riskFactor || 0) * 100) + '%'],
                  ['Base cost', result.formatted?.baseCost || '—'],
                  ['Profit', result.formatted?.profit || '—'],
                ].map(([k, v], i, arr) => (
                  <div key={k} className={'flex justify-between px-4 py-2.5 text-xs ' + (i < arr.length - 1 ? 'border-b border-[#111]' : '')}>
                    <span className="text-gray-500">{k}</span>
                    <span className="text-white font-medium">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={async () => {
              setSaving(true);
              try {
                await new Promise<void>(resolve => {
                  const unsub = onAuthStateChanged(auth, async user => {
                    unsub();
                    const uid = user?.uid || 'demo-user';
                    const { updateDoc, doc: firestoreDoc } = await import('firebase/firestore');
                    await updateDoc(firestoreDoc(db, 'artists', uid, 'artworks', artwork.id), {
                      valuation: {
                        suggestedRetail: result.result?.adjustedRetailPrice,
                        insuranceValue: result.result?.insuranceValue,
                        secondaryEstimate: result.result?.secondaryEstimate,
                        artistNet: result.result?.artistNet,
                        miraReasoning: result.miraExplanation,
                        confidence: result.confidence,
                        valuedAt: new Date().toISOString(),
                      },
                    });
                    resolve();
                  });
                });
                setSaved(true);
              } catch (err) { console.error(err); }
              finally { setSaving(false); }
            }} disabled={saving || saved}
              className="flex-1 py-3 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-sm rounded-xl transition-all">
              {saved ? 'Saved to artwork ✓' : saving ? 'Saving...' : 'Save to artwork record'}
            </button>
            <button onClick={calculate} className="px-4 py-3 border border-[#333] hover:border-purple-700 text-gray-400 hover:text-white text-sm rounded-xl transition-all">↻</button>
          </div>

          {!result.pricingSettings?.careerStage && (
            <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-3 text-xs text-yellow-400">
              Set your career stage in Profile → Valuation settings for more accurate results.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

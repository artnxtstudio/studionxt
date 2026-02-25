'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface ValuationEntry {
  date: string;
  askingPrice: number;
  insurance: number;
  youKeep: number;
  miraNote: string;
  confidence: string;
}

interface Props {
  artwork: any;
}

export default function WorkValue({ artwork }: Props) {
  const [userId, setUserId] = useState('demo-user');
  const [history, setHistory] = useState<ValuationEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showNew, setShowNew] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      const uid = user?.uid || 'demo-user';
      setUserId(uid);
      // Load existing valuation history from artwork
      if (artwork?.valuation) {
        if (Array.isArray(artwork.valuation)) {
          setHistory(artwork.valuation);
        } else if (artwork.valuation.askingPrice) {
          // Migrate old single valuation to array
          setHistory([{
            date: artwork.valuation.valuedAt || new Date().toISOString(),
            askingPrice: artwork.valuation.suggestedRetail || artwork.valuation.askingPrice,
            insurance: artwork.valuation.insuranceValue || artwork.valuation.insurance,
            youKeep: artwork.valuation.artistNet || artwork.valuation.youKeep,
            miraNote: artwork.valuation.miraReasoning || artwork.valuation.miraNote || '',
            confidence: artwork.valuation.confidence || 'medium',
          }]);
        }
      }
    });
    return () => unsub();
  }, [artwork]);

  async function calculate() {
    setLoading(true);
    setResult(null);
    try {
      let pricingSettings = {};
      try {
        const snap = await getDoc(doc(db, 'artists', userId, 'settings', 'pricing'));
        if (snap.exists()) pricingSettings = snap.data();
      } catch {}

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

  async function saveToHistory() {
    if (!result) return;
    setSaving(true);
    try {
      const entry: ValuationEntry = {
        date: new Date().toISOString(),
        askingPrice: result.result?.adjustedRetailPrice,
        insurance: result.result?.insuranceValue,
        youKeep: result.result?.artistNet,
        miraNote: result.miraExplanation,
        confidence: result.confidence,
      };
      const updatedHistory = [...history, entry];
      await updateDoc(doc(db, 'artists', userId, 'artworks', artwork.id), {
        valuation: updatedHistory,
      });
      setHistory(updatedHistory);
      setResult(null);
      setShowNew(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(index: number) {
    try {
      const updated = history.filter((_, i) => i !== index);
      await updateDoc(doc(db, 'artists', userId, 'artworks', artwork.id), {
        valuation: updated,
      });
      setHistory(updated);
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
    }
  }

  function formatMoney(amount: number) {
    if (!amount) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  function percentChange(older: number, newer: number) {
    if (!older || !newer) return null;
    const pct = Math.round(((newer - older) / older) * 100);
    return pct;
  }

  const confidenceLabel: Record<string, string> = {
    high: 'high confidence', medium: 'medium confidence', low: 'early estimate',
  };

  // ── No history yet ──
  if (history.length === 0 && !showNew) {
    return (
      <button
        onClick={() => { setShowNew(true); calculate(); }}
        className="w-full flex items-center justify-between px-5 py-4 bg-[#171410] border border-[#2E2820] hover:border-purple-700 rounded-2xl transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-900/50 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-[#F5F0EB]">What is this worth?</div>
            <div className="text-xs text-gray-500">Mira looks at your full archive</div>
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 group-hover:text-purple-400 transition-colors">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    );
  }

  // ── Has history ──
  return (
    <div className="bg-[#171410] border border-[#2E2820] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2318]">
        <div className="text-xs text-purple-400 uppercase tracking-widest">Value history</div>
        {!showNew && (
          <button
            onClick={() => { setShowNew(true); calculate(); }}
            className="text-xs px-3 py-1.5 border border-[#3D3530] hover:border-purple-700 text-gray-400 hover:text-[#F5F0EB] rounded-lg transition-all"
          >
            Check again
          </button>
        )}
      </div>

      {/* History entries */}
      {history.length > 0 && (
        <div className="divide-y divide-[#1a1a1a]">
          {history.map((entry, i) => {
            const prev = i > 0 ? history[i - 1] : null;
            const change = prev ? percentChange(prev.askingPrice, entry.askingPrice) : null;
            return (
              <div key={i} className="px-5 py-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">{formatDate(entry.date)}</div>
                    <div className="flex items-center gap-3">
                      <div className="text-xl font-bold text-[#F5F0EB]">{formatMoney(entry.askingPrice)}</div>
                      {change !== null && (
                        <div className={'text-xs font-medium px-2 py-0.5 rounded-full ' + (change >= 0 ? 'text-green-400 bg-green-900/30' : 'text-red-400 bg-red-900/30')}>
                          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmDelete(i)}
                    className="text-xs text-gray-700 hover:text-red-500 transition-colors mt-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-[#0D0B09] rounded-lg px-3 py-2">
                    <div className="text-xs text-gray-600 mb-0.5">Insurance</div>
                    <div className="text-sm font-medium text-gray-300">{formatMoney(entry.insurance)}</div>
                  </div>

                  {entry.youKeep > 0 && (
                    <div className="bg-[#0D0B09] rounded-lg px-3 py-2 col-span-2">
                      <div className="text-xs text-gray-600 mb-0.5">What you keep after gallery</div>
                      <div className="text-sm font-medium text-green-400">{formatMoney(entry.youKeep)}</div>
                    </div>
                  )}
                </div>

                {entry.miraNote && (
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold text-[#F5F0EB] flex-shrink-0 mt-0.5">M</div>
                    <div className="text-xs text-gray-400 leading-relaxed italic">{entry.miraNote}</div>
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-700">{confidenceLabel[entry.confidence] || ''}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trend summary */}
      {history.length >= 2 && (
        <div className="px-5 py-3 border-t border-[#2A2318] bg-[#0D0B09]">
          {(() => {
            const first = history[0];
            const last = history[history.length - 1];
            const pct = percentChange(first.askingPrice, last.askingPrice);
            const months = Math.round((new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24 * 30));
            return (
              <div className="flex items-center gap-2 text-xs">
                <span className={'font-medium ' + ((pct || 0) >= 0 ? 'text-green-400' : 'text-red-400')}>
                  {(pct || 0) >= 0 ? '↑' : '↓'} {Math.abs(pct || 0)}%
                </span>
                <span className="text-gray-500">over {months} {months === 1 ? 'month' : 'months'} · {history.length} checks</span>
              </div>
            );
          })()}
        </div>
      )}

      {/* New valuation in progress */}
      {showNew && (
        <div className="border-t border-[#2A2318]">
          {loading && (
            <div className="p-6 flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center text-[#F5F0EB] text-xs font-bold animate-pulse">M</div>
              <div className="text-sm text-[#F5F0EB]">Mira is looking at this work</div>
              <div className="text-xs text-gray-500">Reading your archive...</div>
              <div className="flex gap-1 mt-1">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="p-5 space-y-4">
              <div className="text-xs text-gray-500 uppercase tracking-widest">New estimate · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Asking price', value: result.formatted?.retail, highlight: true },
                  { label: 'Insurance', value: result.formatted?.insurance, highlight: false },
                ].map(item => (
                  <div key={item.label} className={'rounded-xl p-3 text-center ' + (item.highlight ? 'bg-purple-900/30 border border-purple-700' : 'bg-[#0D0B09] border border-[#2E2820]')}>
                    <div className={'font-bold text-sm mb-1 ' + (item.highlight ? 'text-[#F5F0EB]' : 'text-gray-300')}>{item.value}</div>
                    <div className="text-xs text-gray-500">{item.label}</div>
                  </div>
                ))}
              </div>

              {result.formatted?.artistNet && (
                <div className="bg-[#0D0B09] border border-[#2E2820] rounded-xl px-4 py-3 flex justify-between items-center">
                  <div className="text-xs text-gray-500">What you keep after gallery</div>
                  <div className="text-sm font-bold text-green-400">{result.formatted.artistNet}</div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold text-[#F5F0EB] flex-shrink-0 mt-0.5">M</div>
                <div className="text-xs text-gray-400 leading-relaxed italic">{result.miraExplanation}</div>
              </div>

              {result.reasons && (
                <div className="space-y-1.5">
                  {result.reasons.map((r: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-500">
                      <span className="text-purple-400 flex-shrink-0">{i + 1}.</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={saveToHistory} disabled={saving || saved}
                  className="flex-1 py-3 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-[#F5F0EB] text-sm rounded-xl transition-all">
                  {saved ? 'Saved ✓' : saving ? 'Saving...' : 'Save to record'}
                </button>
                <button onClick={() => { setShowNew(false); setResult(null); }}
                  className="px-4 py-3 border border-[#3D3530] hover:border-gray-500 text-gray-500 text-sm rounded-xl transition-all">
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#171410] border border-[#3D3530] rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="text-base font-bold mb-2">Remove this entry?</div>
            <p className="text-gray-500 text-sm mb-6">The {formatDate(history[confirmDelete]?.date)} entry will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border border-[#3D3530] text-gray-400 text-sm rounded-xl">Cancel</button>
              <button onClick={() => deleteEntry(confirmDelete)} className="flex-1 py-2.5 bg-red-700 hover:bg-red-600 text-[#F5F0EB] text-sm rounded-xl">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

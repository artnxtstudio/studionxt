'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const CAREER_STAGES = [
  { id: 'Emerging', label: 'Emerging', desc: 'Building exhibition history, first gallery relationships', mult: '1.3×' },
  { id: 'MidCareer', label: 'Mid-career', desc: 'Established gallery representation, consistent sales', mult: '1.6×' },
  { id: 'Institutional', label: 'Institutional', desc: 'Museum shows, major collections, international presence', mult: '1.9×' },
  { id: 'MuseumLevel', label: 'Museum level', desc: 'Retrospectives, permanent collections, auction history', mult: '2.2×' },
  { id: 'BlueChip', label: 'Blue chip', desc: 'Top-tier auction results, global market recognition', mult: '2.8×' },
];

const MARKETS = [
  { id: 'StudioSale', label: 'Studio sales', desc: 'Direct to collector from studio', mult: '1.0×' },
  { id: 'RegionalGallery', label: 'Regional gallery', desc: 'Local and national gallery representation', mult: '1.15×' },
  { id: 'InternationalFair', label: 'International fairs', desc: 'Art Basel, Frieze, TEFAF etc.', mult: '1.25×' },
  { id: 'GlobalMarket', label: 'Global market', desc: 'International galleries, auctions, institutions', mult: '1.35×' },
];

const COUNTRIES = [
  'United States','United Kingdom','Germany','France','Italy','Netherlands',
  'Switzerland','India','China','Japan','Australia','Canada','Brazil',
  'South Korea','UAE','Mexico','Spain','Belgium','Austria','Sweden','Other',
];

const CURRENCIES: Record<string,string> = {
  'United States':'USD','United Kingdom':'GBP','Germany':'EUR','France':'EUR',
  'Italy':'EUR','Netherlands':'EUR','Switzerland':'CHF','India':'INR','China':'CNY',
  'Japan':'JPY','Australia':'AUD','Canada':'CAD','Brazil':'BRL','South Korea':'KRW',
  'UAE':'AED','Mexico':'MXN','Spain':'EUR','Belgium':'EUR','Austria':'EUR',
  'Sweden':'SEK','Other':'USD',
};

export default function PricingSettings() {
  const router = useRouter();
  const [userId, setUserId] = useState('demo-user');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [miraAssessing, setMiraAssessing] = useState(false);
  const [miraAssessment, setMiraAssessment] = useState('');
  const [settings, setSettings] = useState({
    careerStage: '', primaryMarket: '', country: '', currency: 'USD',
    hourlyRate: '50', galleryCommission: '50', vatRegistered: false,
    vatPercent: '20', targetAnnualRevenue: '', notes: '',
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const uid = user?.uid || 'demo-user';
      setUserId(uid);
      try {
        const snap = await getDoc(doc(db, 'artists', uid, 'settings', 'pricing'));
        if (snap.exists()) setSettings(s => ({ ...s, ...snap.data() }));
      } catch (err) { console.error(err); }
    });
    return () => unsubscribe();
  }, []);

  function setS(key: string, value: string | boolean) {
    setSettings(s => {
      const u = { ...s, [key]: value };
      if (key === 'country') u.currency = CURRENCIES[value as string] || 'USD';
      return u;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await setDoc(doc(db, 'artists', userId, 'settings', 'pricing'), {
        ...settings, updatedAt: new Date().toISOString(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  async function assessCareerStage() {
    setMiraAssessing(true);
    setMiraAssessment('');
    try {
      const res = await fetch('/api/mira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `You are assessing an artist's career stage for pricing purposes. The five stages are: Emerging (1.3× multiplier — building exhibition history), Mid-career (1.6× — established gallery, consistent sales), Institutional (1.9× — museum shows, major collections), Museum level (2.2× — retrospectives, permanent collections), Blue chip (2.8× — top auction results, global recognition). Based on the context provided, give a 2-sentence assessment and clearly state which stage you recommend. Be direct and honest.`,
          artistContext: { country: settings.country, notes: settings.notes },
        }),
      });
      const data = await res.json();
      setMiraAssessment(data.response || '');
    } catch (err) { console.error(err); }
    finally { setMiraAssessing(false); }
  }

  const inp = 'w-full bg-[#0a0a0a] border border-[#333] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-colors';
  const lbl = 'text-xs text-purple-400 mb-2 block uppercase tracking-widest';
  const multMap: Record<string,string> = { Emerging:'1.3×', MidCareer:'1.6×', Institutional:'1.9×', MuseumLevel:'2.2×', BlueChip:'2.8×' };
  const mktMap: Record<string,string> = { StudioSale:'1.0×', RegionalGallery:'1.15×', InternationalFair:'1.25×', GlobalMarket:'1.35×' };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-24">
      <div className="sticky top-0 z-10 bg-[#0A0A0A]/95 backdrop-blur border-b border-[#111] px-6 py-4 flex justify-between items-center">
        <button onClick={() => router.back()} className="text-gray-500 text-sm hover:text-white transition-colors">Back</button>
        <span className="text-sm font-semibold">Valuation settings</span>
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-1.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-xs rounded-lg transition-all">
          {saved ? 'Saved ✓' : saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-8 space-y-12">

        <div>
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-1">01</div>
          <h2 className="text-xl font-bold mb-1">Career stage</h2>
          <p className="text-gray-500 text-sm mb-6">The most important multiplier in your pricing. Be honest — overpricing at the wrong stage loses collectors.</p>
          <div className="space-y-3 mb-5">
            {CAREER_STAGES.map(stage => (
              <button key={stage.id} onClick={() => setS('careerStage', stage.id)}
                className={'w-full flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all ' + (settings.careerStage === stage.id ? 'border-purple-500 bg-purple-900/20' : 'border-[#222] hover:border-purple-700 bg-[#111]')}>
                <div className={'w-4 h-4 rounded-full border-2 flex-shrink-0 ' + (settings.careerStage === stage.id ? 'border-purple-500 bg-purple-500' : 'border-[#444]')} />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white mb-0.5">{stage.label}</div>
                  <div className="text-xs text-gray-500">{stage.desc}</div>
                </div>
                <div className="text-xs text-purple-400 font-mono">{stage.mult}</div>
              </button>
            ))}
          </div>
          <div className="bg-[#111] border border-[#1a1a2e] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-purple-400">Not sure? Let Mira assess your career stage</div>
              <button onClick={assessCareerStage} disabled={miraAssessing}
                className="text-xs px-3 py-1.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white rounded-lg transition-all">
                {miraAssessing ? 'Assessing...' : 'Ask Mira'}
              </button>
            </div>
            {miraAssessment ? (
              <div className="text-sm text-gray-300 leading-relaxed">{miraAssessment}</div>
            ) : (
              <div className="text-xs text-gray-600">Mira reads your archive, exhibition history and voice sessions to suggest the right stage.</div>
            )}
          </div>
        </div>

        <div>
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-1">02</div>
          <h2 className="text-xl font-bold mb-1">Market and geography</h2>
          <p className="text-gray-500 text-sm mb-6">Where you sell affects pricing. A studio sale in Berlin prices differently than a fair in New York.</p>
          <div className="space-y-3 mb-6">
            {MARKETS.map(m => (
              <button key={m.id} onClick={() => setS('primaryMarket', m.id)}
                className={'w-full flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all ' + (settings.primaryMarket === m.id ? 'border-purple-500 bg-purple-900/20' : 'border-[#222] hover:border-purple-700 bg-[#111]')}>
                <div className={'w-4 h-4 rounded-full border-2 flex-shrink-0 ' + (settings.primaryMarket === m.id ? 'border-purple-500 bg-purple-500' : 'border-[#444]')} />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white mb-0.5">{m.label}</div>
                  <div className="text-xs text-gray-500">{m.desc}</div>
                </div>
                <div className="text-xs text-purple-400 font-mono">{m.mult}</div>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Country of practice</label>
              <select value={settings.country} onChange={e => setS('country', e.target.value)} className={inp}>
                <option value="">Select country...</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Currency</label>
              <input value={settings.currency} readOnly className={inp + ' opacity-60 cursor-not-allowed'} />
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-1">03</div>
          <h2 className="text-xl font-bold mb-1">Production economics</h2>
          <p className="text-gray-500 text-sm mb-6">Your time has value. Set your hourly rate once — it flows into every valuation.</p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={lbl}>Hourly rate ({settings.currency})</label>
              <input value={settings.hourlyRate} onChange={e => setS('hourlyRate', e.target.value)} placeholder="50" className={inp} />
              <div className="text-xs text-gray-600 mt-1">What is one hour of your time worth?</div>
            </div>
            <div>
              <label className={lbl}>Gallery commission %</label>
              <input value={settings.galleryCommission} onChange={e => setS('galleryCommission', e.target.value)} placeholder="50" className={inp} />
              <div className="text-xs text-gray-600 mt-1">Standard split with your gallery</div>
            </div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-2xl p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={settings.vatRegistered} onChange={e => setS('vatRegistered', e.target.checked)} className="w-4 h-4 accent-purple-500" />
              <div>
                <div className="text-sm text-white">VAT / Sales tax registered</div>
                <div className="text-xs text-gray-500">Affects net price calculations</div>
              </div>
            </label>
            {settings.vatRegistered && (
              <div>
                <label className={lbl}>VAT / Tax rate %</label>
                <input value={settings.vatPercent} onChange={e => setS('vatPercent', e.target.value)} placeholder="20" className={inp} />
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-1">04</div>
          <h2 className="text-xl font-bold mb-1">Context for Mira</h2>
          <p className="text-gray-500 text-sm mb-6">Tell Mira anything that affects your pricing — collector relationships, recent sales, institutional context.</p>
          <div className="space-y-4">
            <div>
              <label className={lbl}>Target annual revenue ({settings.currency})</label>
              <input value={settings.targetAnnualRevenue} onChange={e => setS('targetAnnualRevenue', e.target.value)} placeholder="Optional" className={inp} />
            </div>
            <div>
              <label className={lbl}>Notes for Mira</label>
              <textarea value={settings.notes} onChange={e => setS('notes', e.target.value)}
                placeholder="e.g. I sell primarily to European institutions. My work takes 3–6 months each. I have never sold below $5,000."
                rows={4} className={inp + ' resize-none'} />
            </div>
          </div>
        </div>

        {settings.careerStage && settings.primaryMarket && (
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#111] border border-purple-900 rounded-2xl p-6">
            <div className="text-xs text-purple-400 uppercase tracking-widest mb-4">Your valuation profile</div>
            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white mb-1">{multMap[settings.careerStage]}</div>
                <div className="text-xs text-gray-500">Career multiplier</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white mb-1">{mktMap[settings.primaryMarket]}</div>
                <div className="text-xs text-gray-500">Market multiplier</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white mb-1">{settings.galleryCommission}%</div>
                <div className="text-xs text-gray-500">Gallery keeps</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 text-center">These multipliers apply to every valuation Mira calculates.</div>
          </div>
        )}

        <button onClick={handleSave} disabled={saving}
          className="w-full py-4 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-sm font-medium rounded-2xl transition-all">
          {saved ? 'Saved ✓' : saving ? 'Saving...' : 'Save valuation settings'}
        </button>
      </div>
    </div>
  );
}

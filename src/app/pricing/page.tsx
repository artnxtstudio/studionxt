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

const STEPS = [
  { id: 1, title: 'Career stage', subtitle: 'The most important multiplier in your pricing' },
  { id: 2, title: 'Your market', subtitle: 'Where you primarily sell your work' },
  { id: 3, title: 'Geography', subtitle: 'Country and currency of your practice' },
  { id: 4, title: 'Economics', subtitle: 'Your time and gallery arrangements' },
  { id: 5, title: 'Context for Mira', subtitle: 'Additional information that affects your valuation' },
];

export default function PricingSettings() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState('');
  const [saving, setSaving] = useState(false);
  const [miraAssessing, setMiraAssessing] = useState(false);
  const [miraAssessment, setMiraAssessment] = useState('');

  const [settings, setSettings] = useState({
    careerStage: '', primaryMarket: '', country: '', currency: 'USD',
    hourlyRate: '50', galleryCommission: '50', vatRegistered: false,
    vatPercent: '20', targetAnnualRevenue: '', notes: '',
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const uid = user?.uid || '';
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
      router.push('/profile');
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  async function assessCareerStage() {
    setMiraAssessing(true);
    setMiraAssessment('');
    try {
      const res = await fetch('/api/mira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-uid': auth.currentUser?.uid || '' },
        body: JSON.stringify({
          query: `Assess this artist's career stage for pricing. Options: Emerging (1.3×), Mid-career (1.6×), Institutional (1.9×), Museum level (2.2×), Blue chip (2.8×). Context: ${settings.notes || 'No additional context provided.'}. Give 2 sentences and state your recommendation clearly.`,
          artistContext: {},
        }),
      });
      const data = await res.json();
      setMiraAssessment(data.response || '');
    } catch (err) { console.error(err); }
    finally { setMiraAssessing(false); }
  }

  function canNext() {
    if (step === 1) return !!settings.careerStage;
    if (step === 2) return !!settings.primaryMarket;
    if (step === 3) return !!settings.country;
    return true;
  }

  const inp = 'w-full bg-background border border-default text-primary rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-colors';
  const lbl = 'text-xs text-purple-400 mb-2 block uppercase tracking-widest';
  const multMap: Record<string,string> = { Emerging:'1.3×', MidCareer:'1.6×', Institutional:'1.9×', MuseumLevel:'2.2×', BlueChip:'2.8×' };
  const mktMap: Record<string,string> = { StudioSale:'1.0×', RegionalGallery:'1.15×', InternationalFair:'1.25×', GlobalMarket:'1.35×' };

  return (
    <div className="min-h-screen bg-background text-primary">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-[#221A12] px-6 py-4 flex justify-between items-center">
        <button onClick={() => step === 1 ? router.back() : setStep(s => s - 1)}
          className="text-secondary text-sm hover:text-primary transition-colors">
          {step === 1 ? 'Back' : '← Back'}
        </button>
        <div className="flex gap-1">
          {STEPS.map(s => (
            <div key={s.id} className={'h-1 w-8 rounded-full transition-all ' + (s.id <= step ? 'bg-purple-500' : 'bg-card-hover')} />
          ))}
        </div>
        <div className="text-xs text-muted">{step} of {STEPS.length}</div>
      </div>

      <div className="max-w-lg mx-auto px-6 pt-10 pb-32">
        <div className="mb-8">
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-2">
            Valuation settings · {step} of {STEPS.length}
          </div>
          <h1 className="text-2xl font-bold text-primary mb-1">{STEPS[step-1].title}</h1>
          <p className="text-secondary text-sm">{STEPS[step-1].subtitle}</p>
        </div>

        {step === 1 && (
          <div className="space-y-3">
            {CAREER_STAGES.map(stage => (
              <button key={stage.id} onClick={() => setS('careerStage', stage.id)}
                className={'w-full flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all ' + (settings.careerStage === stage.id ? 'border-purple-500 bg-purple-900/20' : 'border-default hover:border-purple-700 bg-card')}>
                <div className={'w-4 h-4 rounded-full border-2 flex-shrink-0 ' + (settings.careerStage === stage.id ? 'border-purple-500 bg-purple-500' : 'border-[#444]')} />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-primary mb-0.5">{stage.label}</div>
                  <div className="text-xs text-secondary">{stage.desc}</div>
                </div>
                <div className="text-xs text-purple-400 font-mono flex-shrink-0">{stage.mult}</div>
              </button>
            ))}
            <div className="bg-card border border-default rounded-2xl p-4 mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-purple-400">Not sure? Ask Mira</div>
                <button onClick={assessCareerStage} disabled={miraAssessing}
                  className="text-xs px-3 py-1.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white rounded-lg transition-all">
                  {miraAssessing ? 'Thinking...' : 'Ask Mira'}
                </button>
              </div>
              {miraAssessment ? (
                <div className="text-sm text-primary leading-relaxed">{miraAssessment}</div>
              ) : (
                <div className="text-xs text-muted">Mira reads your archive and voice sessions to suggest the right stage.</div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {MARKETS.map(m => (
              <button key={m.id} onClick={() => setS('primaryMarket', m.id)}
                className={'w-full flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all ' + (settings.primaryMarket === m.id ? 'border-purple-500 bg-purple-900/20' : 'border-default hover:border-purple-700 bg-card')}>
                <div className={'w-4 h-4 rounded-full border-2 flex-shrink-0 ' + (settings.primaryMarket === m.id ? 'border-purple-500 bg-purple-500' : 'border-[#444]')} />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-primary mb-0.5">{m.label}</div>
                  <div className="text-xs text-secondary">{m.desc}</div>
                </div>
                <div className="text-xs text-purple-400 font-mono flex-shrink-0">{m.mult}</div>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className={lbl}>Country of practice</label>
              <select value={settings.country} onChange={e => setS('country', e.target.value)} className={inp}>
                <option value="">Select your country...</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {settings.country && (
              <div className="bg-card border border-default rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <div className="text-xs text-secondary mb-1">Currency detected</div>
                  <div className="text-lg font-bold text-primary">{settings.currency}</div>
                </div>
                <div className="text-xs text-muted">All valuations will use {settings.currency}</div>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <label className={lbl}>Your hourly rate ({settings.currency})</label>
              <input value={settings.hourlyRate} onChange={e => setS('hourlyRate', e.target.value)}
                placeholder="50" className={inp} />
              <div className="text-xs text-muted mt-2">What is one hour of your making time worth? This flows into every valuation.</div>
            </div>
            <div>
              <label className={lbl}>Gallery commission %</label>
              <input value={settings.galleryCommission} onChange={e => setS('galleryCommission', e.target.value)}
                placeholder="50" className={inp} />
              <div className="text-xs text-muted mt-2">The standard split with your gallery. 50% is most common.</div>
            </div>
            <div>
              <label className={lbl}>Target annual revenue ({settings.currency})</label>
              <input value={settings.targetAnnualRevenue} onChange={e => setS('targetAnnualRevenue', e.target.value)}
                placeholder="Optional" className={inp} />
              <div className="text-xs text-muted mt-2">Helps Mira assess whether your pricing supports your practice.</div>
            </div>
            <div className="bg-card border border-default rounded-2xl p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={settings.vatRegistered}
                  onChange={e => setS('vatRegistered', e.target.checked)} className="w-4 h-4 accent-purple-500" />
                <div>
                  <div className="text-sm text-primary">VAT / Sales tax registered</div>
                  <div className="text-xs text-secondary">Affects net price calculations</div>
                </div>
              </label>
              {settings.vatRegistered && (
                <div className="mt-4">
                  <label className={lbl}>VAT / Tax rate %</label>
                  <input value={settings.vatPercent} onChange={e => setS('vatPercent', e.target.value)}
                    placeholder="20" className={inp} />
                </div>
              )}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <div>
              <label className={lbl}>Notes for Mira</label>
              <textarea value={settings.notes} onChange={e => setS('notes', e.target.value)}
                placeholder="Tell Mira anything relevant — collector relationships, recent sales, institutional context, how long your works take to make, your price history..."
                rows={6} className={inp + ' resize-none'} />
            </div>

            {settings.careerStage && settings.primaryMarket && (
              <div className="bg-gradient-to-br from-[#1a1a2e] to-[#111] border border-purple-900 rounded-2xl p-5">
                <div className="text-xs text-purple-400 uppercase tracking-widest mb-4">Your valuation profile</div>
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                  <div>
                    <div className="text-xl font-bold text-primary mb-1">{multMap[settings.careerStage]}</div>
                    <div className="text-xs text-secondary">Career</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-primary mb-1">{mktMap[settings.primaryMarket]}</div>
                    <div className="text-xs text-secondary">Market</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-primary mb-1">{settings.galleryCommission}%</div>
                    <div className="text-xs text-secondary">Gallery</div>
                  </div>
                </div>
                <div className="text-xs text-muted text-center">Mira will use these for every valuation — no inputs needed per artwork.</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-[#221A12] px-6 py-4">
        <div className="max-w-lg mx-auto">
          {step < 5 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="w-full py-4 bg-purple-700 hover:bg-purple-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium rounded-2xl transition-all">
              Continue →
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="w-full py-4 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-sm font-medium rounded-2xl transition-all">
              {saving ? 'Saving...' : 'Save valuation settings'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

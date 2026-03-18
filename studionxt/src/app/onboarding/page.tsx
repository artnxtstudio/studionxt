'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const questions = {
  practiceTypes: ['Painter','Sculptor','Photographer','Printmaker','Mixed Media','Digital','Installation','Other'],
  mediums: {
    Painter: ['Oil','Acrylic','Watercolour','Gouache','Tempera'],
    Sculptor: ['Bronze','Marble','Wood','Found Objects','Ceramic'],
    Photographer: ['Film','Digital','Darkroom','Large Format','Instant'],
    Printmaker: ['Etching','Screen Print','Lithograph','Woodcut','Risograph'],
    'Mixed Media': ['Collage','Assemblage','Textile','Paper','Paint'],
    Digital: ['3D','Motion','Illustration','Generative','Photography'],
    Installation: ['Sound','Light','Video','Sculpture','Performance'],
    Other: ['Drawing','Painting','Sculpture','Performance','Text'],
  },
  countries: ['United Kingdom','United States','Australia','Canada','Germany','France','Netherlands','Ireland','Other'],
  careerLengths: ['Under 2 years','2–5 years','5–10 years','10–20 years','20+ years'],
  intents: ['Organise my archive','Write professional documents','Price and sell my work','All of the above'],
};

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [answers, setAnswers] = useState({
    name: '',
    practiceType: '',
    mediums: [] as string[],
    country: '',
    careerLength: '',
    primaryIntent: '',
  });

  const progress = ((step) / 6) * 100;

  const canNext = [
    answers.name.trim() !== '',
    answers.practiceType !== '',
    answers.mediums.length > 0,
    answers.country !== '',
    answers.careerLength !== '',
    answers.primaryIntent !== '',
  ][step];

  async function handleComplete() {
    setSaving(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) { router.push('/login'); return; }
      await setDoc(doc(db, 'artists', userId), {
        name: answers.name,
        practiceType: answers.practiceType,
        mediums: answers.mediums,
        country: answers.country,
        careerLength: answers.careerLength,
        primaryIntent: answers.primaryIntent,
        createdAt: new Date().toISOString(),
      });
      router.push('/studio');
    } catch (error) {
      console.error('Error saving onboarding:', error);
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0B09] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">

        <div className="flex items-center gap-3 mb-10">
          <span className="text-sm text-purple-400 italic">Mira</span>
          <div className="flex-1 h-1 bg-[#1E1A16] rounded-full">
            <div
              className="h-1 bg-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{step + 1} / 6</span>
        </div>

        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-8">

          {step === 0 && (
            <div>
              <h2 className="text-xl font-semibold text-[#F5F0EB] mb-2">What is your name?</h2>
              <p className="text-sm text-gray-500 mb-6">This is how you will appear in your archive</p>
              <input
                type="text"
                value={answers.name}
                onChange={e => setAnswers(a => ({ ...a, name: e.target.value }))}
                placeholder="Your full name"
                className="w-full bg-[#1E1A16] border border-[#3D3530] text-[#F5F0EB] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500"
                autoFocus
              />
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-[#F5F0EB] mb-6">What kind of artist are you?</h2>
              <div className="flex flex-wrap gap-3">
                {questions.practiceTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setAnswers(a => ({ ...a, practiceType: type, mediums: [] }))}
                    className={`px-4 py-2 rounded-full border text-sm transition-all ${
                      answers.practiceType === type
                        ? 'border-purple-500 bg-purple-900 text-purple-200'
                        : 'border-[#3D3530] text-gray-400 hover:border-purple-700'
                    }`}
                  >{type}</button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-[#F5F0EB] mb-2">What do you primarily work with?</h2>
              <p className="text-sm text-gray-500 mb-6">Choose up to 2</p>
              <div className="flex flex-wrap gap-3">
                {(questions.mediums[answers.practiceType as keyof typeof questions.mediums] || []).map(medium => {
                  const selected = answers.mediums.includes(medium);
                  return (
                    <button
                      key={medium}
                      onClick={() => setAnswers(a => ({
                        ...a,
                        mediums: selected
                          ? a.mediums.filter(m => m !== medium)
                          : a.mediums.length < 2 ? [...a.mediums, medium] : a.mediums
                      }))}
                      className={`px-4 py-2 rounded-full border text-sm transition-all ${
                        selected
                          ? 'border-purple-500 bg-purple-900 text-purple-200'
                          : 'border-[#3D3530] text-gray-400 hover:border-purple-700'
                      }`}
                    >{medium}</button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-[#F5F0EB] mb-6">Where is your studio based?</h2>
              <select
                value={answers.country}
                onChange={e => setAnswers(a => ({ ...a, country: e.target.value }))}
                className="w-full bg-[#1E1A16] border border-[#3D3530] text-[#F5F0EB] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="">Select your country</option>
                {questions.countries.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-xl font-semibold text-[#F5F0EB] mb-6">How long have you been making work?</h2>
              <div className="flex flex-col gap-3">
                {questions.careerLengths.map(length => (
                  <button
                    key={length}
                    onClick={() => setAnswers(a => ({ ...a, careerLength: length }))}
                    className={`px-4 py-3 rounded-lg border text-sm text-left transition-all ${
                      answers.careerLength === length
                        ? 'border-purple-500 bg-purple-900 text-purple-200'
                        : 'border-[#3D3530] text-gray-400 hover:border-purple-700'
                    }`}
                  >{length}</button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="text-xl font-semibold text-[#F5F0EB] mb-6">What do you most want Mira to help with?</h2>
              <div className="flex flex-col gap-3">
                {questions.intents.map(intent => (
                  <button
                    key={intent}
                    onClick={() => setAnswers(a => ({ ...a, primaryIntent: intent }))}
                    className={`px-4 py-3 rounded-lg border text-sm text-left transition-all ${
                      answers.primaryIntent === intent
                        ? 'border-purple-500 bg-purple-900 text-purple-200'
                        : 'border-[#3D3530] text-gray-400 hover:border-purple-700'
                    }`}
                  >{intent}</button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="px-5 py-2 rounded-lg border border-[#3D3530] text-gray-400 text-sm disabled:opacity-30 hover:border-gray-500 transition-all"
            >Back</button>
            <button
              onClick={() => step === 5 ? handleComplete() : setStep(s => s + 1)}
              disabled={!canNext || saving}
              className="px-5 py-2 rounded-lg bg-purple-700 text-[#F5F0EB] text-sm disabled:opacity-40 hover:bg-purple-600 transition-all"
            >{saving ? 'Saving...' : step === 4 ? 'Complete →' : 'Next →'}</button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Your data belongs to you. StudioNXT is the vault, not the owner.
        </p>
      </div>
    </div>
  );
}

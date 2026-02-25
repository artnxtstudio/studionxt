'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface ArtistProfile {
  practiceType: string;
  mediums: string[];
  country: string;
  careerLength: string;
  primaryIntent: string;
}

function formatCareer(careerLength: string): string {
  const map: Record<string, string> = {
    '1-5 Years': 'over 5 years',
    '5-10 Years': 'over a decade',
    '10–20 Years': 'over two decades',
    '10-20 Years': 'over two decades',
    '20+ Years': 'more than 20 years',
    '30+ Years': 'more than 30 years',
    '40+ Years': 'more than 40 years',
    '50+ Years': 'more than 50 years',
  };
  return map[careerLength] || 'decades';
}

const MOCK_BIO = `Carol is one of those rare artists whose work defies the categories that art history prefers. Over more than two decades of sustained practice, she has moved fluidly between sculpture, installation, and found object composition — not as a stylistic choice, but as a natural consequence of how she sees the world.

Her work begins with attention. Carol finds significance in objects and materials that others overlook, and transforms them into compositions that carry both weight and lightness. There is a quiet radicalism in this — a refusal to treat art-making as separate from living.

At 94, Carol's archive represents not just a body of work but a way of being in the world. Each piece is a record of sustained looking, of a mind that has never stopped asking what a thing might become.`;

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [artworkCount, setArtworkCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState<string | null>(null);
  const [generatingBio, setGeneratingBio] = useState(false);
  const [pricingSettings, setPricingSettings] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        const userId = user?.uid || 'demo-user';
        const docRef = doc(db, 'artists', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as ArtistProfile);
        // Load pricing settings
        try {
          const { doc: d2, getDoc: g2 } = await import('firebase/firestore');
          const pSnap = await g2(d2(db, 'artists', userId, 'settings', 'pricing'));
          if (pSnap.exists()) setPricingSettings(pSnap.data());
        } catch {}
        }
        const artworksSnap = await getDocs(
          collection(db, 'artists', userId, 'artworks')
        );
        setArtworkCount(artworksSnap.size);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  async function generateBio() {
    setGeneratingBio(true);
    // Mock: pause for effect, then show bio
    // March 1st: replace with real Mira API call
    await new Promise(r => setTimeout(r, 2200));
    setBio(MOCK_BIO);
    setGeneratingBio(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0B09] flex items-center justify-center">
        <div className="text-purple-400 text-sm animate-pulse">Loading profile...</div>
      </div>
    );
  }

  const careerDisplay = formatCareer(profile?.careerLength || '');
  const mediumDisplay = profile?.mediums?.join(', ') || 'painting and mixed media';

  return (
    <div className="min-h-screen bg-[#0D0B09] text-[#F5F0EB]">
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Name + photo */}
        <div className="flex items-center gap-8 mb-12">
          <div className="w-24 h-24 rounded-full bg-[#1a1a2e] border border-[#2E2820] flex items-center justify-center text-3xl flex-shrink-0">
            🎨
          </div>
          <div>
            <div className="text-xs text-purple-400 uppercase tracking-widest mb-2">Artist Profile</div>
            <h1 className="text-4xl font-bold text-[#F5F0EB] mb-1">Carol</h1>
            <p className="text-gray-400 text-sm">
              {profile?.practiceType || 'Visual Artist'} · {profile?.country || 'United States'}
            </p>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-[#171410] border border-[#1a1a2e] rounded-2xl p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div className="text-xs text-purple-400 uppercase tracking-widest">Bio</div>
            {bio && (
              <span className="text-xs text-gray-600 italic">— written by Mira</span>
            )}
          </div>

          {/* No bio yet */}
          {!bio && !generatingBio && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm mb-2">
                {artworkCount === 0
                  ? 'Upload some artworks first — Mira will use them to write Carol\'s bio.'
                  : `Mira has ${artworkCount} ${artworkCount === 1 ? 'work' : 'works'} to draw from. Ready to write Carol's bio.`
                }
              </p>
              <p className="text-gray-600 text-xs mb-8 italic">
                Takes about 2 seconds. The result is Carol's — export or edit freely.
              </p>
              <button
                onClick={generateBio}
                disabled={artworkCount === 0}
                className="px-8 py-3 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-[#F5F0EB] text-sm rounded-xl transition-all font-medium"
              >
                ✦ Generate Bio with Mira
              </button>
            </div>
          )}

          {/* Generating */}
          {generatingBio && (
            <div className="text-center py-8">
              <div className="flex justify-center gap-1 mb-4">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
              <p className="text-gray-500 text-sm">Mira is writing Carol's bio...</p>
            </div>
          )}

          {/* Bio result */}
          {bio && !generatingBio && (
            <div>
              {bio.split('\n\n').map((paragraph, i) => (
                <p key={i} className="text-gray-300 text-sm leading-relaxed mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
              <div className="mt-8 pt-6 border-t border-[#2E2820] flex gap-3">
                <button
                  onClick={() => navigator.clipboard.writeText(bio)}
                  className="px-4 py-2 text-xs text-gray-400 hover:text-[#F5F0EB] border border-[#2E2820] hover:border-purple-700 rounded-lg transition-all"
                >
                  Copy
                </button>
                <button
                  onClick={() => { setBio(null); generateBio(); }}
                  className="px-4 py-2 text-xs text-gray-400 hover:text-[#F5F0EB] border border-[#2E2820] hover:border-purple-700 rounded-lg transition-all"
                >
                  Regenerate
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Practice details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: 'Practice', value: profile?.practiceType || '—' },
            { label: 'Based in', value: profile?.country || '—' },
            { label: 'Career', value: profile?.careerLength || '—' },
            { label: 'Focus', value: profile?.primaryIntent || '—' },
          ].map(item => (
            <div key={item.label} className="bg-[#171410] border border-[#2E2820] rounded-xl p-5">
              <div className="text-xs text-gray-500 mb-2">{item.label}</div>
              <div className="text-sm text-[#F5F0EB] capitalize">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Exhibitions */}
        <div className="bg-[#171410] border border-[#2E2820] rounded-2xl p-8">
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-4">Exhibitions</div>
          <p className="text-gray-600 text-sm italic">
            Exhibition history will be added after the March studio visit.
          </p>
        </div>


        {/* Valuation profile */}
        {pricingSettings?.careerStage ? (
          <div className="bg-[#171410] border border-[#2E2820] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2318]">
              <div className="text-xs text-purple-400 uppercase tracking-widest">Valuation profile</div>
              <button onClick={() => router.push('/pricing')} className="text-xs text-gray-500 hover:text-[#F5F0EB] transition-colors">Edit</button>
            </div>
            <div className="grid grid-cols-3 divide-x divide-[#1a1a1a]">
              {[
                { label: 'Career stage', value: pricingSettings.careerStage?.replace('MidCareer','Mid-career').replace('MuseumLevel','Museum level').replace('BlueChip','Blue chip') },
                { label: 'Primary market', value: pricingSettings.primaryMarket?.replace('RegionalGallery','Regional gallery').replace('InternationalFair','Intl fair').replace('GlobalMarket','Global market').replace('StudioSale','Studio sale') },
                { label: 'Gallery split', value: (pricingSettings.galleryCommission || '50') + '%' },
              ].map(item => (
                <div key={item.label} className="px-5 py-4 text-center">
                  <div className="text-sm font-semibold text-[#F5F0EB] mb-1">{item.value || '—'}</div>
                  <div className="text-xs text-gray-500">{item.label}</div>
                </div>
              ))}
            </div>
            {pricingSettings.country && (
              <div className="px-5 py-3 border-t border-[#2A2318] flex justify-between items-center">
                <div className="text-xs text-gray-500">{pricingSettings.country} · {pricingSettings.currency} · {pricingSettings.hourlyRate || '50'}/hr</div>
                <div className="text-xs text-green-400">Active</div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#171410] border border-[#2E2820] rounded-2xl p-6 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[#F5F0EB] mb-1">Valuation profile</div>
              <div className="text-xs text-gray-500">Set once. Mira uses it for every valuation — no inputs per artwork.</div>
            </div>
            <button onClick={() => router.push('/pricing')}
              className="ml-4 flex-shrink-0 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-[#F5F0EB] text-xs rounded-xl transition-all">
              Configure
            </button>
          </div>
        )}

      </div>

        {/* Footer links */}
        <div className="flex justify-center gap-6 pt-4 pb-8">
          <button onClick={() => router.push('/about')} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">About</button>
          <span className="text-gray-700">·</span>
          <button onClick={() => router.push('/privacy')} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Privacy</button>
        </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth, storage } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';

const MEDIUMS = [
  { label: 'Painting', is3D: false },
  { label: 'Drawing', is3D: false },
  { label: 'Photography', is3D: false },
  { label: 'Print', is3D: false },
  { label: 'Sculpture', is3D: true },
  { label: 'Ceramic', is3D: true },
  { label: 'Installation', is3D: true },
  { label: 'Mixed Media', is3D: false },
  { label: 'Digital', is3D: false },
  { label: 'Other', is3D: false },
];

export default function Upload() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [userId, setUserId] = useState('demo-user');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [form, setForm] = useState({
    medium: '', title: '', year: '',
    width: '', height: '', depth: '', weight: '',
    hasEdition: false, editionTotal: '', editionAPs: '', editionSold: '', apHolders: '',
    status: 'Available', price: '',
    locationCurrent: '', condition: 'Good', seriesName: '',
  });

  useEffect(() => {
    const pending = sessionStorage.getItem('pendingImage');
    const pendingName = sessionStorage.getItem('pendingImageName');
    if (pending) {
      setImagePreview(pending);
      setStep(1);
      sessionStorage.removeItem('pendingImage');
      sessionStorage.removeItem('pendingImageName');
    }
    const unsubscribe = onAuthStateChanged(auth, user => {
      setUserId(user?.uid || 'demo-user');
    });
    return () => unsubscribe();
  }, []);

  function setF(key: string, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function handleFile(file: File) {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setStep(1);
  }

  async function handleSave() {
    setSaving(true);
    try {
      let imageUrl = imagePreview;
      let originalUrl = '';
      if (imageFile) {
        setUploadingImage(true);
        const timestamp = Date.now();
        const imgRef = ref(storage, 'artworks/' + userId + '/' + timestamp + '_' + imageFile.name);
        await uploadBytes(imgRef, imageFile);
        imageUrl = await getDownloadURL(imgRef);
        originalUrl = imageUrl;
        setUploadingImage(false);
      }
      const sel = MEDIUMS.find(m => m.label === form.medium);
      const is3D = sel?.is3D ?? false;
      const parts = [form.width, form.height, is3D ? form.depth : ''].filter(Boolean);
      const dimensions = parts.length ? parts.join(' x ') + ' in' : '';
      await addDoc(collection(db, 'artists', userId, 'artworks'), {
        ...form,
        dimensions,
        imageUrl,
        originalUrl,
        createdAt: new Date().toISOString(),
        userId,
      });
      router.push('/studio');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const input = 'w-full bg-[#0a0a0a] border border-[#333] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-colors';
  const label = 'text-xs text-purple-400 mb-1.5 block';
  const sel = MEDIUMS.find(m => m.label === form.medium);
  const is3D = sel?.is3D ?? false;
  const isEdition = ['Photography', 'Print'].includes(form.medium);

  if (step === 0) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <button onClick={() => router.back()} className="text-gray-500 text-sm mb-8 hover:text-white transition-colors">Back</button>
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-2">Add artwork</div>
          <h1 className="text-2xl font-bold mb-2">Start with a photo</h1>
          <p className="text-gray-500 text-sm mb-10">Take a photo or upload from your library. Details come after.</p>
          <div className="space-y-3">
            <label className="flex items-center gap-4 w-full px-5 py-4 bg-purple-700 hover:bg-purple-600 rounded-2xl cursor-pointer transition-all">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <div className="text-left">
                <div className="text-sm font-semibold">Take photo</div>
                <div className="text-xs text-purple-300">Open camera</div>
              </div>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </label>
            <label className="flex items-center gap-4 w-full px-5 py-4 bg-[#111] border border-[#333] hover:border-purple-700 rounded-2xl cursor-pointer transition-all">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <div className="text-left">
                <div className="text-sm font-semibold text-white">Upload from library</div>
                <div className="text-xs text-gray-500">Choose existing photo</div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-24">
      <div className="sticky top-0 z-10 bg-[#0A0A0A]/95 backdrop-blur border-b border-[#111] px-4 py-3 flex justify-between items-center">
        <button onClick={() => setStep(s => s - 1)} className="text-gray-500 text-sm hover:text-white transition-colors">
          {step === 1 ? 'Back' : 'Back'}
        </button>
        <div className="flex gap-1">
          {[1,2,3,4].map(s => (
            <div key={s} className={'h-1 w-8 rounded-full transition-all ' + (s <= step ? 'bg-purple-500' : 'bg-[#222]')} />
          ))}
        </div>
        {step === 4 ? (
          <button onClick={handleSave} disabled={saving} className="text-sm text-purple-400 hover:text-purple-300 disabled:opacity-40 font-medium transition-colors">
            {saving ? 'Saving...' : 'Save'}
          </button>
        ) : (
          <button onClick={() => setStep(s => s + 1)} className="text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors">
            Next
          </button>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {imagePreview && (
          <div className="mb-6 relative">
            <img src={imagePreview} alt="Artwork" className="w-full object-contain max-h-64 rounded-2xl bg-[#111]" />
            <button
              onClick={() => { setStep(0); setImagePreview(''); setImageFile(null); }}
              className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white text-sm hover:bg-black/80 transition-all"
            >
              ✕
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="text-lg font-semibold text-white">About the work</div>
            <div>
              <label className={label}>Medium</label>
              <select value={form.medium} onChange={e => setF('medium', e.target.value)} className={input}>
                <option value="">Select medium...</option>
                {MEDIUMS.map(m => <option key={m.label} value={m.label}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Title</label>
              <input value={form.title} onChange={e => setF('title', e.target.value)} placeholder="What is this work called?" className={input} />
            </div>
            <div>
              <label className={label}>Year</label>
              <input value={form.year} onChange={e => setF('year', e.target.value)} placeholder="e.g. 1987 or c. 1990" className={input} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="text-lg font-semibold text-white">Size and editions</div>
            <div>
              <label className={label}>Dimensions (inches)</label>
              <div className={is3D ? 'grid grid-cols-3 gap-3' : 'grid grid-cols-2 gap-3'}>
                <div>
                  <label className={label}>Width</label>
                  <input value={form.width} onChange={e => setF('width', e.target.value)} placeholder="in" className={input} />
                </div>
                <div>
                  <label className={label}>Height</label>
                  <input value={form.height} onChange={e => setF('height', e.target.value)} placeholder="in" className={input} />
                </div>
                {is3D && (
                  <div>
                    <label className={label}>Depth</label>
                    <input value={form.depth} onChange={e => setF('depth', e.target.value)} placeholder="in" className={input} />
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className={label}>Weight (lbs)</label>
              <input value={form.weight} onChange={e => setF('weight', e.target.value)} placeholder="Optional" className={input} />
            </div>
            {isEdition && (
              <div className="border-t border-[#1a1a1a] pt-4 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.hasEdition} onChange={e => setF('hasEdition', e.target.checked)} className="w-4 h-4 accent-purple-500" />
                  <span className="text-sm text-white">This is an edition</span>
                </label>
                {form.hasEdition && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={label}>Edition size</label>
                        <input value={form.editionTotal} onChange={e => setF('editionTotal', e.target.value)} placeholder="e.g. 10" className={input} />
                      </div>
                      <div>
                        <label className={label}>APs</label>
                        <input value={form.editionAPs} onChange={e => setF('editionAPs', e.target.value)} placeholder="e.g. 2" className={input} />
                      </div>
                    </div>
                    <div>
                      <label className={label}>Editions sold</label>
                      <input value={form.editionSold} onChange={e => setF('editionSold', e.target.value)} placeholder="e.g. 3" className={input} />
                    </div>
                    <div>
                      <label className={label}>Who holds the APs</label>
                      <input value={form.apHolders} onChange={e => setF('apHolders', e.target.value)} placeholder="e.g. Artist, MoMA" className={input} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="text-lg font-semibold text-white">Status and price</div>
            <div>
              <label className={label}>Status</label>
              <div className="grid grid-cols-2 gap-2">
                {['Available', 'Sold', 'Consigned', 'Not for sale'].map(s => (
                  <button
                    key={s}
                    onClick={() => setF('status', s)}
                    className={'px-4 py-3 rounded-xl border text-sm transition-all text-left ' + (form.status === s ? 'border-purple-500 bg-purple-900/30 text-white' : 'border-[#333] text-gray-400 hover:border-purple-700')}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={label}>Asking price (USD)</label>
              <input value={form.price} onChange={e => setF('price', e.target.value)} placeholder="Leave blank if unsure" className={input} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div className="text-lg font-semibold text-white">Location and condition</div>
            <div>
              <label className={label}>Where is this work now?</label>
              <input value={form.locationCurrent} onChange={e => setF('locationCurrent', e.target.value)} placeholder="e.g. Studio, gallery, storage" className={input} />
            </div>
            <div>
              <label className={label}>Condition</label>
              <div className="grid grid-cols-2 gap-2">
                {['Excellent', 'Good', 'Fair', 'Poor'].map(c => (
                  <button
                    key={c}
                    onClick={() => setF('condition', c)}
                    className={'px-4 py-3 rounded-xl border text-sm transition-all ' + (form.condition === c ? 'border-purple-500 bg-purple-900/30 text-white' : 'border-[#333] text-gray-400 hover:border-purple-700')}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={label}>Series name</label>
              <input value={form.seriesName} onChange={e => setF('seriesName', e.target.value)} placeholder="Optional" className={input} />
            </div>
            {uploadingImage && (
              <div className="text-xs text-purple-400 animate-pulse">Uploading image...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

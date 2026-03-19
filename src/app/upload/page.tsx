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

const CLASSIFICATIONS = [
  { id: 'Unique', label: 'Unique', sub: '1 of 1', desc: 'One original work. No copies exist or will be made.' },
  { id: 'LimitedEdition', label: 'Limited Edition', sub: 'Fixed number', desc: 'A declared number of copies. Edition size cannot increase after declaration.' },
  { id: 'OpenEdition', label: 'Open Edition', sub: 'Unlimited', desc: 'No fixed limit on copies. Must be clearly marked as open edition.' },
];

const MARKING_TYPES = ['Numbered', 'Embossed', 'Stamped', 'Engraved', 'Blind stamp', 'Chop mark', 'Other'];
const STATUSES = ['Available', 'Sold', 'Consigned', 'Not for sale'];
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor'];

export default function Upload() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [userId, setUserId] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [form, setForm] = useState({
    medium: '', title: '', year: '', materials: '', productionTechnique: '', printer: '', publisher: '',
    width: '', height: '', depth: '', weight: '',
    classification: 'Unique' as 'Unique' | 'LimitedEdition' | 'OpenEdition',
    editionSize: '', apCount: '', signatureDetails: '', markingType: '', certificateIssued: false,
    status: 'Available', price: '', locationCurrent: '', locationType: 'Studio', locationDetail: '', locationContact: '', locationSince: '', condition: 'Good',
  });

  useEffect(() => {
    const pending = sessionStorage.getItem('pendingImage');
    if (pending) {
      setImagePreview(pending);
      setStep(1);
      sessionStorage.removeItem('pendingImage');
      sessionStorage.removeItem('pendingImageName');
    }
    const unsubscribe = onAuthStateChanged(auth, user => { if (!user) { router.push('/login'); return; } setUserId(user.uid); });
    return () => unsubscribe();
  }, []);

  function setF(key: string, value: string | boolean) { setForm(f => ({ ...f, [key]: value })); }

  function handleFile(file: File) {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setStep(1);
  }

  function canNext(): boolean {
    if (step === 1) return !!(form.medium && form.title && form.year);
    if (step === 2) return !!(form.width && form.height);
    if (step === 3) {
      if (form.classification === 'LimitedEdition') return !!(form.editionSize && parseInt(form.editionSize) > 0);
      return true;
    }
    return true;
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
      let ledger: any[] = [];
      if (form.classification === 'LimitedEdition' && form.editionSize) {
        const edSize = parseInt(form.editionSize) || 0;
        const apSize = parseInt(form.apCount) || 0;
        for (let i = 1; i <= edSize; i++) {
          ledger.push({ id: 'ed-' + i, number: i + '/' + edSize, type: 'Edition', status: 'Available', collectorName: '', collectorType: '', salePrice: '', currency: 'USD', invoiceNumber: '', saleDate: '', currentLocation: '', provenanceNotes: '' });
        }
        for (let i = 1; i <= apSize; i++) {
          ledger.push({ id: 'ap-' + i, number: 'AP ' + i + '/' + apSize, type: 'AP', status: 'ArtistRetained', collectorName: '', collectorType: '', salePrice: '', currency: 'USD', invoiceNumber: '', saleDate: '', currentLocation: 'Studio', provenanceNotes: '' });
        }
      }
      await addDoc(collection(db, 'artists', userId, 'artworks'), {
        title: form.title, year: form.year, medium: form.medium, materials: form.materials,
        productionTechnique: form.productionTechnique, printer: form.printer, publisher: form.publisher,
        dimensions, width: form.width, height: form.height, depth: form.depth, weight: form.weight,
        classification: form.classification,
        editionSize: form.classification === 'LimitedEdition' ? form.editionSize : '',
        apCount: form.classification === 'LimitedEdition' ? form.apCount : '',
        editionSizeLocked: form.classification === 'LimitedEdition',
        signatureDetails: form.signatureDetails, markingType: form.markingType,
        certificateIssued: form.certificateIssued, ledger,
        status: form.status, price: form.price, locationCurrent: form.locationDetail || form.locationType, locationType: form.locationType, locationDetail: form.locationDetail, locationContact: form.locationContact, locationSince: form.locationSince, locationVerified: new Date().toISOString(),
        condition: form.condition,
        imageUrl, originalUrl, createdAt: new Date().toISOString(), userId,
      });
      router.push('/studio');
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  const inp = 'w-full bg-[#0D0B09] border border-[#3D3530] text-[#F5F0EB] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-colors';
  const lbl = 'text-xs text-purple-400 mb-1.5 block';
  const sel = MEDIUMS.find(m => m.label === form.medium);
  const is3D = sel?.is3D ?? false;
  const totalWorks = form.classification === 'LimitedEdition' ? (parseInt(form.editionSize) || 0) + (parseInt(form.apCount) || 0) : 0;

  if (step === 0) {
    return (
      <div className="min-h-screen bg-[#0D0B09] text-[#F5F0EB] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <button onClick={() => router.back()} className="text-gray-500 text-sm mb-8 hover:text-[#F5F0EB] transition-colors">Back</button>
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-2">Add artwork</div>
          <h1 className="text-2xl font-bold mb-2">Start with a photo</h1>
          <p className="text-gray-500 text-sm mb-10">Take a photo or upload from your library. Details come after.</p>
          <div className="space-y-3">
            <label className="flex items-center gap-4 w-full px-5 py-4 bg-purple-700 hover:bg-purple-600 rounded-2xl cursor-pointer transition-all">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
              <div className="text-left"><div className="text-sm font-semibold">Take photo</div><div className="text-xs text-purple-300">Open camera</div></div>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </label>
            <label className="flex items-center gap-4 w-full px-5 py-4 bg-[#171410] border border-[#3D3530] hover:border-purple-700 rounded-2xl cursor-pointer transition-all">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <div className="text-left"><div className="text-sm font-semibold text-[#F5F0EB]">Upload from library</div><div className="text-xs text-gray-500">Choose existing photo</div></div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0B09] text-[#F5F0EB] pb-32">
      <div className="sticky top-0 z-10 bg-[#0D0B09]/95 backdrop-blur border-b border-[#221A12] px-4 py-3 flex justify-between items-center">
        <button onClick={() => step === 1 ? setStep(0) : setStep(s => s - 1)} className="text-gray-500 text-sm hover:text-[#F5F0EB] transition-colors">Back</button>
        <div className="flex gap-1">{[1,2,3,4].map(s => (<div key={s} className={'h-1 w-8 rounded-full transition-all ' + (s <= step ? 'bg-purple-500' : 'bg-[#222]')} />))}</div>
        <div className="w-10" />
      </div>
      <div className="max-w-lg mx-auto px-4 pt-4">
        {imagePreview && (
          <div className="mb-6 relative">
            <img src={imagePreview} alt="Artwork" className="w-full object-contain max-h-56 rounded-2xl bg-[#171410]" />
            <button onClick={() => { setStep(0); setImagePreview(''); setImageFile(null); }} className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-[#F5F0EB] text-sm">X</button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div><div className="text-xs text-purple-400 uppercase tracking-widest mb-1">Step 1 of 4</div><h2 className="text-xl font-bold">About the work</h2></div>
            <div><label className={lbl}>Medium</label><select value={form.medium} onChange={e => setF('medium', e.target.value)} className={inp}><option value="">Select medium...</option>{MEDIUMS.map(m => <option key={m.label} value={m.label}>{m.label}</option>)}</select></div>
            <div><label className={lbl}>Title</label><input value={form.title} onChange={e => setF('title', e.target.value)} placeholder="What is this work called?" className={inp} /></div>
            <div><label className={lbl}>Year</label><input value={form.year} onChange={e => setF('year', e.target.value)} placeholder="e.g. 1987 or c. 1990" className={inp} /></div>
            <div><label className={lbl}>Materials</label><input value={form.materials} onChange={e => setF('materials', e.target.value)} placeholder="e.g. Oil on linen, found leather, cast bronze" className={inp} /></div>
            <div><label className={lbl}>Production technique</label><input value={form.productionTechnique} onChange={e => setF('productionTechnique', e.target.value)} placeholder="Optional" className={inp} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Printer / Foundry</label><input value={form.printer} onChange={e => setF('printer', e.target.value)} placeholder="Optional" className={inp} /></div>
              <div><label className={lbl}>Publisher</label><input value={form.publisher} onChange={e => setF('publisher', e.target.value)} placeholder="Optional" className={inp} /></div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div><div className="text-xs text-purple-400 uppercase tracking-widest mb-1">Step 2 of 4</div><h2 className="text-xl font-bold">Dimensions</h2></div>
            <div><label className={lbl}>Size (inches)</label>
              <div className={is3D ? 'grid grid-cols-3 gap-3' : 'grid grid-cols-2 gap-3'}>
                <div><label className={lbl}>Width</label><input value={form.width} onChange={e => setF('width', e.target.value)} placeholder="in" className={inp} /></div>
                <div><label className={lbl}>Height</label><input value={form.height} onChange={e => setF('height', e.target.value)} placeholder="in" className={inp} /></div>
                {is3D && <div><label className={lbl}>Depth</label><input value={form.depth} onChange={e => setF('depth', e.target.value)} placeholder="in" className={inp} /></div>}
              </div>
            </div>
            {is3D && <div><label className={lbl}>Weight (lbs)</label><input value={form.weight} onChange={e => setF('weight', e.target.value)} placeholder="Optional" className={inp} /></div>}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div><div className="text-xs text-purple-400 uppercase tracking-widest mb-1">Step 3 of 4</div><h2 className="text-xl font-bold">Classification</h2><p className="text-gray-500 text-sm mt-1">This declaration is permanent. Edition size cannot increase after saving.</p></div>
            <div className="space-y-3">
              {CLASSIFICATIONS.map(c => (
                <button key={c.id} onClick={() => setF('classification', c.id)} className={'w-full flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all ' + (form.classification === c.id ? 'border-purple-500 bg-purple-900/20' : 'border-[#2E2820] hover:border-purple-700 bg-[#171410]')}>
                  <div className={'w-4 h-4 rounded-full border-2 flex-shrink-0 ' + (form.classification === c.id ? 'border-purple-500 bg-purple-500' : 'border-[#444]')} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5"><span className="text-sm font-semibold text-[#F5F0EB]">{c.label}</span><span className="text-xs text-purple-400 bg-purple-900/40 px-2 py-0.5 rounded-full">{c.sub}</span></div>
                    <div className="text-xs text-gray-500">{c.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            {form.classification === 'LimitedEdition' && (
              <div className="bg-[#171410] border border-[#2E2820] rounded-2xl p-5 space-y-4">
                <div className="text-xs text-purple-400 uppercase tracking-widest">Edition details</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>Total edition size</label><input value={form.editionSize} onChange={e => setF('editionSize', e.target.value)} placeholder="e.g. 10" className={inp} /><div className="text-xs text-gray-600 mt-1">Cannot be increased later</div></div>
                  <div><label className={lbl}>Artist proofs (AP)</label><input value={form.apCount} onChange={e => setF('apCount', e.target.value)} placeholder="e.g. 2" className={inp} /><div className="text-xs text-gray-600 mt-1">Marked clearly as AP</div></div>
                </div>
                {totalWorks > 0 && (
                  <div className="bg-[#0D0B09] border border-[#3D3530] rounded-xl px-4 py-3 flex justify-between"><span className="text-xs text-gray-500">Total physical works</span><span className="text-sm font-bold text-[#F5F0EB]">{totalWorks}</span></div>
                )}
                <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-3"><div className="text-xs text-yellow-400">By saving this record, you declare that no additional copies beyond {totalWorks || 'the declared total'} will ever be produced.</div></div>
              </div>
            )}
            <div className="bg-[#171410] border border-[#2E2820] rounded-2xl p-5 space-y-4">
              <div className="text-xs text-purple-400 uppercase tracking-widest">Signature and marking</div>
              <div><label className={lbl}>Signature details</label><input value={form.signatureDetails} onChange={e => setF('signatureDetails', e.target.value)} placeholder="e.g. Signed and numbered on verso in pencil" className={inp} /></div>
              <div><label className={lbl}>Marking type</label>
                <div className="flex flex-wrap gap-2">
                  {MARKING_TYPES.map(t => (<button key={t} onClick={() => setF('markingType', t)} className={'px-3 py-1.5 rounded-lg border text-xs transition-all ' + (form.markingType === t ? 'border-purple-500 bg-purple-900/30 text-[#F5F0EB]' : 'border-[#3D3530] text-gray-500 hover:border-purple-700')}>{t}</button>))}
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.certificateIssued} onChange={e => setF('certificateIssued', e.target.checked)} className="w-4 h-4 accent-purple-500" />
                <div><div className="text-sm text-[#F5F0EB]">Certificate of Authenticity issued</div><div className="text-xs text-gray-500">A CoA accompanies this work</div></div>
              </label>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div><div className="text-xs text-purple-400 uppercase tracking-widest mb-1">Step 4 of 4</div><h2 className="text-xl font-bold">Status and location</h2></div>
            <div><label className={lbl}>Status</label>
              <div className="grid grid-cols-2 gap-2">{STATUSES.map(s => (<button key={s} onClick={() => setF('status', s)} className={'px-4 py-3 rounded-xl border text-sm transition-all text-left ' + (form.status === s ? 'border-purple-500 bg-purple-900/30 text-[#F5F0EB]' : 'border-[#3D3530] text-gray-400 hover:border-purple-700')}>{s}</button>))}</div>
            </div>
            <div><label className={lbl}>Asking price (USD)</label><input value={form.price} onChange={e => setF('price', e.target.value)} placeholder="Leave blank if unsure" className={inp} /></div>
            <div>
              <label className={lbl}>Where is this work right now?</label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { id: 'Studio', icon: '⬜', label: 'My studio' },
                  { id: 'Gallery', icon: '🏛', label: 'Gallery' },
                  { id: 'Collector', icon: '👤', label: 'Collector' },
                  { id: 'Storage', icon: '📦', label: 'Storage' },
                  { id: 'MuseumLoan', icon: '🏬', label: 'Museum loan' },
                  { id: 'Friend', icon: '🤝', label: 'With someone' },
                  { id: 'Destroyed', icon: '✕', label: 'Destroyed' },
                  { id: 'Unknown', icon: '?', label: 'Not sure' },
                ].map(t => (
                  <button key={t.id} onClick={() => setF('locationType', t.id)}
                    className={'flex items-center gap-2 px-3 py-3 rounded-xl border text-sm transition-all text-left ' + (form.locationType === t.id ? 'border-purple-500 bg-purple-900/20 text-[#F5F0EB]' : 'border-[#3D3530] text-gray-400 hover:border-purple-700')}>
                    <span className="text-base">{t.icon}</span>
                    <span className="text-xs">{t.label}</span>
                  </button>
                ))}
              </div>
              {form.locationType !== 'Studio' && form.locationType !== 'Unknown' && form.locationType !== 'Destroyed' && (
                <div className="space-y-3">
                  <div>
                    <label className={lbl}>{form.locationType === 'Gallery' ? 'Gallery name' : form.locationType === 'Collector' ? 'Collector name' : form.locationType === 'Storage' ? 'Facility name and unit' : form.locationType === 'MuseumLoan' ? 'Museum name' : 'Name'}</label>
                    <input value={form.locationDetail} onChange={e => setF('locationDetail', e.target.value)} placeholder={form.locationType === 'Storage' ? 'e.g. Lagerhaus Mitte, Unit 14' : 'Name'} className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Contact person or phone</label>
                    <input value={form.locationContact} onChange={e => setF('locationContact', e.target.value)} placeholder="Optional but recommended" className={inp} />
                  </div>
                </div>
              )}
              {form.locationType === 'Destroyed' && (
                <div>
                  <label className={lbl}>Note on destruction</label>
                  <input value={form.locationDetail} onChange={e => setF('locationDetail', e.target.value)} placeholder="e.g. Destroyed by artist, 2019" className={inp} />
                </div>
              )}
            </div>
            <div><label className={lbl}>Condition</label>
              <div className="grid grid-cols-2 gap-2">{CONDITIONS.map(c => (<button key={c} onClick={() => setF('condition', c)} className={'px-4 py-3 rounded-xl border text-sm transition-all ' + (form.condition === c ? 'border-purple-500 bg-purple-900/30 text-[#F5F0EB]' : 'border-[#3D3530] text-gray-400 hover:border-purple-700')}>{c}</button>))}</div>
            </div>
            {uploadingImage && <div className="text-xs text-purple-400 animate-pulse">Uploading image...</div>}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0D0B09]/95 backdrop-blur border-t border-[#221A12] px-4 py-4">
        <div className="max-w-lg mx-auto">
          {step < 4
            ? <button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="w-full py-4 bg-purple-700 hover:bg-purple-600 disabled:opacity-30 disabled:cursor-not-allowed text-[#F5F0EB] text-sm font-medium rounded-2xl transition-all">Continue</button>
            : <button onClick={handleSave} disabled={saving} className="w-full py-4 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-[#F5F0EB] text-sm font-medium rounded-2xl transition-all">{saving ? 'Saving...' : 'Save to archive'}</button>
          }
        </div>
      </div>
    </div>
  );
}

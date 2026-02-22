'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth, storage } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

async function resizeImage(file: File, maxWidth: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export default function Upload() {
  const router = useRouter();
  const [step, setStep] = useState<'upload' | 'details' | 'mira'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [saving, setSaving] = useState(false);
  const [miraResponse, setMiraResponse] = useState('');
  const [details, setDetails] = useState({
    title: '',
    year: new Date().getFullYear().toString(),
    medium: '',
    dimensions: '',
    status: 'Available',
    price: '',
  });

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    setFileSize(`${sizeInMB} MB`);
    try {
      const userId = auth.currentUser?.uid || 'demo-user';
      const timestamp = Date.now();
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      setUploadProgress('Uploading original file...');
      const originalRef = ref(storage, `artworks/${userId}/originals/${timestamp}_${file.name}`);
      await uploadBytes(originalRef, file);
      const origUrl = await getDownloadURL(originalRef);
      setOriginalUrl(origUrl);
      setUploadProgress('Creating web version...');
      const webBlob = await resizeImage(file, 1200);
      const webRef = ref(storage, `artworks/${userId}/web/${timestamp}_${baseName}.jpg`);
      await uploadBytes(webRef, webBlob);
      const webUrl = await getDownloadURL(webRef);
      setImageUrl(webUrl);
      setUploadProgress('');
      setStep('details');
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveDetails() {
    setSaving(true);
    try {
      const userId = auth.currentUser?.uid || 'demo-user';
      const newArtworkId = Date.now().toString();
      await setDoc(doc(db, 'artists', userId, 'artworks', newArtworkId), {
        ...details,
        imageUrl,
        originalUrl,
        fileSize,
        createdAt: new Date().toISOString(),
        userId,
      });
      const artistDoc = await import('firebase/firestore').then(({ getDoc }) =>
        getDoc(doc(db, 'artists', userId))
      );
      const artistData = artistDoc.data();
      const res = await fetch('/api/mira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistContext: {
            profile: artistData,
            artwork: { ...details, imageUrl },
          },
          query: `This artist just uploaded their artwork titled "${details.title || 'Untitled'}", ${details.year}, ${details.medium || 'unspecified medium'}. Write one professional sentence acknowledging this specific work.`,
        }),
      });
      const data = await res.json();
      setMiraResponse(data.response || 'Recorded in your archive.');
      setStep('mira');
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <button
          onClick={() => router.back()}
          className="text-gray-500 text-sm mb-6 hover:text-white transition-all flex items-center gap-2"
        >← Back</button>
        <div className="text-xs text-purple-400 uppercase tracking-widest mb-2">Archive</div>
        <h1 className="text-2xl font-bold text-white mb-8">Add artwork</h1>
        {step === 'upload' && (
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-[#333] hover:border-purple-600 rounded-2xl p-16 text-center transition-all">
              {uploading ? (
                <div>
                  <div className="text-purple-400 text-sm mb-2">{uploadProgress || 'Uploading...'}</div>
                  <div className="text-gray-600 text-xs">Do not close this page</div>
                </div>
              ) : (
                <>
                  <div className="text-4xl mb-4">⬆</div>
                  <div className="text-white text-sm font-medium mb-2">Upload full resolution image</div>
                  <div className="text-gray-400 text-xs mb-4">Original file preserved for printing and sharing</div>
                  <div className="text-gray-600 text-xs">JPG · PNG · TIFF · No size limit</div>
                </>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        )}
        {step === 'details' && (
          <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden">
            {imageUrl && (
              <img src={imageUrl} alt="Uploaded artwork" className="w-full h-48 object-cover" />
            )}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs text-green-400">✓ Uploaded successfully</div>
                {fileSize && <div className="text-xs text-gray-500">Original: {fileSize} · preserved</div>}
              </div>
              {[
                { key: 'title', label: 'Title', placeholder: 'What is this work called?' },
                { key: 'year', label: 'Year', placeholder: 'When did you complete this?' },
                { key: 'medium', label: 'Medium', placeholder: 'e.g. Oil on linen' },
                { key: 'dimensions', label: 'Dimensions', placeholder: 'e.g. 120 × 90 cm' },
                { key: 'price', label: 'Asking price', placeholder: 'Leave blank if unsure' },
              ].map(field => (
                <div key={field.key} className="mb-4">
                  <div className="text-xs text-purple-400 mb-1">{field.label}</div>
                  <input
                    value={details[field.key as keyof typeof details]}
                    onChange={e => setDetails(d => ({ ...d, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              ))}
              <div className="mb-4">
                <div className="text-xs text-purple-400 mb-1">Status</div>
                <select
                  value={details.status}
                  onChange={e => setDetails(d => ({ ...d, status: e.target.value }))}
                  className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
                >
                  {['Available', 'Sold', 'Consigned', 'Not for sale'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 border border-[#333] text-gray-400 text-sm rounded-lg hover:border-gray-500 transition-all"
                >Back</button>
                <button
                  onClick={handleSaveDetails}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-lg disabled:opacity-40 transition-all"
                >{saving ? 'Saving...' : 'Save & meet Mira →'}</button>
              </div>
            </div>
          </div>
        )}
        {step === 'mira' && (
          <div className="bg-[#111] border border-[#222] rounded-2xl p-8">
            <div className="text-xs text-purple-400 uppercase tracking-widest mb-6">Mira</div>
            <div className="text-gray-300 text-sm leading-relaxed mb-8 bg-[#0a0a0a] rounded-xl p-5 border border-[#1a1a1a]">
              {miraResponse}
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6">
              <div className="text-xs text-gray-500 mb-1">Original file preserved</div>
              <div className="text-xs text-green-400">Full resolution available for printing and sharing</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/archive')}
                className="flex-1 px-6 py-3 border border-[#333] text-gray-400 text-sm rounded-lg hover:border-purple-700 transition-all"
              >View Archive</button>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-lg transition-all"
              >Go to Studio →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

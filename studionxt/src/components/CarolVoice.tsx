'use client';

import { useState, useRef } from 'react';
import { db, storage } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const REGISTERS = ['Joyful','Celebratory','Searching','Unresolved','Difficult','Peaceful','Defiant'];

interface Props {
  artwork: any;
  userId: string;
  artworkId: string;
  onSaved: (updated: any) => void;
}

export default function CarolVoice({ artwork, userId, artworkId, onSaved }: Props) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>(artwork.audioUrl || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [voice, setVoice] = useState({
    carolQuote: artwork.carolQuote || '',
    emotionalRegister: artwork.emotionalRegister || '',
    whatSheLearned: artwork.whatSheLearned || '',
    artistStatement: artwork.artistStatement || '',
    curatorNote: artwork.curatorNote || '',
  });

  function setV(key: string, value: string) {
    setVoice(v => ({ ...v, [key]: value }));
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch (err) {
      alert('Microphone access denied. Please allow microphone and try again.');
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    setRecording(false);
  }

  async function handleAudioFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioBlob(file);
    setAudioUrl(URL.createObjectURL(file));
  }

  async function handleSave() {
    setSaving(true);
    try {
      let finalAudioUrl = audioUrl;
      if (audioBlob && audioUrl.startsWith('blob:')) {
        setUploading(true);
        const audioRef = ref(storage, 'audio/' + userId + '/' + artworkId + '_' + Date.now() + '.webm');
        await uploadBytes(audioRef, audioBlob);
        finalAudioUrl = await getDownloadURL(audioRef);
        setUploading(false);
      }
      const updated = { ...artwork, ...voice, audioUrl: finalAudioUrl };
      await updateDoc(doc(db, 'artists', userId, 'artworks', artworkId), { ...voice, audioUrl: finalAudioUrl });
      setSaved(true);
      onSaved(updated);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const input = 'w-full bg-[#0a0a0a] border border-[#333] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors';
  const label = 'text-xs text-purple-400 mb-1.5 block';

  return (
    <div className="mt-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-[#1a1a1a]"></div>
        <div className="text-xs text-purple-400 uppercase tracking-widest">Carol's Voice</div>
        <div className="h-px flex-1 bg-[#1a1a1a]"></div>
      </div>
      <div className="bg-[#111] border border-[#1a1a2e] rounded-2xl p-6 space-y-6">
        <div>
          <div className="text-sm font-medium text-white mb-1">Audio recording</div>
          <div className="text-xs text-gray-500 mb-4">Record Carol talking about this work, or upload an existing file.</div>
          {audioUrl && (
            <audio controls src={audioUrl} className="w-full mb-4 rounded-lg" />
          )}
          <div className="flex gap-3 flex-wrap">
            {!recording ? (
              <button onClick={startRecording} className="flex items-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-600 text-white text-sm rounded-xl transition-all">
                <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
                Record
              </button>
            ) : (
              <button onClick={stopRecording} className="flex items-center gap-2 px-4 py-2.5 bg-red-900 border border-red-500 text-red-300 text-sm rounded-xl animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
                Stop recording
              </button>
            )}
            <label className="flex items-center gap-2 px-4 py-2.5 border border-[#333] hover:border-purple-700 text-gray-400 hover:text-white text-sm rounded-xl transition-all cursor-pointer">
              Upload audio
              <input type="file" accept="audio/*" onChange={handleAudioFile} className="hidden" />
            </label>
          </div>
        </div>

        <div>
          <label className={label}>The one sentence Carol said that matters most</label>
          <textarea value={voice.carolQuote} onChange={e => setV('carolQuote', e.target.value)} placeholder="Her exact words..." rows={2} className={input + ' resize-none'} />
        </div>

        <div>
          <label className={label}>Emotional register</label>
          <div className="flex flex-wrap gap-2">
            {REGISTERS.map(r => (
              <button key={r} onClick={() => setV('emotionalRegister', voice.emotionalRegister === r ? '' : r)}
                className={'px-3 py-1.5 rounded-full border text-xs transition-all ' + (voice.emotionalRegister === r ? 'border-purple-500 bg-purple-900 text-purple-200' : 'border-[#333] text-gray-400 hover:border-purple-700')}>
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={label}>What she learned making this work</label>
          <textarea value={voice.whatSheLearned} onChange={e => setV('whatSheLearned', e.target.value)} placeholder="What did Carol discover through making this piece..." rows={3} className={input + ' resize-none'} />
        </div>

        <div>
          <label className={label}>Artist statement</label>
          <textarea value={voice.artistStatement} onChange={e => setV('artistStatement', e.target.value)} placeholder="Carol's written words about this work..." rows={4} className={input + ' resize-none'} />
        </div>

        <div>
          <label className={label}>Curator note — what she wants curators to know</label>
          <textarea value={voice.curatorNote} onChange={e => setV('curatorNote', e.target.value)} placeholder="Context, intentions, or instructions for future exhibition..." rows={3} className={input + ' resize-none'} />
        </div>

        <button onClick={handleSave} disabled={saving || uploading} className="w-full py-3 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-sm rounded-xl transition-all font-medium">
          {uploading ? 'Uploading audio...' : saving ? 'Saving...' : saved ? 'Saved' : "Save Carol's voice"}
        </button>
      </div>
    </div>
  );
}

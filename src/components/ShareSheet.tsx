'use client';

import { useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface ShareSheetProps {
  artwork: any;
  artistName: string;
  artistEmail: string;
  onClose: () => void;
}

export default function ShareSheet({ artwork, artistName, artistEmail, onClose }: ShareSheetProps) {
  const [showPrice, setShowPrice] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [creating, setCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  async function createShareLink() {
    setCreating(true);
    try {
      const shareId = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      const shareData = {
        uid: auth.currentUser?.uid || '',
        artworkId: artwork.id,
        artistName,
        artistEmail,
        showPrice,
        showLocation,
        createdAt: new Date().toISOString(),
        artworkSnapshot: {
          title: artwork.title || 'Untitled',
          year: artwork.year || '',
          medium: artwork.medium || '',
          materials: artwork.materials || '',
          dimensions: artwork.dimensions || '',
          classification: artwork.classification || '',
          editionSize: artwork.editionSize || '',
          apCount: artwork.apCount || '',
          condition: artwork.condition || '',
          price: artwork.price || '',
          locationCurrent: artwork.locationCurrent || '',
          imageUrl: artwork.imageUrl || '',
        },
      };
      await setDoc(doc(db, 'shares', shareId), shareData);
      const url = window.location.origin + '/share/' + shareId;
      setShareUrl(url);
    } catch (err) {
      console.error('Share create failed:', err);
    } finally {
      setCreating(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function nativeShare() {
    if (navigator.share) {
      await navigator.share({
        title: artwork.title || 'Untitled',
        text: 'View this work by ' + artistName,
        url: shareUrl,
      });
    } else {
      copyLink();
    }
  }

  const toggle = 'flex items-center justify-between py-3 border-b border-default';
  const switchStyle = (on: boolean) => ({
    width: 40, height: 22, borderRadius: 999, border: 'none',
    cursor: 'pointer', background: on ? '#7e22ce' : '#2E2820',
    position: 'relative' as const, flexShrink: 0, display: 'inline-block',
    transition: 'background 0.2s',
  });
  const knobStyle = (on: boolean) => ({
    position: 'absolute' as const, top: 2, width: 18, height: 18,
    borderRadius: '50%', background: '#ffffff',
    transition: 'left 0.2s', display: 'block',
    left: on ? 20 : 2, boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => { if(e.target === e.currentTarget) onClose(); }}>
      <div className="bg-card w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-card-hover" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-default">
          <div>
            <div className="text-xs text-purple-400 uppercase tracking-widest mb-0.5">Share</div>
            <div className="text-sm font-semibold text-primary truncate max-w-[220px]">
              {artwork.title || 'Untitled'}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-card-hover flex items-center justify-center text-secondary hover:text-primary transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {!shareUrl ? (
          <div className="px-5 py-4">
            {/* Toggles */}
            <div className="mb-5">
              <div className={toggle}>
                <div>
                  <div className="text-sm text-primary">Include price</div>
                  <div className="text-xs text-secondary">
                    {artwork.price ? '€' + Number(artwork.price).toLocaleString() : 'No price set'}
                  </div>
                </div>
                <button style={switchStyle(showPrice)} onClick={() => setShowPrice(s => !s)} disabled={!artwork.price}>
                  <span style={knobStyle(showPrice)} />
                </button>
              </div>
              <div className={toggle + ' border-0'}>
                <div>
                  <div className="text-sm text-primary">Include location</div>
                  <div className="text-xs text-secondary">
                    {artwork.locationCurrent || artwork.locationType || 'Not set'}
                  </div>
                </div>
                <button style={switchStyle(showLocation)} onClick={() => setShowLocation(s => !s)}>
                  <span style={knobStyle(showLocation)} />
                </button>
              </div>
            </div>

            {/* Create button */}
            <button
              onClick={createShareLink}
              disabled={creating}
              className="w-full py-3.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-sm font-medium rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Creating link...
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                  </svg>
                  Create share link
                </>
              )}
            </button>
            <div className="text-xs text-muted text-center mt-3">
              Link is permanent until you revoke it
            </div>
          </div>
        ) : (
          <div className="px-5 py-4">
            {/* Link created */}
            <div className="bg-background border border-default rounded-xl px-4 py-3 mb-4">
              <div className="text-xs text-purple-400 mb-1">Share link ready</div>
              <div className="text-xs text-secondary break-all">{shareUrl}</div>
            </div>
            <div className="space-y-2">
              <button
                onClick={copyLink}
                className="w-full py-3.5 bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
                {copied ? 'Copied!' : 'Copy link'}
              </button>
              <button
                onClick={nativeShare}
                className="w-full py-3.5 border border-default hover:border-purple-700 text-primary text-sm rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share via...
              </button>
            </div>
            <button onClick={onClose} className="w-full py-2 text-xs text-muted hover:text-secondary transition-all mt-2">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

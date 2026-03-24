'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

const LOGO = "https://firebasestorage.googleapis.com/v0/b/studionxt-2657b.firebasestorage.app/o/artnxt.png?alt=media&token=991c5ea4-8d04-48ae-b82d-67d6f5900890";

export default function PublicArtistPage({ username }: { username: string }) {
  const [artist, setArtist] = useState<any>(null);
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [view, setView] = useState<'grid'|'editorial'>('grid');

  useEffect(() => {
    async function load() {
      try {
        const artistsSnap = await getDocs(query(collection(db, 'artists'), where('username', '==', username)));
        if (artistsSnap.empty) { setNotFound(true); setLoading(false); return; }
        const artistDoc = artistsSnap.docs[0];
        const artistData = { id: artistDoc.id, ...artistDoc.data() };
        setArtist(artistData);
        const worksSnap = await getDocs(collection(db, 'artists', artistDoc.id, 'artworks'));
        const allWorks = worksSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        setWorks(allWorks.filter((w: any) => w.isPublic !== false));
      } catch (e) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0D0B09', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid #2E2820', borderTopColor: '#7e22ce', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: '#0D0B09', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <img src={LOGO} alt="StudioNXT" style={{ width: '48px', height: '48px' }} />
      <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', color: '#F0EBE3' }}>Artist not found</div>
      <Link href="/" style={{ fontSize: '13px', color: '#7e22ce' }}>Return to StudioNXT</Link>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0D0B09', color: '#F0EBE3', fontFamily: 'Inter, sans-serif' }}>

      <div style={{ borderBottom: '1px solid #2E2820', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src={LOGO} alt="StudioNXT" style={{ width: '32px', height: '32px' }} />
        <div style={{ fontSize: '11px', color: '#504840', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Archive</div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '56px 24px 40px' }}>
        <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '36px', fontWeight: 500, marginBottom: '8px', lineHeight: 1.2 }}>{artist.name}</div>
        <div style={{ fontSize: '13px', color: '#8A8480', marginBottom: '24px' }}>
          {artist.practiceType}{artist.country ? ' · ' + artist.country : ''}
        </div>
        {artist.bio && (
          <div style={{ fontSize: '15px', color: '#C8C0B8', lineHeight: 1.7, maxWidth: '600px', marginBottom: '40px' }}>{artist.bio}</div>
        )}

        {works.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
            <button onClick={() => setView('grid')} style={{ padding: '6px 16px', borderRadius: '999px', border: '1px solid', borderColor: view === 'grid' ? '#7e22ce' : '#2E2820', background: view === 'grid' ? '#7e22ce' : 'transparent', color: view === 'grid' ? '#fff' : '#8A8480', fontSize: '12px', cursor: 'pointer' }}>Grid</button>
            <button onClick={() => setView('editorial')} style={{ padding: '6px 16px', borderRadius: '999px', border: '1px solid', borderColor: view === 'editorial' ? '#7e22ce' : '#2E2820', background: view === 'editorial' ? '#7e22ce' : 'transparent', color: view === 'editorial' ? '#fff' : '#8A8480', fontSize: '12px', cursor: 'pointer' }}>Editorial</button>
          </div>
        )}

        {view === 'grid' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {works.map((work: any) => (
              <div key={work.id} style={{ background: '#171410', borderRadius: '12px', overflow: 'hidden', border: '1px solid #2E2820' }}>
                {work.imageUrl && <img src={work.imageUrl} alt={work.title} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />}
                <div style={{ padding: '12px' }}>
                  <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '14px', color: '#F0EBE3', marginBottom: '4px' }}>{work.title}</div>
                  <div style={{ fontSize: '12px', color: '#8A8480' }}>{work.year}{work.medium ? ' · ' + work.medium : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'editorial' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>
            {works.map((work: any, i: number) => (
              <div key={work.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center', direction: i % 2 === 0 ? 'ltr' : 'rtl' }}>
                {work.imageUrl && <img src={work.imageUrl} alt={work.title} style={{ width: '100%', borderRadius: '8px', display: 'block', direction: 'ltr' }} />}
                <div style={{ direction: 'ltr' }}>
                  <div style={{ fontSize: '12px', color: '#7e22ce', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>{work.year}</div>
                  <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 500, marginBottom: '12px', lineHeight: 1.2 }}>{work.title}</div>
                  <div style={{ fontSize: '13px', color: '#8A8480', marginBottom: '16px' }}>{work.medium}{work.dimensions ? ' · ' + work.dimensions : ''}</div>
                  {work.materials && <div style={{ fontSize: '13px', color: '#C8C0B8', lineHeight: 1.6 }}>{work.materials}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {works.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#504840', fontSize: '14px' }}>No works in this archive yet.</div>
        )}
      </div>

      <div style={{ borderTop: '1px solid #2E2820', padding: '24px', textAlign: 'center', marginTop: '80px' }}>
        <div style={{ fontSize: '11px', color: '#504840', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Archive preserved by <a href="https://studionxt.vercel.app" style={{ color: '#7e22ce', textDecoration: 'none' }}>StudioNXT</a>
        </div>
      </div>

    </div>
  );
}

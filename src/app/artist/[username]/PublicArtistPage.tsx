'use client';

import { useEffect, useState, useRef } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

const LOGO = "https://firebasestorage.googleapis.com/v0/b/studionxt-2657b.firebasestorage.app/o/artnxt.png?alt=media&token=991c5ea4-8d04-48ae-b82d-67d6f5900890";

export default function PublicArtistPage({ username }: { username: string }) {
  const [artist, setArtist] = useState<any>(null);
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [navVisible, setNavVisible] = useState(false);
  const [lightboxFading, setLightboxFading] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

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

  // Scroll listener for nav artist name
  useEffect(() => {
    const onScroll = () => setNavVisible(window.scrollY > 220);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Keyboard listener for lightbox
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowRight') shiftLightbox(1);
      if (e.key === 'ArrowLeft') shiftLightbox(-1);
      if (e.key === 'Escape') setLightboxIndex(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, works]);

  function shiftLightbox(dir: number) {
    if (lightboxIndex === null) return;
    setLightboxFading(true);
    setTimeout(() => {
      setLightboxIndex((lightboxIndex + dir + works.length) % works.length);
      setLightboxFading(false);
    }, 200);
  }

  function openLightbox(index: number) {
    setLightboxIndex(index);
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    setLightboxIndex(null);
    document.body.style.overflow = '';
  }

  const worksWithImages = works.filter((w: any) => w.imageUrl);
  const heroWork = worksWithImages[0];

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F9F9F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid #E2E2E2', borderTopColor: '#1a1a1a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: '#F9F9F9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', fontFamily: 'Inter, sans-serif' }}>
      <img src={LOGO} alt="StudioNXT" style={{ width: '40px', height: '40px', opacity: 0.4 }} />
      <div style={{ fontFamily: 'Noto Serif, serif', fontSize: '22px', color: '#1a1a1a' }}>Artist not found</div>
      <Link href="/" style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#999', textDecoration: 'none' }}>Return to StudioNXT</Link>
    </div>
  );

  const artistName = artist.name || username;
  const nameParts = artistName.trim().split(' ');
  const firstName = nameParts.slice(0, -1).join(' ') || artistName;
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

  return (
    <div style={{ minHeight: '100vh', background: '#F9F9F9', color: '#1a1a1a', fontFamily: 'Inter, sans-serif' }}>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');
        .pub-serif { font-family: 'Noto Serif', serif; }
        .pub-work-img { transition: transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94); }
        .pub-work-card:hover .pub-work-img { transform: scale(1.06); }
        .pub-work-card:hover .pub-zoom { opacity: 1; background: rgba(0,0,0,0.18); }
        .pub-zoom { position: absolute; inset: 0; opacity: 0; transition: all 0.3s; display: flex; align-items: center; justify-content: center; }
        .pub-zoom-icon { width: 40px; height: 40px; border: 1px solid rgba(255,255,255,0.8); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; }
        .pub-nav-name { transition: opacity 0.35s ease, transform 0.35s ease; }
        .pub-hero-img-wrap:hover .pub-hero-overlay { opacity: 1; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .pub-fade { animation: fadeUp 0.7s ease both; }
      `}</style>

      {/* ── LIGHTBOX ── */}
      {lightboxIndex !== null && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}
          style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(10,10,10,0.96)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
          <button onClick={closeLightbox} style={{ position: 'absolute', top: 24, right: 32, background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '32px', cursor: 'pointer', lineHeight: 1, fontWeight: 300 }}>×</button>
          <button onClick={() => shiftLightbox(-1)} style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', background: 'none', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '50%', width: 48, height: 48, color: 'rgba(255,255,255,0.7)', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <button onClick={() => shiftLightbox(1)} style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', background: 'none', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '50%', width: 48, height: 48, color: 'rgba(255,255,255,0.7)', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>→</button>
          {worksWithImages[lightboxIndex] && (
            <>
              <img
                src={worksWithImages[lightboxIndex].imageUrl}
                alt={worksWithImages[lightboxIndex].title}
                style={{ maxWidth: '75vw', maxHeight: '72vh', objectFit: 'contain', display: 'block', opacity: lightboxFading ? 0 : 1, transition: 'opacity 0.2s ease' }}
              />
              <div style={{ marginTop: 24, textAlign: 'center', opacity: lightboxFading ? 0 : 1, transition: 'opacity 0.2s ease' }}>
                <div className="pub-serif" style={{ fontSize: 20, fontStyle: 'italic', color: '#F0EBE3', marginBottom: 6 }}>{worksWithImages[lightboxIndex].title}</div>
                <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(240,235,227,0.45)' }}>
                  {[worksWithImages[lightboxIndex].medium, worksWithImages[lightboxIndex].dimensions, worksWithImages[lightboxIndex].year].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div style={{ position: 'absolute', bottom: 24, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
                {lightboxIndex + 1} / {worksWithImages.length}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── NAV ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(249,249,249,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #E2E2E2' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="pub-serif pub-nav-name" style={{ fontSize: 17, color: '#1a1a1a', opacity: navVisible ? 1 : 0, transform: navVisible ? 'translateY(0)' : 'translateY(-6px)' }}>
            {artistName}
          </span>
          <div style={{ display: 'flex', gap: 40 }}>
            {['Works', 'Biography', 'Contact'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#888', textDecoration: 'none', fontWeight: 400 }}>{l}</a>
            ))}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="pub-fade" style={{ maxWidth: 1280, margin: '0 auto', padding: '140px 48px 80px', display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 80, alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#999', marginBottom: 20, fontWeight: 500 }}>
            {artist.practiceType || 'Artist'}
          </div>
          <h1 className="pub-serif" style={{ fontSize: 'clamp(64px, 8vw, 108px)', fontWeight: 400, lineHeight: 0.95, letterSpacing: '-0.03em', color: '#1a1a1a', marginBottom: 36 }}>
            {firstName}{lastName && <><br/><em style={{ fontStyle: 'italic', color: '#888' }}>{lastName}</em></>}
          </h1>
          {artist.bio && (
            <p style={{ fontSize: 16, lineHeight: 1.85, color: '#666', fontWeight: 300, maxWidth: 500, marginBottom: 40 }}>{artist.bio}</p>
          )}
          <div style={{ display: 'flex', gap: 32 }}>
            <a href="#works" style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500, color: '#1a1a1a', textDecoration: 'none', borderBottom: '1px solid #1a1a1a', paddingBottom: 2 }}>View Archive</a>
            <a href="#contact" style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500, color: '#1a1a1a', textDecoration: 'none', borderBottom: '1px solid #1a1a1a', paddingBottom: 2 }}>Get in Touch</a>
          </div>
        </div>
        <div style={{ paddingTop: 40 }}>
          {heroWork ? (
            <div className="pub-hero-img-wrap" onClick={() => openLightbox(0)} style={{ aspectRatio: '4/5', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
              <img src={heroWork.imageUrl} alt={heroWork.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.7s' }} />
              <div className="pub-hero-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.12)', opacity: 0, transition: 'opacity 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'white', fontWeight: 400 }}>View Full Screen</span>
              </div>
            </div>
          ) : (
            <div style={{ aspectRatio: '4/5', background: '#E8E4DC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 10, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>No image yet</span>
            </div>
          )}
        </div>
      </section>

      {/* ── MIRA'S VOICE ── */}
      {artist.bio && (
        <section style={{ background: '#F3F3F3', borderTop: '1px solid #E2E2E2', borderBottom: '1px solid #E2E2E2', padding: '80px 48px' }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <span style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#999', fontWeight: 500, display: 'block', marginBottom: 28 }}>Mira's Voice</span>
            <blockquote className="pub-serif" style={{ fontSize: 'clamp(20px, 3vw, 32px)', fontStyle: 'italic', lineHeight: 1.55, color: '#1a1a1a', marginBottom: 40, letterSpacing: '-0.01em' }}>
              "{artist.bio}"
            </blockquote>
          </div>
        </section>
      )}

      {/* ── WORKS ── */}
      <section id="works" style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid #E2E2E2', paddingBottom: 16, marginBottom: 64 }}>
          <div className="pub-serif" style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.01em' }}>Life's Work</div>
          <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#999' }}>
            {worksWithImages.length} {worksWithImages.length === 1 ? 'work' : 'works'} archived
          </div>
        </div>

        {worksWithImages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#bbb', fontSize: 14 }}>No works in this archive yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 40px', rowGap: 64 }}>
            {worksWithImages.map((work: any, i: number) => {
              const offsets: Record<number, string> = { 1: '80px', 3: '-40px', 4: '40px', 5: '-80px' };
              return (
                <div
                  key={work.id}
                  className="pub-work-card"
                  onClick={() => openLightbox(i)}
                  style={{ cursor: 'pointer', marginTop: offsets[i] || 0 }}
                >
                  <div style={{ overflow: 'hidden', background: '#E8E4DC', marginBottom: 20, position: 'relative' }}>
                    <img src={work.imageUrl} alt={work.title} className="pub-work-img" style={{ width: '100%', display: 'block', minHeight: 240, objectFit: 'cover' }} />
                    <div className="pub-zoom"><div className="pub-zoom-icon">+</div></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className="pub-serif" style={{ fontSize: 16, fontStyle: 'italic', color: '#1a1a1a', marginBottom: 4 }}>{work.title}</div>
                      <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#999' }}>
                        {[work.medium, work.dimensions].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, letterSpacing: '0.1em', color: '#999', flexShrink: 0, paddingTop: 2 }}>{work.year}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {worksWithImages.length > 6 && (
          <div style={{ marginTop: 80, textAlign: 'center' }}>
            <button style={{ background: '#1a1a1a', color: '#F9F9F9', border: 'none', padding: '16px 48px', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', fontWeight: 500, cursor: 'pointer' }}>
              View Full Archive
            </button>
          </div>
        )}
      </section>

      {/* ── BIOGRAPHY ── */}
      <section id="biography" style={{ borderTop: '1px solid #E2E2E2' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div style={{ background: '#E8E4DC', aspectRatio: '1/1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {heroWork ? (
              <img src={heroWork.imageUrl} alt={artistName} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.3) contrast(1.1)' }} />
            ) : (
              <span style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Artist</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#999', marginBottom: 24, display: 'block' }}>Biography</span>
            <h2 className="pub-serif" style={{ fontSize: 36, fontWeight: 700, marginBottom: 28, letterSpacing: '-0.01em' }}>
              {artistName}
            </h2>
            {artist.bio && (
              <p style={{ color: '#666', lineHeight: 1.85, marginBottom: 20, fontWeight: 300, fontSize: 15 }}>{artist.bio}</p>
            )}
            {artist.practiceType && (
              <p style={{ color: '#999', lineHeight: 1.8, fontWeight: 300, fontSize: 14 }}>
                {artist.practiceType}{artist.country ? ' · ' + artist.country : ''}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── CONTACT CTA ── */}
      <section id="contact" style={{ padding: '100px 48px', textAlign: 'center', borderTop: '1px solid #E2E2E2' }}>
        <span style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: 24 }}>Enquiries & Acquisition</span>
        <p className="pub-serif" style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 400, letterSpacing: '-0.02em', color: '#1a1a1a', maxWidth: 520, margin: '0 auto 48px', lineHeight: 1.2 }}>
          Bringing the artist's legacy into your collection.
        </p>
        {artist.email && (
          <a href={`mailto:${artist.email}`} style={{ display: 'inline-block', background: '#1a1a1a', color: '#F9F9F9', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 500, padding: '18px 56px', textDecoration: 'none' }}>
            Contact the Artist
          </a>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#F3F3F3', borderTop: '1px solid #E2E2E2', padding: '40px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#999' }}>
            Archive preserved by <a href="https://studionxt.vercel.app" style={{ color: '#1a1a1a', textDecoration: 'none' }}>StudioNXT</a>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 32 }}>
          {['Works', 'Biography', 'Contact'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#999', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
      </footer>

      {/* ── FIXED CONTACT BUTTON ── */}
      {artist.email && (
        <a href={`mailto:${artist.email}`} style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 40, background: '#1a1a1a', color: '#F9F9F9', padding: '14px 20px', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', fontWeight: 500 }}>
          Get in Touch
        </a>
      )}

    </div>
  );
}

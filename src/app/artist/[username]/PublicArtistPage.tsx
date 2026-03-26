'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

const LOGO = "https://firebasestorage.googleapis.com/v0/b/studionxt-2657b.firebasestorage.app/o/artnxt.png?alt=media&token=991c5ea4-8d04-48ae-b82d-67d6f5900890";

export default function PublicArtistPage({ username }) {
  const [artist, setArtist] = useState(null);
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [lightboxFading, setLightboxFading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const artistsSnap = await getDocs(query(collection(db, 'artists'), where('username', '==', username)));
        if (artistsSnap.empty) { setNotFound(true); setLoading(false); return; }
        const artistDoc = artistsSnap.docs[0];
        const artistData = { id: artistDoc.id, ...artistDoc.data() };
        setArtist(artistData);
        const worksSnap = await getDocs(collection(db, 'artists', artistDoc.id, 'artworks'));
        const allWorks = worksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const publicWorks = allWorks
          .filter(w => w.isPublic !== false && w.imageUrl)
          .sort((a, b) => {
            if (a.publicOrder !== undefined && b.publicOrder !== undefined) return a.publicOrder - b.publicOrder;
            if (a.publicOrder !== undefined) return -1;
            if (b.publicOrder !== undefined) return 1;
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          });
        setWorks(publicWorks);
      } catch (e) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username]);

  useEffect(() => {
    function onKey(e) {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowRight') shift(1);
      if (e.key === 'ArrowLeft') shift(-1);
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, works]);

  function open(i) {
    setLightboxIndex(i);
    document.body.style.overflow = 'hidden';
  }

  function close() {
    setLightboxIndex(null);
    document.body.style.overflow = '';
  }

  function shift(dir) {
    if (lightboxIndex === null) return;
    setLightboxFading(true);
    setTimeout(() => {
      setLightboxIndex((lightboxIndex + dir + works.length) % works.length);
      setLightboxFading(false);
    }, 180);
  }

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:'28px',height:'28px',border:'1.5px solid #e0e0e0',borderTopColor:'#1a1a1a',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  if (notFound) return (
    <div style={{minHeight:'100vh',background:'#fff',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'16px',fontFamily:'Inter,sans-serif'}}>
      <img src={LOGO} alt="StudioNXT" style={{width:'36px',height:'36px',opacity:0.3}}/>
      <div style={{fontSize:'18px',color:'#1a1a1a',fontFamily:'Georgia,serif'}}>Artist not found</div>
      <Link href="/" style={{fontSize:'10px',letterSpacing:'0.14em',textTransform:'uppercase',color:'#aaa',textDecoration:'none'}}>Return to StudioNXT</Link>
    </div>
  );

  const artistName = artist.name || username;

  return (
    <div style={{minHeight:'100vh',background:'#ffffff',color:'#1a1a1a',fontFamily:'Inter,sans-serif'}}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500&display=swap');
        .work-card { cursor:pointer; }
        .work-img { display:block; width:100%; transition:opacity 0.3s; }
        .work-card:hover .work-img { opacity:0.88; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.5s ease both; }
        @media(max-width:640px){
          .works-grid { grid-template-columns: 1fr !important; }
          .page-header { padding: 40px 20px 24px !important; flex-direction: column !important; gap: 4px !important; align-items: flex-start !important; }
          .works-section { padding: 0 20px 80px !important; }
          .bio-section { padding: 40px 20px !important; }
          .footer-inner { flex-direction: column !important; gap: 12px !important; align-items: flex-start !important; }
        }
      `}</style>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          onClick={e => { if (e.target === e.currentTarget) close(); }}
          style={{position:'fixed',inset:0,zIndex:999,background:'rgba(255,255,255,0.97)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px'}}
        >
          <button onClick={close} style={{position:'absolute',top:24,right:32,background:'none',border:'none',fontSize:'24px',cursor:'pointer',color:'#999',lineHeight:1,fontWeight:300}}>×</button>
          <button onClick={() => shift(-1)} style={{position:'absolute',left:24,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',fontSize:'20px',cursor:'pointer',color:'#bbb',padding:'16px'}}>←</button>
          <button onClick={() => shift(1)} style={{position:'absolute',right:24,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',fontSize:'20px',cursor:'pointer',color:'#bbb',padding:'16px'}}>→</button>
          {works[lightboxIndex] && (
            <div style={{textAlign:'center',opacity:lightboxFading?0:1,transition:'opacity 0.18s',maxWidth:'80vw'}}>
              <img
                src={works[lightboxIndex].imageUrl}
                alt={works[lightboxIndex].title}
                style={{maxWidth:'100%',maxHeight:'72vh',objectFit:'contain',display:'block',margin:'0 auto'}}
              />
              <div style={{marginTop:'24px'}}>
                <div style={{fontFamily:'EB Garamond,Georgia,serif',fontSize:'20px',fontStyle:'italic',color:'#1a1a1a',marginBottom:'6px'}}>
                  {works[lightboxIndex].title || 'Untitled'}
                </div>
                <div style={{fontSize:'10px',letterSpacing:'0.14em',textTransform:'uppercase',color:'#aaa'}}>
                  {[works[lightboxIndex].medium, works[lightboxIndex].year].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div style={{marginTop:'20px',fontSize:'10px',letterSpacing:'0.1em',color:'#ccc'}}>
                {lightboxIndex + 1} / {works.length}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <header className="page-header fade-in" style={{maxWidth:'1600px',margin:'0 auto',padding:'56px 48px 32px',display:'flex',alignItems:'baseline',justifyContent:'space-between',borderBottom:'1px solid #f0f0f0'}}>
        <div>
          <div style={{fontFamily:'EB Garamond,Georgia,serif',fontSize:'clamp(28px,3vw,42px)',fontWeight:400,letterSpacing:'-0.01em',color:'#1a1a1a',lineHeight:1.1}}>
            {artistName}
          </div>
          {(artist.practiceType || artist.country) && (
            <div style={{fontSize:'10px',letterSpacing:'0.16em',textTransform:'uppercase',color:'#aaa',marginTop:'8px',fontWeight:400}}>
              {[artist.practiceType, artist.country].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
        <div style={{fontSize:'10px',letterSpacing:'0.14em',textTransform:'uppercase',color:'#bbb',textAlign:'right',flexShrink:0}}>
          {works.length} {works.length === 1 ? 'work' : 'works'}
        </div>
      </header>

      {/* Works grid */}
      <main className="works-section fade-in" style={{maxWidth:'1600px',margin:'0 auto',padding:'0 48px 120px'}}>
        {works.length === 0 ? (
          <div style={{textAlign:'center',padding:'120px 0',color:'#ccc',fontSize:'13px',letterSpacing:'0.08em'}}>
            No works in this archive yet.
          </div>
        ) : (
          <div className="works-grid" style={{
            display:'grid',
            gridTemplateColumns:'repeat(5,1fr)',
            gap:'2px',
            marginTop:'2px'
          }}>
            {works.map((work, i) => (
              <div key={work.id} className="work-card" onClick={() => open(i)}>
                <div style={{background:'#f8f8f8',overflow:'hidden'}}>
                  <img
                    src={work.imageUrl}
                    alt={work.title || 'Untitled'}
                    className="work-img"
                    style={{width:'100%',height:'auto',display:'block'}}
                    loading="lazy"
                  />
                </div>
                <div style={{padding:'12px 4px 24px'}}>
                  <div style={{fontFamily:'EB Garamond,Georgia,serif',fontSize:'14px',fontStyle:'italic',color:'#1a1a1a',marginBottom:'3px',lineHeight:1.3}}>
                    {work.title || 'Untitled'}
                  </div>
                  <div style={{fontSize:'9px',letterSpacing:'0.1em',textTransform:'uppercase',color:'#bbb'}}>
                    {[work.year, work.medium].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bio — bottom, quiet */}
      {artist.bio && (
        <div className="bio-section" style={{borderTop:'1px solid #f0f0f0',padding:'64px 48px'}}>
          <div style={{maxWidth:'560px',margin:'0 auto'}}>
            <div style={{fontSize:'9px',letterSpacing:'0.2em',textTransform:'uppercase',color:'#ccc',marginBottom:'20px'}}>Biography</div>
            <p style={{fontFamily:'EB Garamond,Georgia,serif',fontSize:'18px',lineHeight:1.8,color:'#444',fontWeight:400}}>
              {artist.bio}
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{borderTop:'1px solid #f0f0f0',padding:'28px 48px'}}>
        <div className="footer-inner" style={{maxWidth:'1600px',margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontSize:'10px',letterSpacing:'0.12em',textTransform:'uppercase',color:'#ccc'}}>
            Archive preserved by{' '}
            <a href="https://studionxt.vercel.app" style={{color:'#aaa',textDecoration:'none'}}>StudioNXT</a>
          </div>
          <img src={LOGO} alt="StudioNXT" style={{width:'24px',height:'24px',opacity:0.2}}/>
        </div>
      </footer>

    </div>
  );
}

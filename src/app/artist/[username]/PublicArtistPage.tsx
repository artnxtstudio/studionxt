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
        setArtist({ id: artistDoc.id, ...artistDoc.data() });
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
      } catch (e) { setNotFound(true); }
      finally { setLoading(false); }
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

  function open(i) { setLightboxIndex(i); document.body.style.overflow = 'hidden'; }
  function close() { setLightboxIndex(null); document.body.style.overflow = ''; }
  function shift(dir) {
    if (lightboxIndex === null) return;
    setLightboxFading(true);
    setTimeout(() => {
      setLightboxIndex((lightboxIndex + dir + works.length) % works.length);
      setLightboxFading(false);
    }, 180);
  }

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#f5f4f2',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:'28px',height:'28px',border:'1.5px solid #ddd',borderTopColor:'#333',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  if (notFound) return (
    <div style={{minHeight:'100vh',background:'#f5f4f2',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'16px',fontFamily:'Inter,sans-serif'}}>
      <img src={LOGO} alt="StudioNXT" style={{width:'36px',height:'36px',opacity:0.3}}/>
      <div style={{fontSize:'18px',color:'#1a1a1a',fontFamily:'Georgia,serif'}}>Artist not found</div>
      <Link href="/" style={{fontSize:'10px',letterSpacing:'0.14em',textTransform:'uppercase',color:'#aaa',textDecoration:'none'}}>Return to StudioNXT</Link>
    </div>
  );

  const artistName = artist.name || username;

  return (
    <div style={{minHeight:'100vh',background:'#f5f4f2',fontFamily:'Inter,sans-serif',color:'#1a1a1a'}}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .work-card { background:#fff; cursor:pointer; transition: box-shadow 0.25s, transform 0.25s; }
        .work-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.12); transform: translateY(-2px); }
        .work-card:hover .work-img { opacity: 0.9; }
        .work-img { transition: opacity 0.25s; display:block; width:100%; height:auto; }
        .works-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
          padding: 48px 64px 80px;
        }
        @media(max-width:768px){
          .works-grid { grid-template-columns: 1fr; gap:16px; padding: 24px 20px 60px; }
          .page-header { padding: 40px 20px 32px !important; }
          .artist-name { font-size: 36px !important; }
          .meta-row { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
          .bio-section { padding: 40px 20px !important; }
          .contact-section { padding: 40px 20px !important; }
          .footer-bar { padding: 20px !important; }
        }
      `}</style>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div onClick={e => { if(e.target===e.currentTarget) close(); }}
          style={{position:'fixed',inset:0,zIndex:999,background:'rgba(8,8,8,0.96)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'48px 80px'}}>
          <button onClick={close} style={{position:'absolute',top:24,right:32,background:'none',border:'none',color:'rgba(255,255,255,0.4)',fontSize:'32px',cursor:'pointer',lineHeight:1,fontWeight:300}}>×</button>
          <button onClick={() => shift(-1)} style={{position:'absolute',left:24,top:'50%',transform:'translateY(-50%)',background:'none',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'50%',width:'48px',height:'48px',color:'rgba(255,255,255,0.5)',fontSize:'18px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>←</button>
          <button onClick={() => shift(1)} style={{position:'absolute',right:24,top:'50%',transform:'translateY(-50%)',background:'none',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'50%',width:'48px',height:'48px',color:'rgba(255,255,255,0.5)',fontSize:'18px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>→</button>
          {works[lightboxIndex] && (
            <div style={{textAlign:'center',opacity:lightboxFading?0:1,transition:'opacity 0.18s',maxWidth:'82vw'}}>
              <img src={works[lightboxIndex].imageUrl} alt={works[lightboxIndex].title}
                style={{maxWidth:'100%',maxHeight:'72vh',objectFit:'contain',display:'block',margin:'0 auto'}}/>
              <div style={{marginTop:'28px'}}>
                <div style={{fontFamily:'EB Garamond,Georgia,serif',fontSize:'22px',fontStyle:'italic',color:'#fff',marginBottom:'8px'}}>
                  {works[lightboxIndex].title || 'Untitled'}
                </div>
                <div style={{fontSize:'10px',letterSpacing:'0.16em',textTransform:'uppercase',color:'rgba(255,255,255,0.35)'}}>
                  {[works[lightboxIndex].medium, works[lightboxIndex].dimensions, works[lightboxIndex].year].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div style={{marginTop:'20px',fontSize:'10px',color:'rgba(255,255,255,0.2)',letterSpacing:'0.1em'}}>
                {lightboxIndex+1} / {works.length}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="page-header" style={{background:'#fff',borderBottom:'1px solid #e8e6e2',padding:'56px 64px 40px'}}>

        {/* Artist name — large */}
        <h1 className="artist-name" style={{
          fontFamily:'EB Garamond,Georgia,serif',
          fontSize:'clamp(40px,5vw,72px)',
          fontWeight:400,
          letterSpacing:'-0.02em',
          color:'#1a1a1a',
          lineHeight:1.05,
          marginBottom:'20px'
        }}>
          {artistName}
        </h1>

        {/* Meta row — practice, country, nav links, work count */}
        <div className="meta-row" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'24px',marginTop:'20px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'20px',flexWrap:'wrap'}}>
            {artist.practiceType && (
              <span style={{fontSize:'11px',letterSpacing:'0.18em',textTransform:'uppercase',color:'#555',fontWeight:500}}>
                {artist.practiceType}
              </span>
            )}
            {artist.practiceType && artist.country && (
              <span style={{color:'#ccc',fontSize:'11px'}}>·</span>
            )}
            {artist.country && (
              <span style={{fontSize:'11px',letterSpacing:'0.18em',textTransform:'uppercase',color:'#555',fontWeight:500}}>
                {artist.country}
              </span>
            )}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'32px',flexShrink:0}}>
            {artist.bio && (
              <a href="#about" style={{fontSize:'11px',letterSpacing:'0.16em',textTransform:'uppercase',color:'#888',textDecoration:'none',fontWeight:500,borderBottom:'1px solid transparent',transition:'color 0.2s,border-color 0.2s'}}
                onMouseOver={e=>{e.currentTarget.style.color='#1a1a1a';e.currentTarget.style.borderColor='#1a1a1a';}}
                onMouseOut={e=>{e.currentTarget.style.color='#888';e.currentTarget.style.borderColor='transparent';}}>
                About
              </a>
            )}
            {artist.email && (
              <a href="#contact" style={{fontSize:'11px',letterSpacing:'0.16em',textTransform:'uppercase',color:'#888',textDecoration:'none',fontWeight:500,borderBottom:'1px solid transparent',transition:'color 0.2s,border-color 0.2s'}}
                onMouseOver={e=>{e.currentTarget.style.color='#1a1a1a';e.currentTarget.style.borderColor='#1a1a1a';}}
                onMouseOut={e=>{e.currentTarget.style.color='#888';e.currentTarget.style.borderColor='transparent';}}>
                Contact
              </a>
            )}
            <span style={{fontSize:'11px',letterSpacing:'0.16em',textTransform:'uppercase',color:'#bbb',fontWeight:400}}>
              {works.length} {works.length === 1 ? 'Work' : 'Works'}
            </span>
          </div>
        </div>

      </header>

      {/* ── WORKS GRID ── */}
      <main>
        {works.length === 0 ? (
          <div style={{textAlign:'center',padding:'120px 0',color:'#bbb',fontSize:'13px',letterSpacing:'0.06em'}}>
            No works in this archive yet.
          </div>
        ) : (
          <div className="works-grid">
            {works.map((work, i) => (
              <div key={work.id} className="work-card" onClick={() => open(i)}>
                {/* Dark image box — natural ratio, no crop */}
                <div style={{background:'#111',overflow:'hidden',lineHeight:0}}>
                  <img
                    src={work.imageUrl}
                    alt={work.title || 'Untitled'}
                    className="work-img"
                    loading="lazy"
                  />
                </div>
                {/* Metadata */}
                <div style={{padding:'16px 18px 20px'}}>
                  <div style={{fontFamily:'EB Garamond,Georgia,serif',fontSize:'16px',color:'#1a1a1a',marginBottom:'5px',lineHeight:1.3,fontStyle:'italic'}}>
                    {work.title || 'Untitled'}
                  </div>
                  <div style={{fontSize:'10px',letterSpacing:'0.1em',textTransform:'uppercase',color:'#999',lineHeight:1.7}}>
                    {work.year && <span>{work.year}</span>}
                    {work.year && work.medium && <span style={{margin:'0 5px',opacity:0.4}}>·</span>}
                    {work.medium && <span>{work.medium}</span>}
                  </div>
                  {work.dimensions && (
                    <div style={{fontSize:'10px',color:'#bbb',marginTop:'2px',letterSpacing:'0.05em'}}>
                      {work.dimensions}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── ABOUT THE ARTIST ── */}
      {artist.bio && (
        <div id="about" className="bio-section" style={{background:'#fff',borderTop:'1px solid #e8e6e2',padding:'64px'}}>
          <div style={{maxWidth:'680px'}}>
            <div style={{fontSize:'10px',letterSpacing:'0.22em',textTransform:'uppercase',color:'#bbb',marginBottom:'24px',fontWeight:500}}>
              About the Artist
            </div>
            <p style={{fontFamily:'EB Garamond,Georgia,serif',fontSize:'20px',lineHeight:1.85,color:'#333',fontWeight:400,margin:0}}>
              {artist.bio}
            </p>
          </div>
        </div>
      )}

      {/* ── CONTACT ── */}
      {artist.email && (
        <div id="contact" className="contact-section" style={{background:'#1a1a1a',padding:'64px'}}>
          <div style={{maxWidth:'680px'}}>
            <div style={{fontSize:'10px',letterSpacing:'0.22em',textTransform:'uppercase',color:'rgba(255,255,255,0.3)',marginBottom:'16px',fontWeight:500}}>
              Contact
            </div>
            <div style={{fontFamily:'EB Garamond,Georgia,serif',fontSize:'28px',color:'#fff',marginBottom:'28px',fontWeight:400,letterSpacing:'-0.01em'}}>
              Enquiries & Acquisition
            </div>
            <a href={'mailto:' + artist.email}
              style={{display:'inline-block',background:'#fff',color:'#1a1a1a',fontSize:'10px',letterSpacing:'0.18em',textTransform:'uppercase',fontWeight:600,padding:'16px 40px',textDecoration:'none',transition:'opacity 0.2s'}}
              onMouseOver={e => e.currentTarget.style.opacity='0.85'}
              onMouseOut={e => e.currentTarget.style.opacity='1'}
            >
              Get in Touch
            </a>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer className="footer-bar" style={{background:'#f5f4f2',borderTop:'1px solid #e8e6e2',padding:'28px 64px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:'10px',letterSpacing:'0.1em',textTransform:'uppercase',color:'#bbb'}}>
          Archive preserved by{' '}
          <a href="https://studionxt.vercel.app" style={{color:'#999',textDecoration:'none'}}>StudioNXT</a>
        </div>
        <img src={LOGO} alt="StudioNXT" style={{width:'22px',height:'22px',opacity:0.15}}/>
      </footer>

    </div>
  );
}

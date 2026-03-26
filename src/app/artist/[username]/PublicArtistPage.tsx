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
  const hasBio = !!artist.bio;
  const hasContact = !!artist.email;
  const navLinks = [
    { label: 'Works', href: '#works', always: true },
    { label: 'About', href: '#about', show: hasBio },
    { label: 'Contact', href: '#contact', show: hasContact },
  ].filter(l => l.always || l.show);

  return (
    <div style={{minHeight:'100vh',background:'#f5f4f2',fontFamily:'Inter,sans-serif',color:'#1a1a1a'}}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        .work-card { background:#fff; cursor:pointer; transition:box-shadow 0.25s,transform 0.2s; }
        .work-card:hover { box-shadow:0 8px 40px rgba(0,0,0,0.13); transform:translateY(-3px); }
        .work-card:hover .work-img { opacity:0.88; }
        .work-img { transition:opacity 0.25s; display:block; width:100%; height:auto; }
        .nav-link { font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#555; text-decoration:none; font-weight:500; padding-bottom:2px; border-bottom:1px solid transparent; transition:color 0.2s,border-color 0.2s; }
        .nav-link:hover { color:#1a1a1a; border-bottom-color:#1a1a1a; }
        .works-grid {
          display:grid;
          grid-template-columns:repeat(auto-fill,minmax(280px,1fr));
          gap:24px;
          padding:48px 64px 80px;
        }
        @media(max-width:768px){
          .works-grid { grid-template-columns:1fr; gap:16px; padding:24px 20px 60px; }
          .site-header { padding:32px 20px 28px !important; }
          .header-top { flex-direction:column !important; align-items:flex-start !important; gap:20px !important; }
          .artist-name { font-size:38px !important; }
          .header-meta { flex-direction:column !important; align-items:flex-start !important; gap:16px !important; }
          .about-inner { padding:40px 20px !important; }
          .contact-inner { padding:40px 20px !important; }
          .footer-inner { padding:24px 20px !important; flex-direction:column !important; gap:12px !important; }
        }
      `}</style>

      {/* ── LIGHTBOX — white background, artwork centred ── */}
      {lightboxIndex !== null && (
        <div onClick={e => { if(e.target===e.currentTarget) close(); }}
          style={{position:'fixed',inset:0,zIndex:999,background:'rgba(250,249,247,0.98)',backdropFilter:'blur(8px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 80px'}}>
          <button onClick={close}
            style={{position:'absolute',top:24,right:32,background:'none',border:'none',color:'#999',fontSize:'28px',cursor:'pointer',lineHeight:1,fontWeight:300,transition:'color 0.2s'}}
            onMouseOver={e=>e.currentTarget.style.color='#333'}
            onMouseOut={e=>e.currentTarget.style.color='#999'}>×</button>
          <button onClick={() => shift(-1)}
            style={{position:'absolute',left:24,top:'50%',transform:'translateY(-50%)',background:'none',border:'1px solid #ddd',borderRadius:'50%',width:'48px',height:'48px',color:'#999',fontSize:'16px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s'}}
            onMouseOver={e=>{e.currentTarget.style.borderColor='#333';e.currentTarget.style.color='#333';}}
            onMouseOut={e=>{e.currentTarget.style.borderColor='#ddd';e.currentTarget.style.color='#999';}}>←</button>
          <button onClick={() => shift(1)}
            style={{position:'absolute',right:24,top:'50%',transform:'translateY(-50%)',background:'none',border:'1px solid #ddd',borderRadius:'50%',width:'48px',height:'48px',color:'#999',fontSize:'16px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s'}}
            onMouseOver={e=>{e.currentTarget.style.borderColor='#333';e.currentTarget.style.color='#333';}}
            onMouseOut={e=>{e.currentTarget.style.borderColor='#ddd';e.currentTarget.style.color='#999';}}>→</button>
          {works[lightboxIndex] && (
            <div style={{textAlign:'center',opacity:lightboxFading?0:1,transition:'opacity 0.18s',maxWidth:'80vw'}}>
              <img src={works[lightboxIndex].imageUrl} alt={works[lightboxIndex].title}
                style={{maxWidth:'100%',maxHeight:'68vh',objectFit:'contain',display:'block',margin:'0 auto',boxShadow:'0 4px 40px rgba(0,0,0,0.1)'}}/>
              <div style={{marginTop:'28px'}}>
                <div style={{fontFamily:'EB Garamond,Georgia,serif',fontSize:'22px',fontStyle:'italic',color:'#1a1a1a',marginBottom:'8px'}}>
                  {works[lightboxIndex].title || 'Untitled'}
                </div>
                <div style={{fontSize:'10px',letterSpacing:'0.16em',textTransform:'uppercase',color:'#aaa'}}>
                  {[works[lightboxIndex].medium, works[lightboxIndex].dimensions, works[lightboxIndex].year].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div style={{marginTop:'16px',fontSize:'10px',color:'#ccc',letterSpacing:'0.1em'}}>
                {lightboxIndex+1} / {works.length}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="site-header" style={{background:'#fff',borderBottom:'1px solid #e8e6e2',padding:'48px 64px 36px'}}>

        {/* Top row: artist name + nav links */}
        <div className="header-top" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'32px',marginBottom:'20px'}}>
          <h1 className="artist-name" style={{fontFamily:'EB Garamond,Georgia,serif',fontSize:'clamp(42px,5vw,76px)',fontWeight:400,letterSpacing:'-0.02em',color:'#1a1a1a',lineHeight:1.0}}>
            {artistName}
          </h1>
          {/* Nav links — right aligned, always visible */}
          <nav style={{display:'flex',alignItems:'center',gap:'32px',paddingTop:'12px',flexShrink:0}}>
            {navLinks.map(l => (
              <a key={l.label} href={l.href} className="nav-link">{l.label}</a>
            ))}
          </nav>
        </div>

        {/* Bottom row: practice · country + work count */}
        <div className="header-meta" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            {artist.practiceType && (
              <span style={{fontSize:'11px',letterSpacing:'0.16em',textTransform:'uppercase',color:'#777',fontWeight:500}}>
                {artist.practiceType}
              </span>
            )}
            {artist.practiceType && artist.country && (
              <span style={{color:'#ccc',fontSize:'13px',lineHeight:1}}>·</span>
            )}
            {artist.country && (
              <span style={{fontSize:'11px',letterSpacing:'0.16em',textTransform:'uppercase',color:'#777',fontWeight:500}}>
                {artist.country}
              </span>
            )}
          </div>
          <span style={{fontSize:'11px',letterSpacing:'0.16em',textTransform:'uppercase',color:'#aaa',fontWeight:400}}>
            {works.length} {works.length === 1 ? 'Work' : 'Works'}
          </span>
        </div>

      </header>

      {/* ── WORKS GRID ── */}
      <main id="works">
        {works.length === 0 ? (
          <div style={{textAlign:'center',padding:'120px 0',color:'#bbb',fontSize:'13px',letterSpacing:'0.06em'}}>
            No works in this archive yet.
          </div>
        ) : (
          <div className="works-grid">
            {works.map((work, i) => (
              <div key={work.id} className="work-card" onClick={() => open(i)}>
                <div style={{background:'#1a1a1a',overflow:'hidden',lineHeight:0}}>
                  <img src={work.imageUrl} alt={work.title || 'Untitled'} className="work-img" loading="lazy"/>
                </div>
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
                    <div style={{fontSize:'10px',color:'#bbb',marginTop:'2px',letterSpacing:'0.05em'}}>{work.dimensions}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── ABOUT — only if bio exists ── */}
      {hasBio && (
        <div id="about" style={{background:'#fff',borderTop:'1px solid #e8e6e2'}}>
          <div className="about-inner" style={{maxWidth:'1400px',margin:'0 auto',padding:'64px'}}>
            <div style={{fontSize:'10px',letterSpacing:'0.22em',textTransform:'uppercase',color:'#bbb',marginBottom:'24px',fontWeight:500}}>About the Artist</div>
            <p style={{fontFamily:'EB Garamond,Georgia,serif',fontSize:'20px',lineHeight:1.9,color:'#333',fontWeight:400,maxWidth:'680px'}}>
              {artist.bio}
            </p>
          </div>
        </div>
      )}

      {/* ── CONTACT — only if email exists ── */}
      {hasContact && (
        <div id="contact" style={{background:'#1a1a1a',borderTop:'1px solid #111'}}>
          <div className="contact-inner" style={{maxWidth:'1400px',margin:'0 auto',padding:'64px'}}>
            <div style={{fontSize:'10px',letterSpacing:'0.22em',textTransform:'uppercase',color:'rgba(255,255,255,0.3)',marginBottom:'16px',fontWeight:500}}>Contact</div>
            <div style={{fontFamily:'EB Garamond,Georgia,serif',fontSize:'32px',color:'#fff',marginBottom:'32px',fontWeight:400,letterSpacing:'-0.01em',lineHeight:1.2}}>
              Enquiries &amp; Acquisition
            </div>
            <a href={'mailto:' + artist.email}
              style={{display:'inline-block',background:'#fff',color:'#1a1a1a',fontSize:'10px',letterSpacing:'0.2em',textTransform:'uppercase',fontWeight:600,padding:'16px 44px',textDecoration:'none',transition:'opacity 0.2s'}}
              onMouseOver={e=>e.currentTarget.style.opacity='0.85'}
              onMouseOut={e=>e.currentTarget.style.opacity='1'}>
              Get in Touch
            </a>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer>
        <div className="footer-inner" style={{maxWidth:'1400px',margin:'0 auto',padding:'28px 64px',display:'flex',justifyContent:'space-between',alignItems:'center',borderTop:'1px solid #e8e6e2'}}>
          <div style={{fontSize:'10px',letterSpacing:'0.1em',textTransform:'uppercase',color:'#bbb'}}>
            Archive preserved by{' '}
            <a href="https://studionxt.vercel.app" style={{color:'#999',textDecoration:'none'}}>StudioNXT</a>
          </div>
          <img src={LOGO} alt="StudioNXT" style={{width:'22px',height:'22px',opacity:0.15}}/>
        </div>
      </footer>

    </div>
  );
}

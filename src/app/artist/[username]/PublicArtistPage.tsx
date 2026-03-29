'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

const LOGO = "https://firebasestorage.googleapis.com/v0/b/studionxt-2657b.firebasestorage.app/o/artnxt.png?alt=media&token=991c5ea4-8d04-48ae-b82d-67d6f5900890";
const PURPLE = 'rgb(54, 40, 91)';
const LIGHT_GRAY = 'rgb(229, 231, 235)';
const HEADING_FONT = '"Avenir Next Condensed", "Arial Narrow", "Times New Roman", ui-serif, Georgia, serif';
const BODY_FONT = 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"';

export default function PublicArtistPage({ username }) {
  const [artist, setArtist] = useState(null);
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [lightboxFading, setLightboxFading] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        // Read from /public/{username} — safe public document only
        // This never exposes private artist data
        const { doc: pd, getDoc: pg } = await import('firebase/firestore');
        const pubSnap = await pg(pd(db, 'public', username));
        if (!pubSnap.exists()) { setNotFound(true); setLoading(false); return; }
        const pubData = pubSnap.data();
        setArtist(pubData);
        const uid = pubData.uid;
        // Load only public artworks from the artist subcollection
        const worksSnap = await getDocs(collection(db, 'artists', uid, 'artworks'));
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
      } catch (e) { console.error(e); setNotFound(true); }
      finally { setLoading(false); }
    }
    load();
  }, [username]);

  useEffect(() => {
    function onKey(e) {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowRight') shift(1);
      if (e.key === 'ArrowLeft') shift(-1);
      if (e.key === 'Escape') { close(); setShowAbout(false); setShowContact(false); }
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
    <div style={{minHeight:'100vh',background:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:'28px',height:'28px',border:'2px solid '+LIGHT_GRAY,borderTopColor:PURPLE,borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  if (notFound) return (
    <div style={{minHeight:'100vh',background:'#fff',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'16px',fontFamily:BODY_FONT}}>
      <img src={LOGO} alt="StudioNXT" style={{width:'36px',height:'36px',opacity:0.3}}/>
      <div style={{fontSize:'24px',color:PURPLE,fontFamily:HEADING_FONT,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}>Artist Not Found</div>
      <Link href="/" style={{fontSize:'13px',color:PURPLE,opacity:0.5,textDecoration:'none',fontFamily:BODY_FONT}}>Return to StudioNXT</Link>
    </div>
  );

  const artistName = artist.name || username;
  const hasBio = !!artist.bio;
  const hasContact = !!artist.email;

  return (
    <div style={{minHeight:'100vh',background:'#ffffff',fontFamily:BODY_FONT,color:PURPLE,boxSizing:'border-box'}}>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .work-card {
          background: #fff;
          cursor: pointer;
          border: 1px solid ${LIGHT_GRAY};
          transition: box-shadow 0.25s, transform 0.2s;
        }
        .work-card:hover {
          box-shadow: 0 8px 40px rgba(54,40,91,0.12);
          transform: translateY(-3px);
        }
        .work-card:hover .work-img { opacity: 0.88; }
        .work-img { transition: opacity 0.25s; display: block; width: 100%; height: auto; }
        .nav-link {
          font-family: ${BODY_FONT};
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${PURPLE};
          text-decoration: none;
          opacity: 0.6;
          transition: opacity 0.2s;
        }
        .nav-link:hover { opacity: 1; }
        .works-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
          padding: 56px 64px 80px;
          background: #fafafa;
        }
        .section-label {
          font-family: ${BODY_FONT};
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: ${PURPLE};
          opacity: 0.4;
          margin-bottom: 24px;
          display: block;
        }
        @media(max-width: 768px) {
          .works-grid { grid-template-columns: 1fr; gap: 16px; padding: 24px 20px 60px; }
          .site-header { padding: 32px 20px 28px !important; }
          .artist-name { font-size: 52px !important; line-height: 1 !important; }
          .header-top { flex-direction: column !important; gap: 24px !important; }
          .header-nav { flex-wrap: wrap !important; gap: 20px !important; }
          .about-inner { padding: 48px 20px !important; }
          .contact-inner { padding: 48px 20px !important; }
          .footer-inner { padding: 24px 20px !important; flex-direction: column !important; gap: 12px !important; align-items: flex-start !important; }
        }
      `}</style>

      {/* ── LIGHTBOX — image top, details below ── */}
      {lightboxIndex !== null && works[lightboxIndex] && (
        <div
          onClick={e => { if(e.target===e.currentTarget) close(); }}
          style={{position:'fixed',inset:0,zIndex:999,background:'rgba(255,255,255,0.99)',backdropFilter:'blur(16px)',overflowY:'auto',overflowX:'hidden'}}
        >
          {/* Close */}
          <button onClick={close}
            style={{position:'fixed',top:24,right:28,background:'none',border:'none',fontFamily:'HEADING_FONT',fontSize:'28px',cursor:'pointer',lineHeight:1,fontWeight:300,zIndex:1000,color:'rgb(54,40,91)',opacity:0.45,transition:'opacity 0.2s'}}
            onMouseOver={e=>e.currentTarget.style.opacity='1'}
            onMouseOut={e=>e.currentTarget.style.opacity='0.45'}>×</button>

          {/* Prev / Next */}
          <button onClick={e=>{e.stopPropagation();shift(-1);}}
            style={{position:'fixed',left:16,top:'50%',transform:'translateY(-50%)',background:'#fff',border:'1px solid rgb(229,231,235)',borderRadius:'50%',width:'48px',height:'48px',color:'rgb(54,40,91)',opacity:0.5,fontSize:'18px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s',zIndex:1000,boxShadow:'0 2px 12px rgba(54,40,91,0.08)'}}
            onMouseOver={e=>{e.currentTarget.style.opacity='1';}}
            onMouseOut={e=>{e.currentTarget.style.opacity='0.5';}}>←</button>
          <button onClick={e=>{e.stopPropagation();shift(1);}}
            style={{position:'fixed',right:16,top:'50%',transform:'translateY(-50%)',background:'#fff',border:'1px solid rgb(229,231,235)',borderRadius:'50%',width:'48px',height:'48px',color:'rgb(54,40,91)',opacity:0.5,fontSize:'18px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s',zIndex:1000,boxShadow:'0 2px 12px rgba(54,40,91,0.08)'}}
            onMouseOver={e=>{e.currentTarget.style.opacity='1';}}
            onMouseOut={e=>{e.currentTarget.style.opacity='0.5';}}>→</button>

          <div style={{opacity:lightboxFading?0:1,transition:'opacity 0.18s',maxWidth:'860px',margin:'0 auto',padding:'72px 24px 80px'}}>

            {/* Image — full width, natural ratio */}
            <div style={{background:'#1a1a1a',lineHeight:0,marginBottom:'0'}}>
              <img
                src={works[lightboxIndex].imageUrl}
                alt={works[lightboxIndex].title}
                style={{width:'100%',height:'auto',display:'block',objectFit:'contain'}}
              />
            </div>

            {/* Details panel */}
            <div style={{background:'#fff',border:'1px solid rgb(229,231,235)',borderTop:'none',padding:'32px 36px 40px'}}>

              {/* Title + Year row */}
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'24px',marginBottom:'32px',paddingBottom:'24px',borderBottom:'1px solid rgb(229,231,235)'}}>
                <div style={{fontFamily:'"Avenir Next Condensed","Arial Narrow","Times New Roman",ui-serif,Georgia,serif',fontSize:'clamp(28px,4vw,42px)',fontWeight:700,textTransform:'uppercase',letterSpacing:'-0.01em',color:'rgb(54,40,91)',lineHeight:'0.95'}}>
                  {works[lightboxIndex].title || 'Untitled'}
                </div>
                {works[lightboxIndex].year && (
                  <div style={{fontFamily:'ui-sans-serif,system-ui,sans-serif',fontSize:'16px',fontWeight:600,color:'rgb(54,40,91)',opacity:0.5,flexShrink:0,paddingTop:'4px'}}>
                    {works[lightboxIndex].year}
                  </div>
                )}
              </div>

              {/* Conditional fields */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'24px 40px'}}>
                {[
                  {label:'Medium', value: works[lightboxIndex].medium},
                  {label:'Materials', value: works[lightboxIndex].materials},
                  {label:'Dimensions', value: works[lightboxIndex].dimensions},
                  {label:'Technique', value: works[lightboxIndex].productionTechnique},
                  {label:'Printer / Foundry', value: works[lightboxIndex].printer},
                  {label:'Publisher', value: works[lightboxIndex].publisher},
                  {label:'Condition', value: works[lightboxIndex].condition},
                  {label:'Signature', value: works[lightboxIndex].signatureDetails},
                  {label:'Certificate', value: works[lightboxIndex].certificateIssued ? 'Certificate of Authenticity issued' : null},
                  {label:'Edition', value: works[lightboxIndex].classification === 'LimitedEdition'
                    ? ('Edition of ' + works[lightboxIndex].editionSize + (works[lightboxIndex].apCount ? ' + ' + works[lightboxIndex].apCount + ' AP' : ''))
                    : works[lightboxIndex].classification === 'OpenEdition' ? 'Open Edition'
                    : works[lightboxIndex].classification === 'Unique' ? 'Unique work' : null},
                ].filter(f => f.value).map(field => (
                  <div key={field.label}>
                    <div style={{fontFamily:'ui-sans-serif,system-ui,sans-serif',fontSize:'10px',fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:'rgb(54,40,91)',opacity:0.35,marginBottom:'6px'}}>
                      {field.label}
                    </div>
                    <div style={{fontFamily:'ui-sans-serif,system-ui,sans-serif',fontSize:'15px',fontWeight:500,lineHeight:'22px',color:'rgb(54,40,91)'}}>
                      {field.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Enquire button */}
              {artist && artist.email && (
                <div style={{marginTop:'36px',paddingTop:'28px',borderTop:'1px solid rgb(229,231,235)'}}>
                  <a href={'mailto:' + artist.email + '?subject=Enquiry: ' + encodeURIComponent(works[lightboxIndex].title || 'Untitled')}
                    style={{display:'inline-block',background:'rgb(54,40,91)',color:'#fff',fontFamily:'ui-sans-serif,system-ui,sans-serif',fontSize:'11px',letterSpacing:'0.18em',textTransform:'uppercase',fontWeight:700,padding:'16px 40px',textDecoration:'none',transition:'opacity 0.2s'}}
                    onMouseOver={e=>e.currentTarget.style.opacity='0.85'}
                    onMouseOut={e=>e.currentTarget.style.opacity='1'}>
                    Enquire about this work
                  </a>
                </div>
              )}

              {/* Counter */}
              <div style={{marginTop:'20px',fontFamily:'ui-sans-serif,system-ui,sans-serif',fontSize:'11px',color:'rgb(54,40,91)',opacity:0.2,letterSpacing:'0.1em'}}>
                {lightboxIndex+1} / {works.length}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="site-header" style={{background:'#fff',borderBottom:'1px solid '+LIGHT_GRAY,padding:'48px 64px 36px'}}>

        {/* Top: artist name + nav */}
        <div className="header-top" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'40px',marginBottom:'24px'}}>
          <h1 className="artist-name" style={{
            fontFamily: HEADING_FONT,
            fontSize: 'clamp(52px, 6vw, 84px)',
            fontWeight: 700,
            lineHeight: '0.95',
            letterSpacing: '-0.01em',
            color: PURPLE,
            textTransform: 'uppercase',
            marginBottom: '0',
          }}>
            {artistName}
          </h1>
          <nav className="header-nav" style={{display:'flex',alignItems:'center',gap:'32px',paddingTop:'14px',flexShrink:0}}>
            <a href="#works" className="nav-link">Works</a>
            {hasBio && (
              <button onClick={() => setShowAbout(true)} className="nav-link" style={{background:'none',border:'none',cursor:'pointer',padding:0}}>About</button>
            )}
            {hasContact && (
              <button onClick={() => setShowContact(true)} className="nav-link" style={{background:'none',border:'none',cursor:'pointer',padding:0}}>Contact</button>
            )}
          </nav>
        </div>

        {/* Bottom: practice · country + count */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            {artist.practiceType && (
              <span style={{fontFamily:BODY_FONT,fontSize:'13px',fontWeight:600,letterSpacing:'0.14em',textTransform:'uppercase',color:PURPLE,opacity:0.6}}>
                {artist.practiceType}
              </span>
            )}
            {artist.practiceType && artist.country && (
              <span style={{color:PURPLE,opacity:0.3,fontSize:'14px'}}>·</span>
            )}
            {artist.country && (
              <span style={{fontFamily:BODY_FONT,fontSize:'13px',fontWeight:600,letterSpacing:'0.14em',textTransform:'uppercase',color:PURPLE,opacity:0.6}}>
                {artist.country}
              </span>
            )}
          </div>
          <span style={{fontFamily:BODY_FONT,fontSize:'13px',fontWeight:500,letterSpacing:'0.12em',textTransform:'uppercase',color:PURPLE,opacity:0.4}}>
            {works.length} {works.length === 1 ? 'Work' : 'Works'}
          </span>
        </div>

      </header>

      {/* ── WORKS GRID ── */}
      <main id="works">
        {works.length === 0 ? (
          <div style={{textAlign:'center',padding:'120px 48px',fontFamily:BODY_FONT}}>
            <div style={{fontSize:'13px',fontWeight:600,letterSpacing:'0.16em',textTransform:'uppercase',color:PURPLE,opacity:0.25,marginBottom:'16px'}}>
              Archive
            </div>
            <div style={{fontFamily:HEADING_FONT,fontSize:'clamp(28px,3vw,40px)',fontWeight:700,textTransform:'uppercase',color:PURPLE,opacity:0.15,letterSpacing:'-0.01em',lineHeight:'1',marginBottom:'20px'}}>
              {artistName}
            </div>
            <div style={{fontFamily:BODY_FONT,fontSize:'15px',fontWeight:500,color:PURPLE,opacity:0.3,lineHeight:'24px',maxWidth:'360px',margin:'0 auto'}}>
              This artist has not yet shared any works publicly. Check back soon.
            </div>
          </div>
        ) : (
          <div className="works-grid">
            {works.map((work, i) => (
              <div key={work.id} className="work-card" onClick={() => open(i)}>
                {/* Dark image box — natural ratio, no crop */}
                <div style={{background:'#1a1a1a',overflow:'hidden',lineHeight:0}}>
                  <img src={work.imageUrl} alt={work.title || 'Untitled'} className="work-img" loading="lazy"/>
                </div>
                {/* Metadata */}
                <div style={{padding:'16px 18px 20px',background:'#fff'}}>
                  <div style={{fontFamily:HEADING_FONT,fontSize:'20px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.02em',color:PURPLE,marginBottom:'6px',lineHeight:'1.15'}}>
                    {work.title || 'Untitled'}
                  </div>
                  <div style={{fontFamily:BODY_FONT,fontSize:'12px',fontWeight:500,letterSpacing:'0.1em',textTransform:'uppercase',color:PURPLE,opacity:0.45,lineHeight:'20px'}}>
                    {work.year && <span>{work.year}</span>}
                    {work.year && work.medium && <span style={{margin:'0 6px',opacity:0.4}}>·</span>}
                    {work.medium && <span>{work.medium}</span>}
                  </div>
                  {work.dimensions && (
                    <div style={{fontFamily:BODY_FONT,fontSize:'11px',color:PURPLE,opacity:0.3,marginTop:'3px',letterSpacing:'0.05em'}}>
                      {work.dimensions}
                    </div>
                  )}
                  {work.series && work.series.length > 0 && (
                    <div style={{marginTop:'8px',display:'flex',flexWrap:'wrap',gap:'4px'}}>
                      {work.series.map((s: string) => (
                        <span key={s} style={{fontFamily:BODY_FONT,fontSize:'10px',fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:PURPLE,opacity:0.5,background:'rgba(54,40,91,0.06)',padding:'3px 8px',borderRadius:'4px'}}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── ABOUT MODAL ── */}
      {showAbout && hasBio && (
        <div onClick={e => { if(e.target === e.currentTarget) setShowAbout(false); }}
          style={{position:'fixed',inset:0,zIndex:998,background:'rgba(54,40,91,0.6)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
          <div style={{background:'#fff',maxWidth:'720px',width:'100%',maxHeight:'88vh',overflowY:'auto',position:'relative'}}>
            <button onClick={() => setShowAbout(false)}
              style={{position:'absolute',top:16,right:20,background:'none',border:'none',fontSize:'26px',cursor:'pointer',color:PURPLE,opacity:0.4,lineHeight:1,zIndex:1}}
              onMouseOver={e=>e.currentTarget.style.opacity='1'}
              onMouseOut={e=>e.currentTarget.style.opacity='0.4'}>×</button>
            {/* Stats strip */}
            {(artist.practiceType || artist.country) && (
              <div style={{display:'flex',borderBottom:'1px solid '+LIGHT_GRAY}}>
                {[{label:'Practice',value:artist.practiceType},{label:'Based',value:artist.country}]
                  .filter(f=>f.value).map((f,i,arr)=>(
                  <div key={f.label} style={{flex:1,padding:'20px 32px',borderRight:i<arr.length-1?'1px solid '+LIGHT_GRAY:'none'}}>
                    <div style={{fontFamily:BODY_FONT,fontSize:'9px',fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:PURPLE,opacity:0.35,marginBottom:'6px'}}>{f.label}</div>
                    <div style={{fontFamily:BODY_FONT,fontSize:'15px',fontWeight:600,color:PURPLE}}>{f.value}</div>
                  </div>
                ))}
              </div>
            )}
            {/* Bio */}
            <div style={{padding:'48px'}}>
              <div style={{fontFamily:BODY_FONT,fontSize:'9px',fontWeight:600,letterSpacing:'0.22em',textTransform:'uppercase',color:PURPLE,opacity:0.35,marginBottom:'28px'}}>Biography</div>
              {artist.bio.split('\n\n').map((para, i) => (
                <p key={i} style={{fontFamily:'Georgia,serif',fontSize:'18px',lineHeight:'1.9',color:PURPLE,marginBottom:'20px',fontWeight:400}}>
                  {para}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CONTACT MODAL ── */}
      {showContact && hasContact && (
        <div onClick={e => { if(e.target === e.currentTarget) setShowContact(false); }}
          style={{position:'fixed',inset:0,zIndex:998,background:'rgba(54,40,91,0.6)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
          <div style={{background:PURPLE,maxWidth:'480px',width:'100%',padding:'52px',position:'relative'}}>
            <button onClick={() => setShowContact(false)}
              style={{position:'absolute',top:16,right:20,background:'none',border:'none',fontSize:'26px',cursor:'pointer',color:'#fff',opacity:0.4,lineHeight:1}}
              onMouseOver={e=>e.currentTarget.style.opacity='1'}
              onMouseOut={e=>e.currentTarget.style.opacity='0.4'}>×</button>
            <div style={{fontFamily:BODY_FONT,fontSize:'9px',fontWeight:600,letterSpacing:'0.22em',textTransform:'uppercase',color:'rgba(255,255,255,0.4)',marginBottom:'16px'}}>Contact</div>
            <div style={{fontFamily:HEADING_FONT,fontSize:'clamp(28px,4vw,44px)',fontWeight:700,textTransform:'uppercase',color:'#fff',marginBottom:'16px',lineHeight:'1'}}>
              Enquiries &amp;<br/>Acquisition
            </div>
            <div style={{fontFamily:BODY_FONT,fontSize:'14px',color:'rgba(255,255,255,0.5)',marginBottom:'36px',lineHeight:'1.6'}}>
              {artistName} welcomes enquiries about works in this archive.
            </div>
            <a href={'mailto:'+artist.email+'?subject=Enquiry — '+encodeURIComponent(artistName)}
              style={{display:'inline-block',background:'#fff',color:PURPLE,fontFamily:BODY_FONT,fontSize:'11px',letterSpacing:'0.18em',textTransform:'uppercase',fontWeight:700,padding:'16px 40px',textDecoration:'none'}}
              onMouseOver={e=>e.currentTarget.style.opacity='0.85'}
              onMouseOut={e=>e.currentTarget.style.opacity='1'}>
              Send Enquiry
            </a>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer style={{background:'#fff',borderTop:'1px solid '+LIGHT_GRAY}}>
        <div className="footer-inner" style={{maxWidth:'1400px',margin:'0 auto',padding:'28px 64px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontFamily:BODY_FONT,fontSize:'11px',fontWeight:500,letterSpacing:'0.1em',textTransform:'uppercase',color:PURPLE,opacity:0.35}}>
            Archive preserved by{' '}
            <a href="https://studionxt.vercel.app" style={{color:PURPLE,opacity:1,textDecoration:'none'}}>StudioNXT</a>
          </div>
          <img src={LOGO} alt="StudioNXT" style={{width:'22px',height:'22px',opacity:0.2}}/>
        </div>
      </footer>

    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

const LOGO = "https://firebasestorage.googleapis.com/v0/b/studionxt-2657b.firebasestorage.app/o/artnxt.png?alt=media&token=991c5ea4-8d04-48ae-b82d-67d6f5900890";

export default function SharePage({ params }: { params: { shareId: string } }) {
  const [share, setShare] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'shares', params.shareId));
        if (!snap.exists()) { setNotFound(true); setLoading(false); return; }
        setShare({ id: snap.id, ...snap.data() });
      } catch (e) { setNotFound(true); }
      finally { setLoading(false); }
    }
    load();
  }, [params.shareId]);

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#f5f4f2',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:'28px',height:'28px',border:'1.5px solid #ddd',borderTopColor:'#333',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  if (notFound) return (
    <div style={{minHeight:'100vh',background:'#f5f4f2',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'16px',fontFamily:'ui-sans-serif,system-ui,sans-serif'}}>
      <img src={LOGO} alt="StudioNXT" style={{width:'36px',height:'36px',opacity:0.3}}/>
      <div style={{fontSize:'18px',color:'#1a1a1a',fontFamily:'Georgia,serif'}}>This link is no longer available</div>
      <div style={{fontSize:'13px',color:'#aaa'}}>The artist may have revoked access to this work.</div>
      <Link href="/" style={{fontSize:'11px',color:'#aaa',textDecoration:'none',letterSpacing:'0.1em',textTransform:'uppercase'}}>StudioNXT</Link>
    </div>
  );

  const { artworkSnapshot: aw, showPrice, showLocation, artistName, artistEmail } = share as any;

  return (
    <div style={{minHeight:'100vh',background:'#f5f4f2',fontFamily:'ui-sans-serif,system-ui,sans-serif'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;1,400&display=swap');
        * { box-sizing: border-box; }
        @media(max-width:640px){
          .share-inner { padding: 32px 20px 60px !important; }
          .share-img { max-height: 65vw !important; }
        }
      `}</style>

      {/* Nav */}
      <div style={{background:'#fff',borderBottom:'1px solid rgb(229,231,235)',padding:'16px 40px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontSize:'11px',letterSpacing:'0.14em',textTransform:'uppercase',color:'#aaa'}}>
          Shared by {artistName || 'Artist'}
        </div>
        <img src={LOGO} alt="StudioNXT" style={{width:'24px',height:'24px',opacity:0.2}}/>
      </div>

      {/* Content */}
      <div className="share-inner" style={{maxWidth:'800px',margin:'0 auto',padding:'56px 40px 80px'}}>

        {/* Image */}
        <div style={{background:'#1a1a1a',marginBottom:'0',lineHeight:0}}>
          <img
            src={aw.imageUrl}
            alt={aw.title}
            className="share-img"
            style={{width:'100%',height:'auto',maxHeight:'70vh',objectFit:'contain',display:'block'}}
          />
        </div>

        {/* Details panel */}
        <div style={{background:'#fff',border:'1px solid rgb(229,231,235)',borderTop:'none',padding:'28px 32px 32px'}}>

          {/* Title + year */}
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',marginBottom:'24px',paddingBottom:'20px',borderBottom:'1px solid rgb(229,231,235)'}}>
            <div style={{fontFamily:'EB Garamond,Georgia,serif',fontSize:'clamp(22px,3vw,32px)',fontWeight:400,fontStyle:'italic',color:'#1a1a1a',lineHeight:'1.1'}}>
              {aw.title || 'Untitled'}
            </div>
            {aw.year && (
              <div style={{fontFamily:'ui-sans-serif,system-ui,sans-serif',fontSize:'14px',color:'#aaa',flexShrink:0,paddingTop:'4px'}}>
                {aw.year}
              </div>
            )}
          </div>

          {/* Fields grid */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'20px 32px',marginBottom:'24px'}}>
            {[
              {label:'Medium', value: aw.medium},
              {label:'Dimensions', value: aw.dimensions},
              {label:'Materials', value: aw.materials},
              {label:'Edition', value: aw.classification === 'LimitedEdition'
                ? 'Edition of ' + aw.editionSize + (aw.apCount ? ' + ' + aw.apCount + ' AP' : '')
                : aw.classification === 'Unique' ? 'Unique work'
                : aw.classification === 'OpenEdition' ? 'Open edition' : null},
              {label:'Condition', value: aw.condition},
              ...(showPrice && aw.price ? [{label:'Price', value: '€' + Number(aw.price).toLocaleString()}] : []),
              ...(showLocation && aw.locationCurrent ? [{label:'Location', value: aw.locationCurrent}] : []),
            ].filter(f => f.value).map(field => (
              <div key={field.label}>
                <div style={{fontSize:'9px',fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:'#aaa',marginBottom:'5px'}}>
                  {field.label}
                </div>
                <div style={{fontSize:'14px',fontWeight:500,color:'#1a1a1a',lineHeight:'1.4'}}>
                  {field.value}
                </div>
              </div>
            ))}
          </div>

          {/* Enquire */}
          {artistEmail && (
            <div style={{paddingTop:'20px',borderTop:'1px solid rgb(229,231,235)'}}>
              <a
                href={'mailto:' + artistEmail + '?subject=Enquiry: ' + encodeURIComponent(aw.title || 'Untitled')}
                style={{display:'inline-block',background:'rgb(54,40,91)',color:'#fff',fontSize:'10px',letterSpacing:'0.18em',textTransform:'uppercase',fontWeight:700,padding:'14px 36px',textDecoration:'none'}}
              >
                Enquire about this work
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{marginTop:'24px',textAlign:'center'}}>
          <div style={{fontSize:'10px',letterSpacing:'0.1em',textTransform:'uppercase',color:'#ccc'}}>
            Shared via <a href="https://studionxt.vercel.app" style={{color:'#aaa',textDecoration:'none'}}>StudioNXT</a>
          </div>
        </div>
      </div>
    </div>
  );
}

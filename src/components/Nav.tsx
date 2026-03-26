'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function Nav() {
  const path = usePathname();
  if (path === '/login' || path === '/onboarding' || path.startsWith('/artist/')) return null;
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserName(user.displayName || user.email?.split('@')[0] || 'Artist');
        setUserEmail(user.email || '');
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function active(href: string) {
    return path === href || path.startsWith(href + '/');
  }

  return (
    <>
      <nav className="hidden sm:flex px-6 py-4 justify-between items-center sticky top-0 z-40 border-b" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', overflow: 'visible' }}>
        <button onClick={() => router.push('/studio')} className="flex items-center gap-2.5 transition-opacity">
          <img src="https://firebasestorage.googleapis.com/v0/b/studionxt-2657b.firebasestorage.app/o/artnxt.png?alt=media&token=991c5ea4-8d04-48ae-b82d-67d6f5900890" alt="StudioNXT" style={{ width: "40px", height: "40px" }} />
          <span className="text-[#F5F0EB] font-semibold tracking-tight text-base" style={{fontFamily: 'var(--font-playfair)'}}>StudioNXT</span>
        </button>
        <div className="flex gap-8 items-center">
          {[
            { href: '/studio', label: 'Wall' },
            { href: '/archive', label: 'Archive' },
            { href: '/folio', label: 'Folio' },
          ].map(l => (
            <Link key={l.href} href={l.href} className={'text-sm transition-colors ' + (active(l.href) ? 'text-primary font-medium' : 'text-secondary hover:text-primary')}>
              {l.label}
            </Link>
          ))}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProfile(s => !s)}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'var(--border)',
                border: '1px solid #504840',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {userName.charAt(0).toUpperCase() || 'A'}
            </button>
            {showProfile && (
              <div style={{
                position: 'fixed',
                top: '60px',
                right: '24px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                minWidth: '220px',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                zIndex: 9999,
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{userName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{userEmail}</div>
                </div>
                
                <button
                  onClick={() => { setShowProfile(false); router.push('/profile'); }}
                  style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', textAlign: 'left', display: 'block' }}
                  onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'none')}
                >
                  Profile & Settings
                </button>
                <div style={{ padding: '10px 16px 12px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Appearance</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {([
                      { value: 'light', label: 'Light', bg: '#F7F4F0', card: '#FFFFFF', bar: '#E0D8D0', dot: '#7e22ce' },
                      { value: 'system', label: 'Auto', bg: '#2A2520', card: '#F7F4F0', bar: '#3A3530', dot: '#a855f7' },
                      { value: 'dark', label: 'Dark', bg: '#0D0B09', card: '#171410', bar: '#2E2820', dot: '#a855f7' },
                    ] as const).map(t => {
                      const isActive = theme === t.value || (!theme && t.value === 'system');
                      return (
                        <button
                          key={t.value}
                          onClick={() => setTheme(t.value)}
                          style={{
                            flex: 1,
                            padding: '0',
                            borderRadius: '10px',
                            border: isActive ? '2px solid var(--purple)' : '1px solid var(--border)',
                            background: 'transparent',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            transition: 'all 0.15s',
                          }}
                        >
                          {/* Mini UI preview */}
                          <div style={{ background: t.bg, padding: '6px', borderRadius: '8px 8px 0 0' }}>
                            {/* Mini nav bar */}
                            <div style={{ background: t.bar, borderRadius: '3px', height: '6px', marginBottom: '4px', opacity: 0.8 }} />
                            {/* Mini card */}
                            <div style={{ background: t.card, borderRadius: '3px', height: '22px', display: 'flex', alignItems: 'center', padding: '0 4px', gap: '3px' }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.dot }} />
                              <div style={{ flex: 1, height: '2px', background: t.bar, borderRadius: '1px' }} />
                            </div>
                          </div>
                          <div style={{
                            padding: '4px 0 5px',
                            fontSize: '11px',
                            color: isActive ? 'var(--purple)' : 'var(--text-secondary)',
                            fontWeight: isActive ? 500 : 400,
                            background: 'var(--bg-card)',
                          }}>
                            {t.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button
                  onClick={() => signOut(auth).then(() => router.push('/login'))}
                  style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: '#f87171', fontSize: '13px', cursor: 'pointer', textAlign: 'left', display: 'block', borderTop: '1px solid var(--border)' }}
                  onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'none')}
                >
                  Sign out
                </button>

              </div>
            )}
          </div>
          <button
            onClick={() => setShowAdd(s => !s)}
            style={{
              height: '38px',
              padding: '0 16px',
              borderRadius: '100px',
              background: '#7e22ce',
              border: 'none',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 0 0 3px rgba(126,34,206,0.2), 0 4px 12px rgba(126,34,206,0.35)',
              transition: 'all 0.2s',
              letterSpacing: '0.01em',
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#6b21a8'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(126,34,206,0.3), 0 4px 16px rgba(126,34,206,0.5)'; }}
            onMouseOut={e => { e.currentTarget.style.background = '#7e22ce'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(126,34,206,0.2), 0 4px 12px rgba(126,34,206,0.35)'; }}
          >
            <span style={{ fontSize: '20px', fontWeight: 300, lineHeight: 1 }}>+</span>
            Add
          </button>
        </div>
      </nav>

      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-default" style={{ background: "var(--bg-primary)" }}>
        <div className="flex items-end">
          <Link href="/studio" className={'flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ' + (active('/studio') ? 'text-purple-400' : 'text-secondary')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            <span className="text-xs">Wall</span>
          </Link>

          <Link href="/archive" className={'flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ' + (active('/archive') ? 'text-purple-400' : 'text-secondary')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span className="text-xs">Archive</span>
          </Link>

          <div className="flex-1 flex flex-col items-center justify-center pb-2">
            <button
              onClick={() => setShowAdd(s => !s)}
              className="w-14 h-14 bg-purple-700 hover:bg-purple-600 rounded-full flex items-center justify-center text-[#F5F0EB] text-3xl font-light transition-all shadow-lg shadow-purple-900/50 -mt-5"
            >
              +
            </button>
          </div>

          <Link href="/archive?tab=voices" className={'flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ' + (active('/archive/voices') ? 'text-purple-400' : 'text-secondary')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
              <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
            </svg>
            <span className="text-xs">Voices</span>
          </Link>

          <Link href="/profile" className={'flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ' + (active('/profile') ? 'text-purple-400' : 'text-secondary')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </div>

      <div className="sm:hidden h-16" />

      {showAdd && (
        <div className="fixed inset-0 z-50" onClick={() => setShowAdd(false)}>
          <div className="absolute bottom-20 sm:bottom-auto sm:top-16 sm:right-6 left-4 right-4 sm:left-auto sm:w-64 rounded-2xl overflow-hidden shadow-2xl border border-default" style={{ background: "var(--bg-card)" }} onClick={e => e.stopPropagation()}>
            <div className="p-3 border-b border-default">
              <div className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-widest">Add to Studio</div>
            </div>
            <label className="flex items-center gap-4 px-4 py-4 hover:bg-card-hover cursor-pointer transition-all border-b border-default">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <div>
                <div className="text-sm text-primary font-medium">Take photo</div>
                <div className="text-xs text-secondary">Open camera now</div>
              </div>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setShowAdd(false); const url = URL.createObjectURL(f); sessionStorage.setItem('pendingImage', url); sessionStorage.setItem('pendingImageName', f.name); router.push('/upload'); }}} />
            </label>
            <label className="flex items-center gap-4 px-4 py-4 hover:bg-card-hover cursor-pointer transition-all border-b border-default">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <div>
                <div className="text-sm text-primary font-medium">Upload image</div>
                <div className="text-xs text-secondary">From your library</div>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setShowAdd(false); const url = URL.createObjectURL(f); sessionStorage.setItem('pendingImage', url); sessionStorage.setItem('pendingImageName', f.name); router.push('/upload'); }}} />
            </label>
            <button onClick={() => { setShowAdd(false); router.push('/archive/wip/new'); }} className="flex items-center gap-4 px-4 py-4 hover:bg-card-hover transition-all w-full border-b border-default">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="text-sm text-primary font-medium">Work in progress</div>
                <div className="text-xs text-secondary">Track as you make it</div>
              </div>
            </button>
            <button onClick={() => { setShowAdd(false); router.push('/archive/voices/new'); }} className="flex items-center gap-4 px-4 py-4 hover:bg-card-hover transition-all w-full">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                  <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="text-sm text-primary font-medium">Voice session</div>
                <div className="text-xs text-secondary">Talk to Mira</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

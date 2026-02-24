'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Nav() {
  const path = usePathname();
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);

  function active(href: string) {
    return path === href || path.startsWith(href + '/');
  }

  return (
    <>
      <nav className="hidden sm:flex bg-[#0A0A0A] border-b border-[#1a1a1a] px-6 py-4 justify-between items-center sticky top-0 z-40">
        <div className="text-white font-bold tracking-tight text-lg">StudioNXT</div>
        <div className="flex gap-8 items-center">
          {[
            { href: '/studio', label: 'Wall' },
            { href: '/archive', label: 'Archive' },
            { href: '/archive?tab=voices', label: 'Voices' },
            { href: '/profile', label: 'Profile' },
          ].map(l => (
            <Link key={l.href} href={l.href} className={'text-sm transition-colors ' + (active(l.href) ? 'text-white font-medium' : 'text-gray-500 hover:text-white')}>
              {l.label}
            </Link>
          ))}
          <button
            onClick={() => setShowAdd(s => !s)}
            className="w-9 h-9 bg-purple-700 hover:bg-purple-600 rounded-full flex items-center justify-center text-white text-xl font-light transition-all"
          >
            +
          </button>
        </div>
      </nav>

      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A] border-t border-[#1a1a1a]">
        <div className="flex items-end">
          <Link href="/studio" className={'flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ' + (active('/studio') ? 'text-purple-400' : 'text-gray-600')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            <span className="text-xs">Studio</span>
          </Link>

          <Link href="/archive" className={'flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ' + (active('/archive') ? 'text-purple-400' : 'text-gray-600')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span className="text-xs">Archive</span>
          </Link>

          <div className="flex-1 flex flex-col items-center justify-center pb-2">
            <button
              onClick={() => setShowAdd(s => !s)}
              className="w-14 h-14 bg-purple-700 hover:bg-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-light transition-all shadow-lg shadow-purple-900/50 -mt-5"
            >
              +
            </button>
          </div>

          <Link href="/archive?tab=voices" className={'flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ' + (active('/archive/voices') ? 'text-purple-400' : 'text-gray-600')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
              <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
            </svg>
            <span className="text-xs">Voices</span>
          </Link>

          <Link href="/profile" className={'flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ' + (active('/profile') ? 'text-purple-400' : 'text-gray-600')}>
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
          <div className="absolute bottom-20 sm:bottom-auto sm:top-16 sm:right-6 left-4 right-4 sm:left-auto sm:w-64 bg-[#111] border border-[#222] rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-3 border-b border-[#1a1a1a]">
              <div className="text-xs text-purple-400 uppercase tracking-widest">Add to Studio</div>
            </div>
            <label className="flex items-center gap-4 px-4 py-4 hover:bg-[#1a1a1a] cursor-pointer transition-all border-b border-[#1a1a1a]">
              <div className="w-10 h-10 bg-purple-900/50 rounded-xl flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <div>
                <div className="text-sm text-white font-medium">Take photo</div>
                <div className="text-xs text-gray-500">Open camera now</div>
              </div>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setShowAdd(false); const url = URL.createObjectURL(f); sessionStorage.setItem('pendingImage', url); sessionStorage.setItem('pendingImageName', f.name); router.push('/upload'); }}} />
            </label>
            <label className="flex items-center gap-4 px-4 py-4 hover:bg-[#1a1a1a] cursor-pointer transition-all border-b border-[#1a1a1a]">
              <div className="w-10 h-10 bg-purple-900/50 rounded-xl flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <div>
                <div className="text-sm text-white font-medium">Upload image</div>
                <div className="text-xs text-gray-500">From your library</div>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setShowAdd(false); const url = URL.createObjectURL(f); sessionStorage.setItem('pendingImage', url); sessionStorage.setItem('pendingImageName', f.name); router.push('/upload'); }}} />
            </label>
            <button onClick={() => { setShowAdd(false); router.push('/archive/wip/new'); }} className="flex items-center gap-4 px-4 py-4 hover:bg-[#1a1a1a] transition-all w-full border-b border-[#1a1a1a]">
              <div className="w-10 h-10 bg-purple-900/50 rounded-xl flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="text-sm text-white font-medium">Work in progress</div>
                <div className="text-xs text-gray-500">Track as you make it</div>
              </div>
            </button>
            <button onClick={() => { setShowAdd(false); router.push('/archive/voices/new'); }} className="flex items-center gap-4 px-4 py-4 hover:bg-[#1a1a1a] transition-all w-full">
              <div className="w-10 h-10 bg-purple-900/50 rounded-xl flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                  <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="text-sm text-white font-medium">Voice session</div>
                <div className="text-xs text-gray-500">Talk to Mira</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

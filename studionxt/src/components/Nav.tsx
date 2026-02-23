'use client';

import { useRouter, usePathname } from 'next/navigation';

const links = [
  { label: 'Studio', href: '/dashboard', icon: '⬛' },
  { label: 'Archive', href: '/archive', icon: '🗂' },
  { label: 'Upload', href: '/upload', icon: '⬆' },
  { label: 'Profile', href: '/profile', icon: '◯' },
];

export default function Nav() {
  const router = useRouter();
  const path = usePathname();

  return (
    <>
      {/* Desktop top nav */}
      <nav className="hidden sm:flex bg-[#111] border-b border-[#222] px-6 py-4 items-center justify-between">
        <div
          onClick={() => router.push('/dashboard')}
          className="cursor-pointer flex items-center"
        >
          <span className="text-white font-bold text-sm tracking-widest">STUDIONXT</span>
          <span className="ml-2 text-xs text-purple-400 bg-purple-900 px-2 py-0.5 rounded-full">MIRA</span>
        </div>
        <div className="flex gap-1">
          {links.map(link => (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              className={`px-4 py-1.5 rounded-lg text-xs transition-all ${
                path === link.href
                  ? 'bg-purple-900 text-purple-200'
                  : 'text-gray-400 hover:text-white'
              }`}
            >{link.label}</button>
          ))}
        </div>
      </nav>

      {/* Mobile top bar — just logo */}
      <nav className="flex sm:hidden bg-[#111] border-b border-[#222] px-4 py-4 items-center justify-between">
        <div
          onClick={() => router.push('/dashboard')}
          className="cursor-pointer flex items-center"
        >
          <span className="text-white font-bold text-sm tracking-widest">STUDIONXT</span>
          <span className="ml-2 text-xs text-purple-400 bg-purple-900 px-2 py-0.5 rounded-full">MIRA</span>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-[#111] border-t border-[#222] flex">
        {links.map(link => (
          <button
            key={link.href}
            onClick={() => router.push(link.href)}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all ${
              path === link.href
                ? 'text-purple-400'
                : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            <span className="text-lg leading-none">{link.icon}</span>
            <span className="text-[10px] font-medium">{link.label}</span>
          </button>
        ))}
      </div>

      {/* Spacer so content doesn't hide behind bottom bar on mobile */}
      <div className="h-16 sm:hidden" />
    </>
  );
}

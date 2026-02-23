'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const path = usePathname();

  const links = [
    { href: '/dashboard', label: 'Studio', icon: '⬛' },
    { href: '/archive', label: 'Archive', icon: '🗂' },
    { href: '/profile', label: 'Profile', icon: '◯' },
  ];

  function active(href: string) {
    return path === href || path.startsWith(href + '/');
  }

  return (
    <>
      <nav className="bg-[#0A0A0A] border-b border-[#1a1a1a] px-4 sm:px-6 py-4 flex justify-between items-center">
        <div className="text-white font-bold tracking-tight">StudioNXT</div>
        <div className="hidden sm:flex gap-6">
          {links.map(l => (
            <Link key={l.href} href={l.href} className={'text-sm transition-colors ' + (active(l.href) ? 'text-white font-medium' : 'text-gray-500 hover:text-white')}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="sm:hidden">
          <div className="text-xs text-gray-600">{links.find(l => active(l.href))?.label || ''}</div>
        </div>
      </nav>

      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A] border-t border-[#1a1a1a] flex">
        {links.map(l => (
          <Link key={l.href} href={l.href} className={'flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ' + (active(l.href) ? 'text-purple-400' : 'text-gray-600')}>
            <span className="text-lg">{l.icon}</span>
            <span className="text-xs">{l.label}</span>
          </Link>
        ))}
      </div>

      <div className="sm:hidden h-16" />
    </>
  );
}

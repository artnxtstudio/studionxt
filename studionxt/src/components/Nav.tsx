'use client';

import { useRouter, usePathname } from 'next/navigation';

export default function Nav() {
  const router = useRouter();
  const path = usePathname();

  const links = [
    { label: 'Studio', href: '/dashboard' },
    { label: 'Archive', href: '/archive' },
    { label: 'Upload', href: '/upload' },
  ];

  return (
    <nav className="bg-[#111] border-b border-[#222] px-6 py-4 flex items-center justify-between">
      <div
        onClick={() => router.push('/dashboard')}
        className="cursor-pointer"
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
  );
}

'use client';

import { usePathname } from 'next/navigation';
import AuthGuard from './AuthGuard';

const PUBLIC_ROUTES = ['/login'];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  if (isPublic) return <>{children}</>;
  return <AuthGuard>{children}</AuthGuard>;
}

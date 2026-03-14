'use client';

export const dynamic = 'force-dynamic';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function Voices() {
  const router = useRouter();
  useEffect(() => { router.replace('/archive?tab=voices'); }, []);
  return null;
}

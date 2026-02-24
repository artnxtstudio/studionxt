'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function Voices() {
  const router = useRouter();
  useEffect(() => { router.replace('/archive?tab=voices'); }, []);
  return null;
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function GET() {
  try {
    const artistsRef = collection(db, 'artists');
    await getDocs(artistsRef);
    return NextResponse.json({ 
      status: 'connected', 
      message: 'Firebase is working' 
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ 
      status: 'error', 
      message: err.message 
    }, { status: 500 });
  }
}

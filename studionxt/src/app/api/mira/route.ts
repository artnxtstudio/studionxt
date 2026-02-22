import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { artistContext } = await request.json();
    const artwork = artistContext?.artwork;
    const title = artwork?.title || 'Untitled';
    const year = artwork?.year || 'undated';
    const medium = artwork?.medium || 'unspecified medium';

    const mockResponse = `${title} (${year}), ${medium} — recorded in your archive. I will build on this record as your practice develops.`;

    return NextResponse.json({ response: mockResponse });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

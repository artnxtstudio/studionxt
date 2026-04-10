import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

function getDb() {
  const app = getApps().length === 0
    ? initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      })
    : getApps()[0];
  return getFirestore(app);
}

export async function POST(req: NextRequest) {
  try {
    const { username, visitorName, visitorEmail, message } = await req.json();

    if (!username || !visitorName || !visitorEmail || !message) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Read contactEmail from /public/{username} — world-readable, no admin SDK needed
    const db = getDb();
    const pubSnap = await getDoc(doc(db, 'public', username));

    if (!pubSnap.exists()) {
      return NextResponse.json({ error: 'Artist not found.' }, { status: 404 });
    }

    const contactEmail = pubSnap.data()?.contactEmail;
    if (!contactEmail) {
      return NextResponse.json({ error: 'This artist has not set up a contact email yet.' }, { status: 400 });
    }

    const artistName = pubSnap.data()?.name || username;

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'StudioNXT Enquiries <onboarding@resend.dev>',
      to: contactEmail,
      replyTo: visitorEmail,
      subject: `New enquiry from ${visitorName}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 0; color: #1a1612;">
          <div style="font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #8a8480; margin-bottom: 32px;">StudioNXT — New Enquiry</div>
          <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 8px;">Message for ${artistName}</h2>
          <p style="font-size: 14px; color: #8a8480; margin: 0 0 32px;">Someone has written to you through your StudioNXT archive.</p>
          <div style="border-left: 2px solid #2e2820; padding-left: 20px; margin-bottom: 32px;">
            <p style="font-size: 15px; line-height: 1.7; margin: 0;">${message.replace(/\n/g, '<br/>')}</p>
          </div>
          <div style="font-size: 13px; color: #504840;">
            <strong>From:</strong> ${visitorName}<br/>
            <strong>Reply to:</strong> <a href="mailto:${visitorEmail}" style="color: #7e22ce;">${visitorEmail}</a>
          </div>
          <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #2e2820; font-size: 11px; color: #504840; letter-spacing: 0.05em;">
            Sent via your public archive at studionxt.vercel.app/artist/${username}
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Contact API error:', err);
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 });
  }
}

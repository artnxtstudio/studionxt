'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type Mode = 'signin' | 'signup' | 'forgot';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAfterAuth(uid: string, isNew: boolean) {
    if (isNew) {
      router.push('/onboarding');
    } else {
      const profileDoc = await getDoc(doc(db, 'artists', uid));
      if (!profileDoc.exists()) {
        router.push('/onboarding');
      } else {
        router.push('/studio');
      }
    }
  }

  async function handleGoogle() {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const isNew = (user.metadata.creationTime === user.metadata.lastSignInTime);
      await handleAfterAuth(user.uid, isNew);
    } catch (e: any) {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Reset link sent. Check your email.');
        setLoading(false);
        return;
      }
      if (mode === 'signup') {
        if (!name.trim()) { setError('Please enter your name.'); setLoading(false); return; }
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
        await setDoc(doc(db, 'artists', result.user.uid), {
          name,
          email,
          createdAt: new Date().toISOString(),
        });
        router.push('/onboarding');
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await handleAfterAuth(result.user.uid, false);
      }
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') setError('No account found with this email.');
      else if (e.code === 'auth/wrong-password') setError('Incorrect password.');
      else if (e.code === 'auth/email-already-in-use') setError('An account already exists with this email.');
      else if (e.code === 'auth/weak-password') setError('Password must be at least 6 characters.');
      else setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D0B09',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Inter, sans-serif',
    }}>

      {/* Logo mark */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <img src="https://firebasestorage.googleapis.com/v0/b/studionxt-2657b.firebasestorage.app/o/artnxt.png?alt=media&token=991c5ea4-8d04-48ae-b82d-67d6f5900890" alt="StudioNXT" style={{ width: '72px', height: '72px', mixBlendMode: 'lighten', display: 'block', margin: '0 auto 12px' }} />
        <div style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '24px',
          color: '#F0EBE3',
          letterSpacing: '-0.3px',
        }}>
          StudioNXT
        </div>
      </div>

      {/* Headline */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '32px',
          color: '#F0EBE3',
          fontWeight: 600,
          lineHeight: 1.2,
          marginBottom: '12px',
          letterSpacing: '-0.5px',
        }}>
          {mode === 'signin' && 'Welcome back'}
          {mode === 'signup' && 'Build your archive'}
          {mode === 'forgot' && 'Reset your password'}
        </h1>
        <p style={{ fontSize: '15px', color: '#8A8480', maxWidth: '300px', lineHeight: 1.5 }}>
          {mode === 'signin' && 'Sign in to your archive'}
          {mode === 'signup' && 'Your life\'s work, preserved forever'}
          {mode === 'forgot' && 'We\'ll send a reset link to your email'}
        </p>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: '380px' }}>

        {/* Google Button */}
        {mode !== 'forgot' && (
          <button
            onClick={handleGoogle}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: '#F0EBE3',
              border: 'none',
              borderRadius: '100px',
              color: '#0D0B09',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '16px',
              transition: 'opacity 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseOut={e => (e.currentTarget.style.opacity = '1')}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>
        )}

        {/* Divider */}
        {mode !== 'forgot' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
          }}>
            <div style={{ flex: 1, height: '1px', background: '#2E2820' }} />
            <span style={{ fontSize: '12px', color: '#504840', letterSpacing: '0.05em' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: '#2E2820' }} />
          </div>
        )}

        {/* Name field */}
        {mode === 'signup' && (
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your full name"
            style={{
              width: '100%',
              padding: '14px 16px',
              background: '#171410',
              border: '1px solid #2E2820',
              borderRadius: '12px',
              color: '#F0EBE3',
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '10px',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#7e22ce')}
            onBlur={e => (e.currentTarget.style.borderColor = '#2E2820')}
          />
        )}

        {/* Email */}
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email address"
          style={{
            width: '100%',
            padding: '14px 16px',
            background: '#171410',
            border: '1px solid #2E2820',
            borderRadius: '12px',
            color: '#F0EBE3',
            fontSize: '15px',
            outline: 'none',
            boxSizing: 'border-box',
            marginBottom: '10px',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#7e22ce')}
          onBlur={e => (e.currentTarget.style.borderColor = '#2E2820')}
        />

        {/* Password */}
        {mode !== 'forgot' && (
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            style={{
              width: '100%',
              padding: '14px 16px',
              background: '#171410',
              border: '1px solid #2E2820',
              borderRadius: '12px',
              color: '#F0EBE3',
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '16px',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#7e22ce')}
            onBlur={e => (e.currentTarget.style.borderColor = '#2E2820')}
          />
        )}

        {mode === 'forgot' && <div style={{ marginBottom: '16px' }} />}

        {/* Error / Message */}
        {error && (
          <div style={{ fontSize: '13px', color: '#f87171', marginBottom: '12px', textAlign: 'center' }}>
            {error}
          </div>
        )}
        {message && (
          <div style={{ fontSize: '13px', color: '#4ade80', marginBottom: '12px', textAlign: 'center' }}>
            {message}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: '#7e22ce',
            border: 'none',
            borderRadius: '100px',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.2s',
            marginBottom: '24px',
          }}
          onMouseOver={e => (e.currentTarget.style.background = '#6b21a8')}
          onMouseOut={e => (e.currentTarget.style.background = '#7e22ce')}
        >
          {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
        </button>

        {/* Footer links */}
        <div style={{ textAlign: 'center', fontSize: '14px', color: '#8A8480' }}>
          {mode === 'signin' && (
            <>
              <button onClick={() => { setMode('forgot'); setError(''); setMessage(''); }}
                style={{ background: 'none', border: 'none', color: '#8A8480', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}>
                Forgot password?
              </button>
              <span style={{ margin: '0 12px', color: '#2E2820' }}>|</span>
              <button onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
                style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', fontSize: '14px' }}>
                Create account
              </button>
            </>
          )}
          {mode === 'signup' && (
            <button onClick={() => { setMode('signin'); setError(''); setMessage(''); }}
              style={{ background: 'none', border: 'none', color: '#8A8480', cursor: 'pointer', fontSize: '14px' }}>
              Already have an account? <span style={{ color: '#a855f7' }}>Sign in</span>
            </button>
          )}
          {mode === 'forgot' && (
            <button onClick={() => { setMode('signin'); setError(''); setMessage(''); }}
              style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', fontSize: '14px' }}>
              ← Back to sign in
            </button>
          )}
        </div>

        {/* Terms */}
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#504840', marginTop: '24px', lineHeight: 1.5 }}>
          By continuing, you agree to StudioNXT's Terms of Service and Privacy Policy
        </p>

      </div>
    </div>
  );
}

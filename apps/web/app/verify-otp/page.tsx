'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import request from '@/lib/api';

function VerifyComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('Verifying...');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('Error');
      setError('No verification token found in URL.');
      return;
    }

    const verifyToken = async () => {
      try {
        await request<{ message: string }>('/auth/verify-email', {
          method: 'POST',
          data: { token },
        });
        setStatus('Success!');
        setError(''); // Clear any previous errors
      } catch (err) {
        const error = err as { data?: { message?: string }; message?: string };
        setStatus('Failed');
        const errorMessage =
          error.data?.message || error.message || 'An unknown error occurred.';
        setError(errorMessage);
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Email Verification</h1>
      {status === 'Verifying...' && (
        <p>Please wait while we verify your email address.</p>
      )}
      {status === 'Success!' && (
        <div>
          <p style={{ color: 'green' }}>
            Your email has been successfully verified!
          </p>
          <button
            onClick={() => router.push('/login')}
            style={{ marginTop: '20px' }}
          >
            Proceed to Login
          </button>
        </div>
      )}
      {status === 'Failed' && (
        <div>
          <p style={{ color: 'red' }}>Verification failed: {error}</p>
          <p>Please try registering again or contact support.</p>
        </div>
      )}
    </div>
  );
}

// Wrap the component in Suspense because useSearchParams requires it.
export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyComponent />
    </Suspense>
  );
}

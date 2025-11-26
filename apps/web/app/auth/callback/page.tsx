'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';

function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // Save the token from the URL into a cookie
      Cookies.set('token', token, { expires: 1 });
      // Redirect to the main dashboard - akan di-redirect otomatis ke dashboard yang sesuai
      router.replace('/dashboard');
    } else {
      // If no token is found, redirect to login with an error
      router.replace('/login?error=Authentication-Failed');
    }
  }, [router, searchParams]);

  return (
    <div>
      <p>Please wait, authenticating...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCallback />
    </Suspense>
  );
}

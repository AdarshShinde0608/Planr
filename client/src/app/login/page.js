'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// The login form is now integrated into the welcome page at /
// This page simply redirects there.
export default function LoginRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <p style={{ color: 'var(--text-muted)' }}>Redirecting...</p>
    </div>
  );
}

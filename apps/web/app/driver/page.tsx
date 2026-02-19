'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DriverPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if driver is logged in
    const token = typeof window !== 'undefined' ? localStorage.getItem('driver_token') : null;
    
    if (token) {
      router.push('/driver/dashboard');
    } else {
      router.push('/driver/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-600">Redirecting...</div>
    </div>
  );
}

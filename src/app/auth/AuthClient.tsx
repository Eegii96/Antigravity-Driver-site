'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Auth from '../../components/Auth';
import { getCurrentUser } from '../../lib/db';

export default function AuthClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab'); // 'login' or 'register'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      router.replace('/');
    } else {
      setLoading(false);
    }
  }, [router]);

  const handleAuthSuccess = () => {
    router.replace('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a13] flex items-center justify-center text-white font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  const defaultIsLogin = tabParam === 'register' ? false : (tabParam === 'login' ? true : undefined);

  return <Auth onSuccess={handleAuthSuccess} defaultIsLogin={defaultIsLogin} />;
}

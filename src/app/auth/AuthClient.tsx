'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Auth from '../../components/Auth';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';

export default function AuthClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab'); // 'login' or 'register'
  const reasonParam = searchParams.get('reason');
  const { currentUser, setCurrentUser, loading } = useAuth();

  useEffect(() => {
    if (!loading && currentUser) {
      router.replace('/');
    }
  }, [currentUser, loading, router]);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    router.replace('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--fg)] font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[var(--muted-foreground)] text-sm">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  const defaultIsLogin = tabParam === 'register' ? false : (tabParam === 'login' ? true : undefined);

  return (
    <>
      {reasonParam === 'concurrent_session' && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[var(--card)] border border-[var(--alert)] text-[var(--alert)] px-4 py-3 rounded-md text-xs shadow-md max-w-sm w-full mx-4 text-center">
          Таны хаяг өөр төхөөрөмж дээр нэвтэрсэн тул энэ төхөөрөмжөөс гарлаа.
        </div>
      )}
      <Auth onSuccess={handleAuthSuccess} defaultIsLogin={defaultIsLogin} />
    </>
  );
}


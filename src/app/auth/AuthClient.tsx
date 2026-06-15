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


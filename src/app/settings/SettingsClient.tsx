'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SettingsView from '../../components/SettingsView';
import { useAuth } from '../../context/AuthContext';

export default function SettingsClient() {
  const router = useRouter();
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/auth');
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <SettingsView />;
}


'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SettingsView from '../../components/SettingsView';
import { getCurrentUser } from '../../lib/db';
import { User } from '../../types';

export default function SettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/auth');
    } else {
      setCurrentUser(user);
    }
    setLoading(false);
  }, [router]);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <SettingsView />;
}

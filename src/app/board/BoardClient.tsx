'use client';

import { useEffect, useState } from 'react';
import JobBoard from '../../components/JobBoard';
import { getCurrentUser } from '../../lib/db';
import { User } from '../../types';

export default function BoardClient() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <JobBoard currentUser={currentUser} />;
}

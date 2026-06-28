'use client';

import JobBoard from '../../components/JobBoard';
import { useAuth } from '../../context/AuthContext';

export default function BoardClient() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <JobBoard currentUser={currentUser} />;
}


'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User } from '@/types';
import ProfileView from '@/components/ProfileView';
import { useAuth } from '@/context/AuthContext';

function ApplicationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId') || undefined;
  const { currentUser, setCurrentUser, loading } = useAuth();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace('/auth');
    }
  }, [currentUser, loading, router]);

  const handleUserUpdatedProfile = (updated: User) => {
    setCurrentUser(updated);
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--fg)] font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[var(--muted-foreground)] text-sm">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <ProfileView
      user={currentUser}
      isOwnProfile={true}
      defaultTab="applications"
      highlightJobId={jobId}
      onUpdateCurrentUser={handleUserUpdatedProfile}
    />
  );
}

function ApplicationsContentWrapper() {
  const searchParams = useSearchParams();
  return <ApplicationsContent key={searchParams.toString() || 'default'} />;
}

export default function ApplicationsClient() {
  return (
    <div className="bg-[var(--bg)] flex-grow py-8">
      <Suspense fallback={
        <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--fg)] font-sans">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[var(--muted-foreground)] text-sm">Уншиж байна...</p>
          </div>
        </div>
      }>
        <ApplicationsContentWrapper />
      </Suspense>
    </div>
  );
}

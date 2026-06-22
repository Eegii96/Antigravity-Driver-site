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
      <div className="min-h-screen bg-[#070a13] flex items-center justify-center text-white font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Уншиж байна...</p>
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
    <div className="bg-[#070a13] flex-grow py-8">
      <Suspense fallback={
        <div className="min-h-screen bg-[#070a13] flex items-center justify-center text-white font-sans">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm">Уншиж байна...</p>
          </div>
        </div>
      }>
        <ApplicationsContentWrapper />
      </Suspense>
    </div>
  );
}

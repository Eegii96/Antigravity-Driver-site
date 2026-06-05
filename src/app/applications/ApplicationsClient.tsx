'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser, setCurrentUser } from '@/lib/db';
import { User } from '@/types';
import ProfileView from '@/components/ProfileView';

function ApplicationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId') || undefined;
  const [currentUser, setLocalCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/auth');
    } else {
      setLocalCurrentUser(user);
      setLoading(false);
    }
  }, [router]);

  const handleUserUpdatedProfile = (updated: User) => {
    setLocalCurrentUser(updated);
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

export default function ApplicationsClient() {
  return (
    <div className="bg-[#070a13] min-h-screen py-8">
      <Suspense fallback={
        <div className="min-h-screen bg-[#070a13] flex items-center justify-center text-white font-sans">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm">Уншиж байна...</p>
          </div>
        </div>
      }>
        <ApplicationsContent />
      </Suspense>
    </div>
  );
}

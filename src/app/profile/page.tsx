'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSingleUser } from '@/lib/db';
import { User } from '@/types';
import ProfileView from '@/components/ProfileView';
import { useAuth } from '@/context/AuthContext';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryId = searchParams.get('id');
  
  // Safely read pathname on the client side
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  const { currentUser, setCurrentUser, loading: authLoading } = useAuth();
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      router.replace('/auth');
      return;
    }

    const loadUser = async () => {
      try {
        // Parse ID from search parameters, pathname (/profile/[id]), or fallback to logged-in user
        let rawId = queryId;
        
        if (!rawId && pathname) {
          const parts = pathname.split('/');
          if (parts.length >= 3 && parts[1] === 'profile') {
            rawId = parts[2];
          }
        }
        
        if (!rawId) {
          rawId = currentUser.id;
        }

        // Clean up accidental file extensions
        const id = rawId.replace(/\.(txt|rsc|json|html)$/i, '').trim();
        
        // Keep URL clean and consistent
        if (queryId && rawId !== id) {
          router.replace(`/profile?id=${id}`);
        } else if (!queryId && id !== currentUser.id) {
          router.replace(`/profile?id=${id}`);
        }

        // Determine if this is the logged-in user's own profile
        const isOwnProfile = id === currentUser.id;

        if (isOwnProfile) {
          // Instant UX: load from local storage session first
          setViewedUser(currentUser);
          setProfileLoading(false);

          // Asynchronously sync with Firestore in the background
          try {
            const fetched = await getSingleUser(id);
            if (fetched) {
              setViewedUser(fetched);
              setCurrentUser(fetched);
            }
          } catch (syncErr) {
            console.warn('Could not sync fresh profile data from Firestore:', syncErr);
          }
        } else {
          // Load other user's profile
          const fetched = await getSingleUser(id);
          if (fetched) {
            setViewedUser(fetched);
          } else {
            setError('Хэрэглэгч олдсонгүй.');
          }
          setProfileLoading(false);
        }
      } catch (err) {
        console.error(err);
        setError('Мэдээлэл авахад алдаа гарлаа.');
        setProfileLoading(false);
      }
    };

    loadUser();
    // Depend on the stable user *id*, not the currentUser object: the own-profile
    // branch calls setCurrentUser(fetched) with a fresh object each time, so
    // depending on the object (or the unstable setter) re-triggers this effect
    // forever ("Maximum update depth exceeded"). The id is stable across syncs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryId, pathname, currentUser?.id, authLoading]);

  const handleUserUpdatedProfile = (updated: User) => {
    setCurrentUser(updated);
    setViewedUser(updated);
  };

  const loading = authLoading || profileLoading;

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

  if (error || !viewedUser || !currentUser) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center text-[var(--fg)] font-sans p-4">
        <p className="text-rose-600 font-bold mb-4">{error || 'Алдаа гарлаа'}</p>
        <button
          onClick={() => router.push('/')}
          className="bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--bg2)] text-[var(--fg)] px-6 py-2.5 rounded-md transition-all font-semibold cursor-pointer"
        >
          Нүүр хуудас руу буцах
        </button>
      </div>
    );
  }

  const isOwnProfile = currentUser.id === viewedUser.id;

  return (
    <div className="bg-[var(--bg)] flex-grow py-8 min-h-screen">
      <ProfileView
        user={viewedUser}
        isOwnProfile={isOwnProfile}
        defaultTab="profile"
        onUpdateCurrentUser={isOwnProfile ? handleUserUpdatedProfile : undefined}
      />
    </div>
  );
}

function ProfileContentWrapper() {
  const searchParams = useSearchParams();
  const key = searchParams.toString() || 'own';
  return <ProfileContent key={key} />;
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--fg)] font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[var(--muted-foreground)] text-sm">Уншиж байна...</p>
        </div>
      </div>
    }>
      <ProfileContentWrapper />
    </Suspense>
  );
}


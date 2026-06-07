'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser, getSingleUser, setCurrentUser } from '@/lib/db';
import { auth } from '@/lib/firebase';
import { User } from '@/types';
import ProfileView from '@/components/ProfileView';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryId = searchParams.get('id');
  
  // Safely read pathname on the client side
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  const [currentUser, setLocalCurrentUser] = useState<User | null>(null);
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/auth');
      return;
    }
    setLocalCurrentUser(user);

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
          rawId = user.id;
        }

        // Clean up accidental file extensions
        let id = rawId.replace(/\.(txt|rsc|json|html)$/i, '').trim();
        
        // Keep URL clean and consistent
        if (queryId && rawId !== id) {
          router.replace(`/profile?id=${id}`);
        } else if (!queryId && id !== user.id) {
          router.replace(`/profile?id=${id}`);
        }

        // Determine if this is the logged-in user's own profile
        const isOwnProfile = id === user.id || (auth.currentUser && auth.currentUser.uid === id);

        if (isOwnProfile) {
          // Instant UX: load from local storage session first
          setViewedUser(user);
          setLoading(false);

          // Asynchronously sync with Firestore in the background
          try {
            const fetched = await getSingleUser(id);
            if (fetched) {
              setViewedUser(fetched);
              setLocalCurrentUser(fetched);
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
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setError('Мэдээлэл авахад алдаа гарлаа.');
        setLoading(false);
      }
    };

    loadUser();
  }, [queryId, pathname, router]);

  const handleUserUpdatedProfile = (updated: User) => {
    setLocalCurrentUser(updated);
    setCurrentUser(updated);
    setViewedUser(updated);
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

  if (error || !viewedUser || !currentUser) {
    return (
      <div className="min-h-screen bg-[#070a13] flex flex-col items-center justify-center text-white font-sans p-4">
        <p className="text-red-400 font-bold mb-4">{error || 'Алдаа гарлаа'}</p>
        <button
          onClick={() => router.push('/board')}
          className="bg-slate-900 border border-slate-700 hover:bg-slate-800 text-emerald-400 px-6 py-2.5 rounded-xl transition-all font-semibold cursor-pointer"
        >
          Нүүр хуудас руу буцах
        </button>
      </div>
    );
  }

  const isOwnProfile = currentUser.id === viewedUser.id;

  return (
    <div className="bg-[#070a13] flex-grow py-8 min-h-screen">
      <ProfileView
        user={viewedUser}
        isOwnProfile={isOwnProfile}
        defaultTab="profile"
        onUpdateCurrentUser={isOwnProfile ? handleUserUpdatedProfile : undefined}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070a13] flex items-center justify-center text-white font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Уншиж байна...</p>
        </div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}

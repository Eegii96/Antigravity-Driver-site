'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCurrentUser, getSingleUser, setCurrentUser } from '@/lib/db';
import { User } from '@/types';
import ProfileView from '@/components/ProfileView';

export default function ProfileDetailClient() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

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
        if (id === user.id) {
          setViewedUser(user);
          setLoading(false);
        } else {
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

    if (id) {
      loadUser();
    }
  }, [id, router]);

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
    <div className="bg-[#070a13] min-h-screen py-8">
      <ProfileView
        user={viewedUser}
        isOwnProfile={isOwnProfile}
        defaultTab="profile"
        onUpdateCurrentUser={isOwnProfile ? handleUserUpdatedProfile : undefined}
      />
    </div>
  );
}

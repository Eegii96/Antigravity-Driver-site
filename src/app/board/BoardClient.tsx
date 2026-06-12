'use client';

import { useEffect, useState } from 'react';
import JobBoard from '../../components/JobBoard';
import { getCurrentUser, setCurrentUser as setDbCurrentUser } from '../../lib/db';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { User } from '../../types';

export default function BoardClient() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial synchronous check from localStorage
    const user = getCurrentUser();
    setCurrentUser(user);
    setLoading(false);

    // 2. Listen for Firebase Auth state changes to sync session
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const docSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (docSnap.exists()) {
            const userData = docSnap.data() as User;
            userData.id = firebaseUser.uid;
            
            const sessionUser = { ...userData };
            if ('password' in sessionUser) {
              delete sessionUser.password;
            }
            
            setDbCurrentUser(sessionUser);
            setCurrentUser(sessionUser);
          }
        } catch (err) {
          console.error('Error syncing auth state:', err);
        }
      } else {
        setDbCurrentUser(null);
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
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

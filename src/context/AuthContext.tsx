'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { setCurrentUser as setLocalUser, getCurrentUser as getLocalUser } from '../lib/db';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  setCurrentUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync state update to state and localStorage
  const handleSetCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    setLocalUser(user);
  };

  useEffect(() => {
    // 1. Initially load from localStorage for instant UI rendering
    const initialUser = getLocalUser();
    if (initialUser) {
      setCurrentUserState(initialUser);
    }

    // 2. Register Firebase Auth State listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Fetch fresh profile data from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            const userData = docSnap.data() as User;
            userData.id = firebaseUser.uid;
            
            // Remove password field for security
            const sessionUser = { ...userData };
            if ('password' in sessionUser) {
              delete sessionUser.password;
            }
            
            handleSetCurrentUser(sessionUser);
          } else {
            // If the document doesn't exist yet (e.g. registration in progress),
            // check if we already have a matching user in localStorage
            const localUser = getLocalUser();
            if (localUser && localUser.id === firebaseUser.uid) {
              setCurrentUserState(localUser);
            } else {
              handleSetCurrentUser(null);
            }
          }
        } else {
          // Firebase says we are signed out
          handleSetCurrentUser(null);
        }
      } catch (err) {
        console.error('Error in onAuthStateChanged observer:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error signing out of Firebase:', err);
    } finally {
      handleSetCurrentUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, logout, setCurrentUser: handleSetCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

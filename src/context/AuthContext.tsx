'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '../types';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { setCurrentUser as setLocalUser, getCurrentUser as getLocalUser } from '../lib/db';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  setCurrentUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(() => getLocalUser());
  const [loading, setLoading] = useState(true);

  // Sync state update to state and localStorage. Stable reference (useCallback)
  // so consumers can safely list it in effect dependency arrays without causing
  // re-run loops.
  const handleSetCurrentUser = useCallback((user: User | null) => {
    setCurrentUserState(user);
    setLocalUser(user);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    // 1. Initially load from localStorage for instant UI rendering
    const initialUser = getLocalUser();
    if (initialUser) {
      setCurrentUserState(initialUser);
    }

    let unsubscribeSnapshot: (() => void) | null = null;

    // 2. Register Firebase Auth State listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          
          if (unsubscribeSnapshot) {
            unsubscribeSnapshot();
            unsubscribeSnapshot = null;
          }

          // Listen in real-time to the user document in Firestore
          unsubscribeSnapshot = onSnapshot(userDocRef, async (docSnap) => {
            try {
              if (docSnap.exists()) {
                const userData = docSnap.data() as User;
                userData.id = firebaseUser.uid;
                
                // Remove password field for security
                const sessionUser = { ...userData };
                if ('password' in sessionUser) {
                  delete sessionUser.password;
                }
                
                const localSessionId = localStorage.getItem('activeSessionId');
                const sessionIdTime = Number(localStorage.getItem('activeSessionIdTime') || 0);
                const isSessionFresh = (Date.now() - sessionIdTime) < 8000; // 8 seconds window
                
                if (!userData.activeSessionId) {
                  // If no active session ID exists on the server, initialize one
                  const newSessionId = localSessionId || (Math.random().toString(36).substring(2) + Date.now().toString(36));
                  localStorage.setItem('activeSessionId', newSessionId);
                  localStorage.setItem('activeSessionIdTime', Date.now().toString());
                  await updateDoc(userDocRef, { activeSessionId: newSessionId });
                  handleSetCurrentUser(sessionUser);
                } else if (localSessionId && userData.activeSessionId !== localSessionId) {
                  if (isSessionFresh) {
                    // This device just logged in/registered. It has the right to claim the active session.

                    await updateDoc(userDocRef, { activeSessionId: localSessionId });
                    handleSetCurrentUser(sessionUser);
                  } else {
                    // Session ID mismatch on an established session! Another device has logged in.
                    console.warn('Session ID mismatch. Logging out due to concurrent login.');
                    await signOut(auth);
                    localStorage.removeItem('activeSessionId');
                    localStorage.removeItem('activeSessionIdTime');
                    localStorage.removeItem('sessionIsNew');
                    handleSetCurrentUser(null);
                    window.location.href = '/auth?reason=concurrent_session';
                  }
                } else {
                  // Session matches or localSessionId doesn't exist yet
                  if (!localSessionId) {
                    const localUser = getLocalUser();
                    if (localUser && localUser.id === firebaseUser.uid) {
                      localStorage.setItem('activeSessionId', userData.activeSessionId);
                      localStorage.setItem('activeSessionIdTime', Date.now().toString());
                      handleSetCurrentUser(sessionUser);
                    } else {
                      await signOut(auth);
                      localStorage.removeItem('activeSessionId');
                      localStorage.removeItem('activeSessionIdTime');
                      handleSetCurrentUser(null);
                    }
                  } else {
                    handleSetCurrentUser(sessionUser);
                  }
                }
              } else {
                // Document doesn't exist yet (e.g. registration in progress)
                const localUser = getLocalUser();
                if (localUser && localUser.id === firebaseUser.uid) {
                  setCurrentUserState(localUser);
                } else {
                  handleSetCurrentUser(null);
                }
              }
            } catch (snapErr) {
              console.error('Error handling user doc snapshot:', snapErr);
            }
          }, (error) => {
            console.error('Error in user doc snapshot listener:', error);
          });
        } else {
          // Firebase says we are signed out
          if (unsubscribeSnapshot) {
            unsubscribeSnapshot();
            unsubscribeSnapshot = null;
          }
          localStorage.removeItem('activeSessionId');
          localStorage.removeItem('activeSessionIdTime');
          localStorage.removeItem('sessionIsNew');
          handleSetCurrentUser(null);
        }
      } catch (err) {
        console.error('Error in onAuthStateChanged observer:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

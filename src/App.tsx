/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { User } from './types';
import { getCurrentUser, setCurrentUser, initializeDB } from './lib/db';
import Auth from './components/Auth';
import JobBoard from './components/JobBoard';
import ProfileView from './components/ProfileView';
import SettingsView from './components/SettingsView';
import Footer from './components/Footer';

type ViewState = 'auth' | 'board' | 'profile' | 'settings' | 'inspector';

export default function App() {
  const [view, setView] = useState<ViewState>('auth');
  const [currentUser, setLocalCurrentUser] = useState<User | null>(null);
  const [inspectUser, setInspectUser] = useState<User | null>(null);

  useEffect(() => {
    const init = async () => {
      // Seed and prepare database state in Firestore in background to prevent UI block
      initializeDB().catch(err => console.error('Database seeding error:', err));
      
      const user = getCurrentUser();
      if (user) {
        setLocalCurrentUser(user);
        setView('board');
      } else {
        setView('auth');
      }
    };
    init();
  }, []);

  const handleAuthSuccess = (user: User) => {
    setLocalCurrentUser(user);
    setView('board');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLocalCurrentUser(null);
    setView('auth');
  };

  const handleUserUpdatedProfile = (updated: User) => {
    setLocalCurrentUser(updated);
    setCurrentUser(updated);
  };

  const navigateToInspectProfile = (targetUser: User) => {
    setInspectUser(targetUser);
    setView('inspector');
  };

  return (
    <div className="bg-slate-950 min-h-screen text-white font-sans flex flex-col justify-between">
      <div className="flex-grow">
        {view === 'auth' && (
          <Auth onSuccess={handleAuthSuccess} />
        )}

        {view === 'board' && currentUser && (
          <JobBoard
            currentUser={currentUser}
            onLogout={handleLogout}
            onNavigateToProfile={() => setView('profile')}
            onNavigateToSettings={() => setView('settings')}
            onViewUserProfile={navigateToInspectProfile}
          />
        )}

        {view === 'profile' && currentUser && (
          <ProfileView
            user={currentUser}
            isOwnProfile={true}
            onBack={() => setView('board')}
            onUpdateCurrentUser={handleUserUpdatedProfile}
          />
        )}

        {view === 'settings' && currentUser && (
          <SettingsView
            onBack={() => setView('board')}
          />
        )}

        {view === 'inspector' && inspectUser && (
          <ProfileView
            user={inspectUser}
            isOwnProfile={false}
            onBack={() => {
              setView('board');
              setInspectUser(null);
            }}
          />
        )}
      </div>

      <Footer />
    </div>
  );
}


'use client';

import JobBoard from '../../components/JobBoard';
import { useAuth } from '../../context/AuthContext';

export default function BoardClient() {
  const { currentUser } = useAuth();
  return <JobBoard currentUser={currentUser} />;
}


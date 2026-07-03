'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import JobBoard from '../../components/JobBoard';
import { useAuth } from '../../context/AuthContext';

function BoardContent() {
  const { currentUser } = useAuth();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId') || undefined;
  return <JobBoard currentUser={currentUser} initialJobId={jobId} />;
}

export default function BoardClient() {
  return (
    <Suspense fallback={null}>
      <BoardContent />
    </Suspense>
  );
}

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import JobBoard from '../../components/JobBoard';
import { useAuth } from '../../context/AuthContext';
import { Job } from '../../types';

// Isolated in its own Suspense boundary so ONLY this tiny component reads
// useSearchParams() (required in static export — Next can't know the query
// string at build time). Previously the ENTIRE board (hero, stats, job
// cards) sat inside this same boundary, so Next bailed the whole subtree
// out of the static HTML ("BAILOUT_TO_CLIENT_SIDE_RENDERING") and rendered
// it only after hydration — the page jumped from an empty <main> to the
// full board in one shot, measuring as a Cumulative Layout Shift score of 1
// in production (PageSpeed Insights, 2026-07-05). JobBoard itself no longer
// depends on search params synchronously (initialJobId is already consumed
// in a useEffect there), so moving it outside this boundary lets it
// prerender normally.
function JobIdFromSearchParams({ onJobId }: { onJobId: (id: string | undefined) => void }) {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId') || undefined;
  useEffect(() => { onJobId(jobId); }, [jobId, onJobId]);
  return null;
}

export default function BoardClient({ initialJobs }: { initialJobs: Job[] }) {
  const { currentUser } = useAuth();
  const [jobId, setJobId] = useState<string | undefined>(undefined);
  return (
    <>
      <Suspense fallback={null}>
        <JobIdFromSearchParams onJobId={setJobId} />
      </Suspense>
      <JobBoard currentUser={currentUser} initialJobId={jobId} initialJobs={initialJobs} />
    </>
  );
}

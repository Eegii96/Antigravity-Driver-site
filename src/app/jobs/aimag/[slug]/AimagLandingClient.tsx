'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, MapPin, Briefcase } from 'lucide-react';
import { getJobsByLocation } from '../../../../lib/db';
import { getMockEmployerName } from '../../../../lib/mock-employer';
import { formatMongolianSalary, formatRelativeDate, getFirstName } from '../../../../lib/job-format';
import { useAuth } from '../../../../context/AuthContext';
import type { Job } from '../../../../types';

interface AimagLandingClientProps {
  location: string;
}

// Discovery-only preview list — actual apply/hire/contact interaction always
// happens on the existing /jobs/{id} detail page, so this deliberately does
// NOT reuse JobCard.tsx (whose callback props like onHire/onApply/onEdit are
// all unnecessary here). Guest name-blurring reuses the same
// src/lib/mock-employer.ts helper JobCard/JobDetailClient use, so it can
// never drift out of sync with the rest of the site (AGENTS.md §2).
export default function AimagLandingClient({ location }: AimagLandingClientProps) {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    getJobsByLocation(location).then(result => {
      if (!cancelled) {
        setJobs(result.filter(j => j.status === 'open'));
        setIsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [location]);

  return (
    <div className="max-w-4xl mx-auto w-full px-6 py-8 space-y-3">
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-[var(--muted-foreground)]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-xs">Уншиж байна...</span>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--border)] p-10 text-center rounded-xl space-y-3">
          <p className="text-sm font-semibold text-[var(--fg)]">Одоогоор энэ байршилд идэвхтэй зар алга байна 🚜</p>
          <p className="text-xs text-[var(--muted-foreground)] max-w-md mx-auto leading-relaxed">
            Шинэ зар нийтлэгдэх бүрт энд харагдана. Одоохондоо бусад бүх байршлын зарыг үзэх боломжтой.
          </p>
          <Link
            href="/"
            className="inline-block bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] font-bold text-sm px-5 py-2.5 rounded-full transition-all"
          >
            Бүх зарыг үзэх
          </Link>
        </div>
      ) : (
        jobs.map(job => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="block bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)] rounded-xl p-4 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[var(--fg)] truncate">{job.title}</h2>
                <div className="mt-1 flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3 shrink-0" />
                    {job.machineryType}
                  </span>
                  <span>{formatRelativeDate(job.createdAt)}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-xs font-bold text-[var(--verify)]">
                  {job.salary === 0 ? 'Тохиролцоно' : `${formatMongolianSalary(job.salary)}₮`}
                </div>
                <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  {currentUser ? getFirstName(job.employerName) : getMockEmployerName(job.id)}
                </div>
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}

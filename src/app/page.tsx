import { Metadata } from 'next';
import BoardClient from './board/BoardClient';
import { getJobs } from '../lib/db';

export const metadata: Metadata = {
  title: 'Барилга, Механизмын Ажлын Нэгдсэн Систем',
  description: 'Барилга, замын газар шорооны ажил, хүнд машин механизм түрээс ба жолооч нарын үнэлгээ, түүх бүхий нэгдсэн зарын систем.',
  openGraph: {
    title: 'Барилга, Механизмын Ажлын Нэгдсэн Систем | Жолооч Монголиа',
    description: 'Хүнд машин, механизм & Газар шорооны ажлын зарыг нэг дороос хайж, мэргэшсэн операторуудтай холбогдоорой.',
    url: 'https://jolooch.net',
    type: 'website',
  },
};

export default async function HomePage() {
  // Seeding the initial render with the build-time job snapshot (same
  // pattern as the /jobs/[id] SSG pages) means the board isn't empty on
  // first paint — without this, JobBoard started from an empty array and
  // only populated once the client-side Firestore listener resolved,
  // which caused the whole page (footer included) to jump in height and
  // measured as a Cumulative Layout Shift score of 1 in production. The
  // live subscribeToJobs() listener still takes over immediately after for
  // freshness; this snapshot only fixes the first paint.
  const initialJobs = await getJobs();
  return <BoardClient initialJobs={initialJobs} />;
}

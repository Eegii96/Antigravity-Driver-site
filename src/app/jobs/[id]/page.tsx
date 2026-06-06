import { Metadata } from 'next';
import { getSingleJob, getJobs } from '../../../lib/db';
import JobDetailClient from './JobDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

// Format Mongolian salary to human-readable form (e.g. 3500000 -> 3.5 сая, 120000 -> 120 мянга)
function formatMongolianSalary(salary: number): string {
  if (salary === 0) {
    return 'тохиролцоно';
  }
  if (salary >= 1000000) {
    const millions = salary / 1000000;
    return `${Number(millions.toFixed(1))} сая`;
  } else if (salary >= 1000) {
    const thousands = salary / 1000;
    return `${Number(thousands.toFixed(1))} мянга`;
  }
  return salary.toString();
}

// Append correct Mongolian location suffixes (e.g. Дундговь -> Дундговьд, Сонгинохайрхан дүүрэг -> Сонгинохайрхан дүүрэгт)
function formatMongolianLocation(location: string): string {
  const loc = location.trim();
  if (loc.endsWith('аймаг')) {
    return `${loc}т`;
  } else if (loc.endsWith('дүүрэг')) {
    return `${loc}т`;
  } else if (loc.endsWith('сум')) {
    return `${loc}анд`;
  } else if (loc.endsWith('хот')) {
    return `${loc}од`;
  } else {
    return `${loc}д`;
  }
}

// Generate static params for Next.js static export
export async function generateStaticParams() {
  try {
    const jobs = await getJobs();
    const ids = jobs.map((job) => ({ id: job.id }));
    if (ids.length === 0) {
      return [
        { id: 'job_1' },
        { id: 'job_2' },
        { id: 'job_3' }
      ];
    }
    return ids;
  } catch (err) {
    console.error('Error in generateStaticParams for jobs:', err);
    return [
      { id: 'job_1' },
      { id: 'job_2' },
      { id: 'job_3' }
    ];
  }
}

// Generate dynamic SEO metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const job = await getSingleJob(id);
  
  if (!job) {
    return {
      title: 'Ажлын зар олдсонгүй | Барилга, Механизмын Ажлын Нэгдсэн Систем',
      description: 'Манай системээс ажлын зарын дэлгэрэнгүйг харна уу.'
    };
  }

  const formattedSalary = formatMongolianSalary(job.salary);
  const locationFormatted = formatMongolianLocation(job.location);
  
  // Format title like: "Дундговьд ажиллах Ковш оператор яаралтай авна - Цалин 3.5 сая"
  const title = job.salary === 0
    ? `${job.title} - Цалин тохиролцоно | Жолооч Монголиа`
    : `${job.title} - Цалин ${formattedSalary} | Жолооч Монголиа`;
  const description = `${job.employerName} захиалагчаас зарласан ажил: ${job.description.slice(0, 150)}... Шалгуур: ${job.requirements.join(', ')}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website'
    }
  };
}

export default async function JobPage({ params }: Props) {
  const { id } = await params;
  return <JobDetailClient jobId={id} />;
}


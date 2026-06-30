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
  const job = await getSingleJob(id);

  // Map Mongolian salary unit to schema.org unitText
  const salaryUnitMap: Record<string, string> = {
    'Цагаар': 'HOUR',
    'Өдрөөр': 'DAY',
    'Сараар': 'MONTH',
    'Төслөөр': 'YEAR', // closest schema.org value for per-project
  };

  // validThrough: 30 days after posting (prevents stale-listing demotion in Google for Jobs)
  const validThrough = job
    ? new Date(new Date(job.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  // Map salaryUnit to schema.org employmentType
  const employmentTypeMap: Record<string, string> = {
    'Цагаар': 'PART_TIME',
    'Өдрөөр': 'TEMPORARY',
    'Сараар': 'FULL_TIME',
    'Төслөөр': 'CONTRACTOR',
  };

  const jsonLd = job
    ? {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: job.title,
        description: job.description,
        datePosted: job.createdAt,
        validThrough,
        employmentType: employmentTypeMap[job.salaryUnit] ?? 'CONTRACTOR',
        jobLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: job.location,
            addressCountry: 'MN',
          },
        },
        ...(job.salary > 0 && {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: 'MNT',
            value: {
              '@type': 'QuantitativeValue',
              value: job.salary,
              unitText: salaryUnitMap[job.salaryUnit] ?? 'MONTH',
            },
          },
        }),
        hiringOrganization: {
          '@type': 'Organization',
          name: job.employerName || 'Jolooch.net',
          sameAs: 'https://jolooch.net',
        },
        identifier: {
          '@type': 'PropertyValue',
          name: 'Jolooch.net',
          value: job.id,
        },
        directApply: true,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <JobDetailClient jobId={id} />
    </>
  );
}


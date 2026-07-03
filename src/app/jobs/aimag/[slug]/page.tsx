import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AIMAG_SLUGS, getLocationBySlug } from '../../../../lib/aimag-slugs';
import { formatMongolianLocation } from '../../../../lib/job-format';
import AimagLandingClient from './AimagLandingClient';

interface Props {
  params: Promise<{ slug: string }>;
}

// One static page per aimag/city (audit P7) — a real, indexable landing page
// for searches like "Өмнөговь экскаватор ажил" instead of only the homepage.
export async function generateStaticParams() {
  return AIMAG_SLUGS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const location = getLocationBySlug(slug);
  if (!location) return { title: 'Байршил олдсонгүй' };

  const locationDative = formatMongolianLocation(location);
  const title = `${locationDative} ажиллах хүнд машин механизмын ажлын байр, зар`;
  const description = `${locationDative} шинээр нийтлэгдсэн хүнд машин механизм, газар шорооны ажлын зарууд. Ажлын түүх, бодит үнэлгээгээр баталгаажсан жолооч, оператор, ажил олгогчид эндээс холбогдоорой.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/jobs/aimag/${slug}`,
    },
    openGraph: {
      title: `${title} | Жолооч Монголиа`,
      description,
      type: 'website',
    },
  };
}

export default async function AimagLandingPage({ params }: Props) {
  const { slug } = await params;
  const location = getLocationBySlug(slug);
  if (!location) notFound();

  const locationDative = formatMongolianLocation(location);

  return (
    <div className="bg-[var(--bg)] flex-grow">
      <section className="relative overflow-hidden bg-[var(--bg2)] border-b border-[var(--border)]">
        <div className="hazard-stripe h-1.5 w-full" />
        <div className="max-w-4xl mx-auto w-full px-6 py-9 md:py-12">
          <span className="inline-block text-[10px] md:text-xs font-bold uppercase tracking-wider text-[var(--accent-soft-foreground)] bg-[var(--accent-soft)] border border-[var(--accent)] px-3 py-1 rounded-sm">
            {location}
          </span>
          <h1 className="mt-3 text-2xl md:text-4xl font-display font-black uppercase tracking-tight text-[var(--fg)] leading-tight">
            {locationDative} ажиллах ажлын байрууд
          </h1>
          <p className="mt-2.5 text-xs md:text-sm text-[var(--muted-foreground)] max-w-2xl leading-relaxed">
            {locationDative} хүнд машин механизм, газар шорооны ажлын зарууд эндээс. Жолооч,
            оператор, ажил олгогч бүрийн ажлын түүх, бодит үнэлгээ ил тод — хэн хариуцлагатай,
            хэн шударга болохыг өмнөх түүх нь харуулна.
          </p>
        </div>
      </section>
      <AimagLandingClient location={location} />
    </div>
  );
}

import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';

const SITE_URL = 'https://jolooch.net';

interface JobData {
  title?: string;
  description?: string;
  employerName?: string;
  status?: 'open' | 'in_progress' | 'completed';
  salary?: number;
  salaryUnit?: string;
  location?: string;
  createdAt?: string;
  requirements?: string[];
  imageUrl?: string;
  imageUrls?: string[];
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Mirrors formatMongolianSalary/formatMongolianLocation in
// src/app/jobs/[id]/page.tsx. Duplicated rather than shared: Cloud Functions
// build separately from the Next app, and these are ~15 lines of pure logic —
// not worth a shared package for two call sites.
function formatMongolianSalary(salary: number): string {
  if (salary === 0) return 'тохиролцоно';
  if (salary >= 1000000) return `${Number((salary / 1000000).toFixed(1))} сая`;
  if (salary >= 1000) return `${Number((salary / 1000).toFixed(1))} мянга`;
  return salary.toString();
}

function formatMongolianLocation(location: string): string {
  const loc = location.trim();
  if (loc.endsWith('аймаг')) return `${loc}т`;
  if (loc.endsWith('дүүрэг')) return `${loc}т`;
  if (loc.endsWith('сум')) return `${loc}анд`;
  if (loc.endsWith('хот')) return `${loc}од`;
  return `${loc}д`;
}

const SALARY_UNIT_MAP: Record<string, string> = {
  'Цагаар': 'HOUR',
  'Өдрөөр': 'DAY',
  'Сараар': 'MONTH',
  'Төслөөр': 'YEAR',
};

function notFoundHtml(): string {
  return `<!DOCTYPE html>
<html lang="mn"><head><meta charset="utf-8">
<title>Ажлын зар олдсонгүй | Жолооч Монголиа</title>
<meta name="robots" content="noindex">
<script>location.replace('/');</script>
</head><body><a href="/">Нүүр хуудас руу очих</a></body></html>`;
}

// Renders the same title/description/OG/JSON-LD metadata src/app/jobs/[id]/page.tsx
// bakes into a static file at build time — but live, for a job that was
// posted after the last deploy and therefore has no static HTML file yet.
// Firebase Hosting only reaches this function when no static /jobs/<id> file
// exists (exact static matches are always served before rewrites), so it
// only ever runs for the "new since last build" gap (audit P1).
//
// Real browsers are bounced instantly into the SPA via a script redirect;
// crawlers (Facebook/Google/Twitter) read the <head> from this raw HTML
// response without executing the redirect, so they see correct per-job
// metadata instead of the homepage's.
export const jobMeta = onRequest({ region: 'us-central1' }, async (req, res) => {
  const match = req.path.match(/\/jobs\/([^/?]+)/);
  const jobId = match?.[1];

  if (!jobId) {
    res.status(404).set('Cache-Control', 'public, max-age=60').send(notFoundHtml());
    return;
  }

  const db = admin.firestore();
  const snap = await db.collection('jobs').doc(jobId).get();

  if (!snap.exists) {
    res.status(404).set('Cache-Control', 'public, max-age=60').send(notFoundHtml());
    return;
  }

  const job = snap.data() as JobData;
  const redirectUrl = `/?jobId=${encodeURIComponent(jobId)}`;
  const canonicalUrl = `${SITE_URL}/jobs/${encodeURIComponent(jobId)}`;

  const salary = job.salary ?? 0;
  const title = escapeHtml(
    salary === 0
      ? `${job.title || 'Ажлын зар'} - Цалин тохиролцоно`
      : `${job.title || 'Ажлын зар'} - Цалин ${formatMongolianSalary(salary)}`
  );
  const description = escapeHtml(
    `${formatMongolianLocation(job.location || 'Монгол')} ${job.employerName || ''} захиалагчаас зарласан ажил: ${(job.description || '').slice(0, 150)}...`
  );
  const image = job.imageUrls?.[0] || job.imageUrl;
  const isOpen = job.status === 'open';

  const jsonLd = isOpen
    ? JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: job.title || '',
        description: job.description || '',
        datePosted: job.createdAt,
        employmentType: 'CONTRACTOR',
        jobLocation: {
          '@type': 'Place',
          address: { '@type': 'PostalAddress', addressLocality: job.location || '', addressCountry: 'MN' },
        },
        ...(salary > 0 && {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: 'MNT',
            value: { '@type': 'QuantitativeValue', value: salary, unitText: SALARY_UNIT_MAP[job.salaryUnit || ''] ?? 'MONTH' },
          },
        }),
        hiringOrganization: { '@type': 'Organization', name: job.employerName || 'Jolooch.net', sameAs: SITE_URL },
        identifier: { '@type': 'PropertyValue', name: 'Jolooch.net', value: jobId },
        directApply: true,
      })
    : null;

  const html = `<!DOCTYPE html>
<html lang="mn"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} | Жолооч Монголиа</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonicalUrl}">
${isOpen ? '' : '<meta name="robots" content="noindex, follow">'}
<meta property="og:type" content="website">
<meta property="og:title" content="${title} | Жолооч Монголиа">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${canonicalUrl}">
${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ''}
<meta http-equiv="refresh" content="0;url=${redirectUrl}">
<script>location.replace(${JSON.stringify(redirectUrl)});</script>
${jsonLd ? `<script type="application/ld+json">${jsonLd}</script>` : ''}
</head><body>
<p>Ачааллаж байна... <a href="${redirectUrl}">Энд дарж үргэлжлүүлнэ үү</a>.</p>
</body></html>`;

  res.status(200).set('Cache-Control', 'public, max-age=300').send(html);
});

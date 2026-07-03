/**
 * Sitemap Generator
 * 
 * Build хийсний дараа out/ хавтаснаас бүх HTML файлуудыг уншиж
 * sitemap.xml файлыг автоматаар үүсгэнэ.
 */

import { readdirSync, statSync, writeFileSync, readFileSync } from 'fs';
import { join, relative } from 'path';

const BASE_URL = 'https://jolooch.net';
const OUT_DIR = join(process.cwd(), 'out');

// Auth шаардсан болон туслах хуудсуудыг sitemap-аас хасна (Google-д ашиггүй).
// /profile нь query param (?id=xxx) ашигладаг бөгөөд өөрөө нэвтрээгүй хэрэглэгчийг
// /auth руу шилждэг тул индекслэх ямар ч агуулгагүй.
const EXCLUDED_PATHS = ['/settings', '/applications', '/board', '/profile', '/design-preview', '/_not-found', '/404', '/google'];

function scanHtmlFiles(dir, fileList = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      // _next хавтасыг алгасна
      if (entry === '_next') continue;
      scanHtmlFiles(fullPath, fileList);
    } else if (entry.endsWith('.html')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

// Job pages embed a JobPosting JSON-LD block (see src/app/jobs/[id]/page.tsx)
// with a `datePosted` field. Pulling the real posting date out of it gives
// search engines an honest <lastmod> instead of "today" for every single URL
// on every single build — a signal so uniform it reads as fake (audit P5).
function extractJobDatePosted(htmlPath) {
  try {
    const html = readFileSync(htmlPath, 'utf-8');
    const scripts = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
    for (const [, jsonText] of scripts) {
      try {
        const json = JSON.parse(jsonText);
        if (json['@type'] === 'JobPosting' && json.datePosted) {
          return json.datePosted.split('T')[0];
        }
      } catch {
        // not valid/relevant JSON-LD — keep checking other script blocks
      }
    }
  } catch {
    // file read failed — fall back to build date
  }
  return null;
}

function htmlPathToUrl(htmlPath) {
  let rel = relative(OUT_DIR, htmlPath).replace(/\\/g, '/');
  // index.html → /
  if (rel === 'index.html') return '/';
  // folder/index.html → /folder
  if (rel.endsWith('/index.html')) {
    return '/' + rel.replace('/index.html', '');
  }
  // file.html → /file
  return '/' + rel.replace('.html', '');
}

function generateSitemap() {
  const htmlFiles = scanHtmlFiles(OUT_DIR);
  const today = new Date().toISOString().split('T')[0];

  const entries = htmlFiles
    .map(f => ({ url: htmlPathToUrl(f), file: f }))
    .filter(({ url }) => !EXCLUDED_PATHS.some(excluded => url.startsWith(excluded)))
    .sort((a, b) => a.url.localeCompare(b.url));

  const priorityMap = (url) => {
    if (url === '/') return '1.0';
    if (url === '/auth') return '0.8';
    if (url.startsWith('/jobs/')) return '0.9';
    if (url.startsWith('/profile/')) return '0.7';
    return '0.5';
  };

  const changefreqMap = (url) => {
    if (url.startsWith('/jobs/')) return 'daily';
    if (url.startsWith('/profile/')) return 'weekly';
    return 'monthly';
  };

  const lastmodFor = ({ url, file }) => {
    if (url.startsWith('/jobs/')) {
      return extractJobDatePosted(file) || today;
    }
    return today;
  };

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(entry => `  <url>
    <loc>${BASE_URL}${entry.url}</loc>
    <lastmod>${lastmodFor(entry)}</lastmod>
    <changefreq>${changefreqMap(entry.url)}</changefreq>
    <priority>${priorityMap(entry.url)}</priority>
  </url>`).join('\n')}
</urlset>`;

  writeFileSync(join(OUT_DIR, 'sitemap.xml'), xml, 'utf-8');
  const urls = entries.map(e => e.url);
  console.log(`✅ sitemap.xml үүсгэлээ (${urls.length} URL)`);
  urls.forEach(u => console.log(`   ${u}`));
}

generateSitemap();

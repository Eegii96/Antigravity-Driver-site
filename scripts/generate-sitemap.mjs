/**
 * Sitemap Generator
 * 
 * Build хийсний дараа out/ хавтаснаас бүх HTML файлуудыг уншиж
 * sitemap.xml файлыг автоматаар үүсгэнэ.
 */

import { readdirSync, statSync, writeFileSync } from 'fs';
import { join, relative } from 'path';

const BASE_URL = 'https://jolooch.net';
const OUT_DIR = join(process.cwd(), 'out');

// Auth шаардсан болон туслах хуудсуудыг sitemap-аас хасна (Google-д ашиггүй)
const EXCLUDED_PATHS = ['/settings', '/applications', '/board', '/_not-found', '/404', '/google'];

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

  const urls = htmlFiles
    .map(f => htmlPathToUrl(f))
    .filter(url => !EXCLUDED_PATHS.some(excluded => url.startsWith(excluded)))
    .sort();

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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${BASE_URL}${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreqMap(url)}</changefreq>
    <priority>${priorityMap(url)}</priority>
  </url>`).join('\n')}
</urlset>`;

  writeFileSync(join(OUT_DIR, 'sitemap.xml'), xml, 'utf-8');
  console.log(`✅ sitemap.xml үүсгэлээ (${urls.length} URL)`);
  urls.forEach(u => console.log(`   ${u}`));
}

generateSitemap();

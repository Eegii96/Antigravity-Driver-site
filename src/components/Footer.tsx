'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import { AIMAG_SLUGS } from '../lib/aimag-slugs';

export default function Footer() {
  return (
    <footer id="footer-section" className="bg-[var(--bg2)] text-[var(--muted-foreground)] border-t border-[var(--border)] text-sm py-12 px-6 relative">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center space-x-2 text-[var(--fg)] font-semibold mb-4 text-base">
            <div className="w-8 h-8 rounded-xl bg-[var(--bg)] border border-[var(--border-strong)] flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="w-full h-full object-cover" src="/logo.jpg" alt="Logo" loading="lazy" width="32" height="32" />
            </div>
            <span className="tracking-tight font-sans">Хүнд машин, механизм & Газар шорооны ажлын сайт</span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed mb-4 font-sans">
            Хүнд машин, механизм, газар шороо, барилга угсралт болон түрээсийн салбарт ажиллаж буй хариуцлагатай жолооч, оператор болон найдвартай ажил олгогчдыг нэгтгэсэн ажлын түүх, тоон үнэлгээний систем. Бид салбарын хэмжээнд залилан болон хариуцлагагүй байдлыг арилгаж, итгэлцэл дээр суурилсан хамтын ажиллагааны орчныг бүрдүүлэх зорилготой.
          </p>
        </div>

        <div>
          <h2 className="text-[var(--fg)] font-medium mb-4 text-sm font-sans">Аюулгүй байдлын зөвлөгөө</h2>
          <ul className="space-y-3 text-xs text-[var(--muted-foreground)] leading-relaxed font-sans">
            <li><strong>1. Үнэлгээ & Түүх нягтлах:</strong> Ажил олгогч эсвэл жолооч, оператортой холбогдохоос өмнө тэдгээрийн ажлын түүх, өмнөх үнэлгээнүүдийг системээс заавал шалгаж хэвшинэ үү.</li>
            <li><strong>2. Тоон үнэлгээ өгөх:</strong> Залилан болон ажлын хариуцлагагүй байдлаас сэргийлэх зорилгоор ажлын гүйцэтгэлийн дараа нөгөө талдаа 1-ээс 5 хүртэлх тоогоор бодит үнэлгээг заавал үлдээнэ үү.</li>
            <li><strong>3. Тохиролцоог баталгаажуулах:</strong> Санхүүгийн болон цалин хөлсний нөхцөл, техникийн бэлэн байдал зэргийг хамтын ажиллагаа эхлэхээс өмнө хоёр талдаа тодорхой тохирч, баталгаажуулна уу.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-[var(--fg)] font-medium mb-4 text-sm font-sans">Холбоо барих</h2>
          <address className="not-italic">
            <ul className="space-y-2.5 text-sm font-sans">
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
                <a href="mailto:enkhyondoo@gmail.com" className="hover:text-[var(--fg)] underline decoration-[var(--border)] underline-offset-2 transition-colors">
                  enkhyondoo@gmail.com
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
                <a href="tel:+97699106339" className="hover:text-[var(--fg)] underline decoration-[var(--border)] underline-offset-2 transition-colors font-mono">
                  +976 99106339
                </a>
                <span className="text-xs text-[var(--muted-foreground)]">(Даваа - Баасан)</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
                <span>Улаанбаатар хот, Сүхбаатар дүүрэг, 1-р хороо</span>
              </li>
            </ul>
          </address>
        </div>
      </div>

      <nav aria-label="Аймгаар хайх" className="max-w-7xl mx-auto border-t border-[var(--border)] mt-8 pt-6 text-xs text-[var(--muted-foreground)] font-sans">
        <span className="font-semibold">Аймгаар хайх:</span>{' '}
        {AIMAG_SLUGS.map(({ location, slug }, idx) => (
          <span key={slug}>
            <Link href={`/jobs/aimag/${slug}`} className="hover:text-[var(--fg)] transition-colors">
              {location}
            </Link>
            {idx < AIMAG_SLUGS.length - 1 && ' · '}
          </span>
        ))}
      </nav>

      <div className="max-w-7xl mx-auto border-t border-[var(--border)] mt-6 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-[var(--muted-foreground)] font-sans">
        <p>© {new Date().getFullYear()} Хүнд машин, механизм & Газар шорооны ажлын сайт. Бүх эрх хуулиар хамгаалагдсан.</p>
        <div className="flex items-center space-x-6 mt-4 md:mt-0">
          <Link
            href="/terms"
            className="hover:text-[var(--fg)] transition-colors underline-offset-2 hover:underline py-2"
          >
            Үйлчилгээний нөхцөл
          </Link>
          <Link
            href="/privacy"
            className="hover:text-[var(--fg)] transition-colors underline-offset-2 hover:underline py-2"
          >
            Нууцлалын бодлого
          </Link>
          <span className="text-[var(--muted-foreground)]">Хувилбар 1.2.0</span>
        </div>
      </div>

    </footer>
  );
}

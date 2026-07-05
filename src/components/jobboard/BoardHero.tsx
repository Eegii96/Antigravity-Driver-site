'use client';

import { ShieldCheck, Star, TrendingUp, Tractor, ArrowRight } from 'lucide-react';

interface BoardHeroProps {
  isLoggedIn: boolean;
  /** Live counts surfaced as social proof inside the hero band. */
  jobsCount: number;
  userCount: number | null;
  /** Opens the job-post modal (logged-in primary CTA). */
  onPostJob: () => void;
}

/**
 * Homepage hero — the single "boldness spend" of the Hi-vis Industrial
 * system: a dark graphite brand band (nameplate moment) on an otherwise
 * light page. CTAs are real <a> anchors so crawlers/audits count them
 * as conversion paths, not just JS buttons.
 */
export default function BoardHero({ isLoggedIn, jobsCount, userCount, onPostJob }: BoardHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[var(--fg)] text-[var(--bg)]">
      <div className="hazard-stripe h-2 w-full" />

      {/* Faint oversized machinery watermark — depth without noise */}
      <Tractor
        aria-hidden="true"
        className="hidden lg:block absolute -right-10 -bottom-16 w-105 h-105 text-[var(--accent)] opacity-[0.07] pointer-events-none rotate-[-4deg]"
        strokeWidth={1}
      />

      <div className="max-w-4xl mx-auto w-full px-6 py-10 md:py-16 relative">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-[var(--accent)] border border-[rgba(255,196,0,0.35)] bg-[rgba(255,196,0,0.08)] px-3 py-1.5 rounded-sm">
          Газар шорооны ажлын зах зээл — Монгол даяар
        </span>

        <h1 className="mt-4 text-3xl md:text-5xl font-display font-black uppercase tracking-tight leading-[1.08]">
          Найдвартай хамтрагчаа{' '}
          <span className="bg-[var(--accent)] text-[var(--accent-foreground)] px-2 inline-block">
            үнэлгээгээр
          </span>{' '}
          нь ол
        </h1>

        <p className="mt-4 text-sm md:text-base text-[rgba(244,245,242,0.72)] max-w-2xl leading-relaxed">
          Хүнд машин, механизмын жолооч, оператор болон ажил олгогч бүрийн ажлын түүх,
          бодит үнэлгээ энд ил тод. Дундын шимтгэлгүй, шууд утсаар холбогдоно — хэн
          хариуцлагатай, хэн шударга болохыг өмнөх түүх нь хэлнэ.
        </p>

        {/* Primary conversion path — real anchor links, thumb-sized targets */}
        <div className="mt-7 flex flex-wrap items-center gap-3">
          {isLoggedIn ? (
            <button
              onClick={onPostJob}
              className="inline-flex items-center gap-2 bg-[var(--accent)] hover:brightness-95 active:scale-[0.98] text-[var(--accent-foreground)] font-bold text-sm px-6 py-3.5 rounded transition-all cursor-pointer shadow-sm"
            >
              Зар нэмэх
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <a
              href="/auth?tab=register"
              className="inline-flex items-center gap-2 bg-[var(--accent)] hover:brightness-95 active:scale-[0.98] text-[var(--accent-foreground)] font-bold text-sm px-6 py-3.5 rounded transition-all shadow-sm"
            >
              Үнэгүй бүртгүүлэх
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
          <a
            href="#job-board"
            className="inline-flex items-center text-sm font-semibold px-5 py-3.5 rounded border border-[rgba(244,245,242,0.25)] text-[var(--bg)] hover:bg-[rgba(244,245,242,0.08)] transition-all"
          >
            Зар үзэх
          </a>
          {!isLoggedIn && (
            <a
              href="/auth?tab=login"
              className="text-sm font-semibold text-[rgba(244,245,242,0.72)] hover:text-[var(--bg)] px-2 py-3.5 transition-colors"
            >
              Нэвтрэх
            </a>
          )}
        </div>

        {/* Live marketplace stats — spec-sheet style social proof */}
        <dl className="mt-9 grid grid-cols-3 gap-3 sm:flex sm:flex-wrap sm:items-stretch sm:gap-x-8 sm:gap-y-4 border-t border-[rgba(244,245,242,0.14)] pt-6">
          <div>
            <dt className="text-xs uppercase tracking-widest font-semibold text-[rgba(244,245,242,0.55)]">Нийт зар</dt>
            <dd className="mt-1 font-mono text-2xl md:text-3xl font-bold text-[var(--accent)]">{jobsCount}</dd>
          </div>
          <div className="sm:border-l sm:border-[rgba(244,245,242,0.14)] sm:pl-8">
            <dt className="text-xs uppercase tracking-widest font-semibold text-[rgba(244,245,242,0.55)]">Бүртгэлтэй хэрэглэгч</dt>
            <dd className="mt-1 font-mono text-2xl md:text-3xl font-bold text-[var(--accent)]">
              {userCount !== null ? userCount : '—'}
            </dd>
          </div>
          <div className="sm:border-l sm:border-[rgba(244,245,242,0.14)] sm:pl-8">
            <dt className="text-xs uppercase tracking-widest font-semibold text-[rgba(244,245,242,0.55)]">Аймаг, хот хамарсан</dt>
            <dd className="mt-1 font-mono text-2xl md:text-3xl font-bold text-[var(--accent)]">22</dd>
          </div>
        </dl>

        {/* Trust pillars */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-start gap-3 bg-[rgba(244,245,242,0.05)] border border-[rgba(244,245,242,0.12)] rounded-md p-4">
            <ShieldCheck className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-[var(--bg)]">Баталгаат түүх</div>
              <div className="text-xs text-[rgba(244,245,242,0.6)] leading-snug mt-1">Хийсэн ажил бүр бүртгэгдэж, хариуцлагыг өсгөнө</div>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-[rgba(244,245,242,0.05)] border border-[rgba(244,245,242,0.12)] rounded-md p-4">
            <Star className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-[var(--bg)]">Бодит үнэлгээ</div>
              <div className="text-xs text-[rgba(244,245,242,0.6)] leading-snug mt-1">Зөвхөн хамтран ажилласан хоёр тал бие биеэ үнэлнэ</div>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-[rgba(244,245,242,0.05)] border border-[rgba(244,245,242,0.12)] rounded-md p-4">
            <TrendingUp className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-[var(--bg)]">Найдвартай сонголт</div>
              <div className="text-xs text-[rgba(244,245,242,0.6)] leading-snug mt-1">Сайн ажилтан, шударга ажил олгогчийг түүхээр нь ялгана</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

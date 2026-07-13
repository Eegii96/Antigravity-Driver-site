'use client';

import { ShieldCheck, Star, History, ArrowUpRight } from 'lucide-react';

interface BoardHeroProps {
  isLoggedIn: boolean;
  /** Live counts surfaced as social proof inside the hero band. */
  jobsCount: number;
  userCount: number | null;
  /** Opens the job-post modal (logged-in primary CTA). */
  onPostJob: () => void;
}

const TRUST_PILLARS = [
  {
    icon: History,
    title: 'Баталгаат түүх',
    body: 'Хийсэн ажил бүр бүртгэгдэж, хариуцлагыг өсгөнө',
  },
  {
    icon: Star,
    title: 'Бодит үнэлгээ',
    body: 'Зөвхөн хамтран ажилласан хоёр тал бие биеэ үнэлнэ',
  },
  {
    icon: ShieldCheck,
    title: 'Найдвартай сонголт',
    body: 'Сайн ажилтан, шударга ажил олгогчийг түүхээр нь ялгана',
  },
];

/**
 * Homepage hero — the deep teal-ink brand band of the "Calm Professional"
 * system: sentence-case Manrope heading with a steel-blue highlight word,
 * white pill CTA with an arrow circle, live stats, soft trust cards.
 * CTAs are real <a> anchors so crawlers/audits count them as conversion
 * paths, not just JS buttons.
 */
export default function BoardHero({ isLoggedIn, jobsCount, userCount, onPostJob }: BoardHeroProps) {
  const ctaClasses =
    'group inline-flex items-center gap-3 bg-[rgba(250,249,246,1)] text-[var(--fg)] font-display font-bold text-[15px] pl-6 pr-2 py-2 rounded-full transition-all hover:brightness-95 active:scale-[0.98] shadow-sm';
  const ctaArrow = (
    <span className="w-9 h-9 rounded-full bg-[var(--fg)] text-[rgba(250,249,246,1)] flex items-center justify-center transition-transform group-hover:rotate-45">
      <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
    </span>
  );

  return (
    <section className="relative overflow-hidden bg-[var(--fg)] text-[rgba(250,249,246,0.95)]">
      <div className="max-w-4xl mx-auto w-full px-5 md:px-6 pt-12 pb-10 md:pt-18 md:pb-14 relative">
        <span className="inline-flex items-center gap-2.5 rounded-full border border-[rgba(250,249,246,0.18)] bg-[rgba(250,249,246,0.06)] px-4 py-2 text-[13px] font-medium text-[rgba(250,249,246,0.85)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--tint)]" aria-hidden="true" />
          Газар шорооны ажлын зах зээл — Монгол даяар
        </span>

        <h1 className="mt-6 font-display font-bold text-[34px] leading-[1.14] md:text-[52px] md:leading-[1.08] tracking-[-0.01em]">
          Найдвартай хамтрагчаа{' '}
          <span className="text-[var(--tint)]">үнэлгээгээр</span> нь олоорой
        </h1>

        <p className="mt-5 text-[15px] md:text-[17px] text-[rgba(250,249,246,0.68)] max-w-2xl leading-relaxed">
          Хүнд машин, механизмын жолооч, оператор болон ажил олгогч бүрийн ажлын түүх,
          бодит үнэлгээ энд ил тод. Дундын шимтгэлгүй, шууд утсаар холбогдоно.
        </p>

        {/* Primary conversion path — real anchor links, thumb-sized targets */}
        <div className="mt-8 flex flex-wrap items-center gap-3.5">
          {isLoggedIn ? (
            <button onClick={onPostJob} className={`${ctaClasses} cursor-pointer`}>
              Зар нэмэх
              {ctaArrow}
            </button>
          ) : (
            <a href="/auth?tab=register" className={ctaClasses}>
              Үнэгүй бүртгүүлэх
              {ctaArrow}
            </a>
          )}
          <a
            href="#job-board"
            className="inline-flex items-center text-[15px] font-semibold px-6 py-3.5 rounded-full border border-[rgba(250,249,246,0.25)] text-[rgba(250,249,246,0.92)] hover:bg-[rgba(250,249,246,0.08)] transition-all"
          >
            Зар үзэх
          </a>
          {!isLoggedIn && (
            <a
              href="/auth?tab=login"
              className="text-[15px] font-semibold text-[rgba(250,249,246,0.65)] hover:text-[rgba(250,249,246,1)] px-2 py-3.5 transition-colors"
            >
              Нэвтрэх
            </a>
          )}
        </div>

        {/* Live marketplace stats — social proof */}
        <dl className="mt-10 grid grid-cols-3 gap-4 sm:flex sm:flex-wrap sm:items-stretch sm:gap-x-10 sm:gap-y-4 border-t border-[rgba(250,249,246,0.12)] pt-7">
          <div>
            <dd className="font-display text-[28px] md:text-4xl font-bold text-[rgba(250,249,246,1)] leading-none">{jobsCount}</dd>
            <dt className="mt-2 text-[13px] font-medium text-[rgba(250,249,246,0.55)]">Нийт зар</dt>
          </div>
          <div className="sm:border-l sm:border-[rgba(250,249,246,0.12)] sm:pl-10">
            <dd className="font-display text-[28px] md:text-4xl font-bold text-[rgba(250,249,246,1)] leading-none">
              {userCount !== null ? userCount : '—'}
            </dd>
            <dt className="mt-2 text-[13px] font-medium text-[rgba(250,249,246,0.55)]">Бүртгэлтэй хэрэглэгч</dt>
          </div>
          <div className="sm:border-l sm:border-[rgba(250,249,246,0.12)] sm:pl-10">
            <dd className="font-display text-[28px] md:text-4xl font-bold text-[rgba(250,249,246,1)] leading-none">22</dd>
            <dt className="mt-2 text-[13px] font-medium text-[rgba(250,249,246,0.55)]">Аймаг, хот хамарсан</dt>
          </div>
        </dl>

        {/* Trust pillars */}
        <div className="mt-9 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {TRUST_PILLARS.map((pillar) => (
            <div key={pillar.title} className="rounded-2xl bg-[rgba(250,249,246,0.05)] border border-[rgba(250,249,246,0.1)] p-5">
              <span className="w-10 h-10 rounded-full bg-[rgba(250,249,246,0.08)] flex items-center justify-center">
                <pillar.icon className="w-4.5 h-4.5 text-[var(--tint)]" aria-hidden="true" />
              </span>
              <div className="mt-3.5 text-[15px] font-display font-bold text-[rgba(250,249,246,0.95)]">{pillar.title}</div>
              <div className="mt-1 text-[13px] text-[rgba(250,249,246,0.58)] leading-relaxed">{pillar.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

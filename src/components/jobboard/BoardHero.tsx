'use client';

import { useRouter } from 'next/navigation';
import { ShieldCheck, Star, TrendingUp } from 'lucide-react';

interface BoardHeroProps {
  isLoggedIn: boolean;
}

export default function BoardHero({ isLoggedIn }: BoardHeroProps) {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden bg-[var(--bg2)] border-b border-[var(--border)]">
      <div className="hazard-stripe h-1.5 w-full" />
      <div className="max-w-4xl mx-auto w-full px-6 py-9 md:py-12 relative">
        <span className="inline-block text-xs font-bold uppercase tracking-wider text-[var(--accent-soft-foreground)] bg-[var(--accent-soft)] border border-[var(--accent)] px-3 py-1 rounded-sm">
          Газар шорооны ажлын зах зээл
        </span>
        <h1 className="mt-3 text-2xl md:text-4xl font-display font-black uppercase tracking-tight text-[var(--fg)] leading-tight">
          Найдвартай хамтрагчаа{' '}
          <span className="text-[var(--accent-soft-foreground)]">үнэлгээгээр</span> нь ол
        </h1>
        <p className="mt-2.5 text-xs md:text-sm text-[var(--muted-foreground)] max-w-2xl leading-relaxed">
          Жолооч, оператор болон ажил олгогч бүрийн ажлын түүх, бодит үнэлгээ ил тод. Хэн хариуцлагатай,
          хэн шударга — өмнөх түүх нь хэлнэ.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-start gap-2.5 bg-[var(--card)] border border-[var(--border)] rounded-md p-3.5">
            <ShieldCheck className="w-5 h-5 text-[var(--verify)] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-[var(--fg)]">Баталгаат түүх</div>
              <div className="text-xs text-[var(--muted-foreground)] leading-snug mt-0.5">Хийсэн ажил бүр бүртгэгдэж, хариуцлагыг өсгөнө</div>
            </div>
          </div>
          <div className="flex items-start gap-2.5 bg-[var(--card)] border border-[var(--border)] rounded-md p-3.5">
            <Star className="w-5 h-5 text-[var(--verify)] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-[var(--fg)]">Бодит үнэлгээ</div>
              <div className="text-xs text-[var(--muted-foreground)] leading-snug mt-0.5">Хоёр тал бие биедээ үнэлгээ өгч итгэл бий болно</div>
            </div>
          </div>
          <div className="flex items-start gap-2.5 bg-[var(--card)] border border-[var(--border)] rounded-md p-3.5">
            <TrendingUp className="w-5 h-5 text-[var(--verify)] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-[var(--fg)]">Найдвартай сонголт</div>
              <div className="text-xs text-[var(--muted-foreground)] leading-snug mt-0.5">Сайн ажилтан, шударга ажил олгогчийг ялгана</div>
            </div>
          </div>
        </div>

        {!isLoggedIn && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => router.push('/auth?tab=register')}
              className="bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] font-bold text-xs md:text-sm px-5 py-2.5 rounded transition-all cursor-pointer shadow-sm"
            >
              Үнэгүй бүртгүүлэх
            </button>
            <button
              onClick={() => router.push('/auth?tab=login')}
              className="text-xs md:text-sm text-[var(--fg)] font-semibold px-3 py-2.5 rounded hover:bg-[var(--card)] transition-all cursor-pointer"
            >
              Нэвтрэх
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

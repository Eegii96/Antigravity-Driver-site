'use client';

import { UserPlus, FileText, PhoneCall, Star, ShieldCheck, Ban, History, ArrowRight, Phone } from 'lucide-react';

interface BoardInfoSectionsProps {
  isLoggedIn: boolean;
  /** Opens the job-post modal (logged-in CTA in the closing band). */
  onPostJob: () => void;
}

const STEPS = [
  {
    icon: UserPlus,
    num: '01',
    title: 'Бүртгүүлэх',
    body: 'Утасны дугаар, нэрээ оруулаад 2 минутад үнэгүй бүртгүүлнэ. Жолооч, оператор эсвэл ажил олгогч гэдгээ л сонгоно.',
  },
  {
    icon: FileText,
    num: '02',
    title: 'Зар тавих, хайх',
    body: 'Ажил олгогч зараа үнэгүй нийтэлнэ. Жолооч, оператор аймаг, техникийн төрөл, цалингаар шүүж өөрт тохирох ажлаа олно.',
  },
  {
    icon: PhoneCall,
    num: '03',
    title: 'Шууд утсаар холбогдох',
    body: 'Дундын зуучлагч, нэмэлт шимтгэл байхгүй. Хоёр тал утсаар шууд ярилцаж, нөхцөлөө өөрсдөө тохиролцоно.',
  },
  {
    icon: Star,
    num: '04',
    title: 'Үнэлгээ өгөх',
    body: 'Ажил дууссаны дараа хоёр тал бие биеэ 1-5 одоор үнэлнэ. Үнэлгээ бүр ажлын түүхэнд бүртгэгдэж, дараагийн хамтрагчид тань харагдана.',
  },
];

const TRUST_ITEMS = [
  {
    icon: History,
    title: 'Ажлын түүх бүртгэгдэнэ',
    body: 'Хийсэн ажил бүр хэрэглэгчийн профайлд байнга хадгалагдана. Шинэ хамтрагч сонгохдоо өмнөх ажлын түүхийг нь нэг дороос шалгана.',
  },
  {
    icon: ShieldCheck,
    title: 'Худал үнэлгээ байхгүй',
    body: 'Үнэлгээг зөвхөн бодитоор хамтран ажилласан хоёр тал бие биедээ өгнө — гаднаас дур мэдэн үнэлгээ өгөх боломжгүй тул үнэлгээ бүр бодит.',
  },
  {
    icon: Ban,
    title: 'Хар данс — хамгаалалт',
    body: 'Ажил таслах, цалин олгохгүй байх, согтуу ажиллах зэрэг ноцтой зөрчил гаргасан хэрэглэгч хар дансанд бүртгэгдэж, системээс хасагдана.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Бүртгүүлэх, зар тавихад төлбөртэй юу?',
    a: 'Үгүй. Бүртгэл, зар нийтлэх, ажил хайх, холбогдох бүгд бүрэн үнэгүй. Ямар ч далд шимтгэл, дундын зуучлалын хураамж байхгүй.',
  },
  {
    q: 'Ажил олгогчийн утасны дугаарыг яаж харах вэ?',
    a: 'Хувийн мэдээллийг хамгаалах үүднээс утасны дугаар, нэр зөвхөн бүртгэлтэй, нэвтэрсэн хэрэглэгчид харагдана. Үнэгүй бүртгүүлсний дараа шууд залгаж холбогдох боломжтой.',
  },
  {
    q: 'Үнэлгээний систем хэрхэн ажилладаг вэ?',
    a: 'Ажил дууссаны дараа ажил олгогч болон жолооч, оператор хоёулаа бие биедээ 1-5 одоор үнэлгээ, сэтгэгдэл үлдээнэ. Энэ нь тухайн хэрэглэгчийн профайлын ажлын түүхэнд бүртгэгдэж, бусад хэрэглэгчдэд ил харагдана.',
  },
  {
    q: 'Аль аймгуудад үйлчилдэг вэ?',
    a: 'Улаанбаатар хот болон бүх 21 аймагт үйлчилнэ. Зар бүр байршилтай тул өөрийн аймаг, сумын ойролцоох ажлыг шүүж хайх боломжтой.',
  },
];

/**
 * Static marketing/info bands below the job grid: how-it-works, trust,
 * FAQ, and a closing CTA band. Server-renderable copy that fixes the
 * audit's thin-copy (50 words) and zero-CTA/zero-contact findings.
 */
export default function BoardInfoSections({ isLoggedIn, onPostJob }: BoardInfoSectionsProps) {
  return (
    <>
      {/* ── How it works ── */}
      <section id="how-it-works" aria-label="Хэрхэн ажилладаг вэ" className="bg-[var(--card)] border-t border-[var(--border)] scroll-mt-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[var(--accent-soft-foreground)] bg-[var(--accent-soft)] border border-[var(--accent)] px-3 py-1.5 rounded-sm">
            Энгийн 4 алхам
          </span>
          <h2 className="mt-3 text-2xl md:text-3xl font-display font-black uppercase tracking-tight text-[var(--fg)]">
            Хэрхэн ажилладаг вэ?
          </h2>
          <p className="mt-2 text-sm md:text-base text-[var(--muted-foreground)] max-w-2xl leading-relaxed">
            Бүртгүүлснээс эхлээд ажлаа дуусгаж үнэлгээ авах хүртэл — бүх алхам энгийн,
            ил тод, төлбөргүй.
          </p>

          <ol className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STEPS.map((step) => (
              <li key={step.num} className="relative bg-[var(--bg)] border border-[var(--border)] rounded-md p-5 flex gap-4">
                <span className="font-mono text-2xl font-bold text-[var(--concrete)] leading-none select-none" aria-hidden="true">
                  {step.num}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <step.icon className="w-4.5 h-4.5 text-[var(--accent-soft-foreground)]" aria-hidden="true" />
                    <h3 className="text-sm md:text-base font-bold text-[var(--fg)]">{step.title}</h3>
                  </div>
                  <p className="mt-1.5 text-sm text-[var(--muted-foreground)] leading-relaxed">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Trust / why believe us ── */}
      <section aria-label="Яагаад итгэж болох вэ" className="bg-[var(--bg2)] border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-display font-black uppercase tracking-tight text-[var(--fg)]">
            Яагаад итгэж болох вэ?
          </h2>
          <p className="mt-2 text-sm md:text-base text-[var(--muted-foreground)] max-w-2xl leading-relaxed">
            Энэ салбарт хамгийн их дутагддаг зүйл бол итгэл. Бид итгэлийг амлалтаар биш —
            бүртгэгдсэн түүх, бодит үнэлгээгээр бий болгодог.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {TRUST_ITEMS.map((item) => (
              <div key={item.title} className="bg-[var(--card)] border border-[var(--border)] rounded-md p-5">
                <item.icon className="w-6 h-6 text-[var(--verify)]" aria-hidden="true" />
                <h3 className="mt-3 text-sm md:text-base font-bold text-[var(--fg)]">{item.title}</h3>
                <p className="mt-1.5 text-sm text-[var(--muted-foreground)] leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" aria-label="Түгээмэл асуулт, хариулт" className="bg-[var(--card)] border-t border-[var(--border)] scroll-mt-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-display font-black uppercase tracking-tight text-[var(--fg)]">
            Түгээмэл асуулт
          </h2>

          <div className="mt-6 divide-y divide-[var(--border)] border border-[var(--border)] rounded-md bg-[var(--bg)]">
            {FAQ_ITEMS.map((item) => (
              <details key={item.q} className="group px-5 py-4">
                <summary className="flex items-center justify-between gap-3 cursor-pointer list-none text-sm md:text-base font-semibold text-[var(--fg)] select-none">
                  {item.q}
                  <span className="shrink-0 text-[var(--muted-foreground)] transition-transform duration-200 group-open:rotate-90" aria-hidden="true">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </summary>
                <p className="mt-2.5 text-sm text-[var(--muted-foreground)] leading-relaxed max-w-2xl">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA band — dark nameplate bookend ── */}
      <section aria-label="Өнөөдөр эхлэх" className="relative bg-[var(--fg)] text-[var(--bg)] overflow-hidden">
        <div className="hazard-stripe h-2 w-full" />
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16 text-center">
          <h2 className="text-2xl md:text-4xl font-display font-black uppercase tracking-tight leading-tight">
            Өнөөдөр л <span className="text-[var(--accent)]">эхлээрэй</span>
          </h2>
          <p className="mt-3 text-sm md:text-base text-[rgba(244,245,242,0.72)] max-w-xl mx-auto leading-relaxed">
            Ажил хайж байгаа ч бай, ажилтан хайж байгаа ч бай — бүртгэл 2 минут,
            бүх үйлчилгээ үнэгүй.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
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
              href="tel:+97699106339"
              className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-3.5 rounded border border-[rgba(244,245,242,0.25)] text-[var(--bg)] hover:bg-[rgba(244,245,242,0.08)] transition-all"
            >
              <Phone className="w-4 h-4" aria-hidden="true" />
              Асуух зүйл байвал: 99106339
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

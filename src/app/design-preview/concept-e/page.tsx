import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  ShieldCheck,
  Star,
  Lock,
  ArrowRight,
  CheckCircle2,
  Wallet,
  ChevronRight,
} from "lucide-react";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-display" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body" });

const theme = {
  "--bg": "#fbf6ee",
  "--bg2": "#f3ead9",
  "--card": "#ffffff",
  "--border": "#e7dac3",
  "--fg": "#322316",
  "--muted": "#f1e7d6",
  "--muted-foreground": "#7a6a55",
  "--accent": "#c4622d",
  "--accent-foreground": "#ffffff",
  "--accent-soft": "#f3ddc9",
  "--accent-soft-foreground": "#9a4a1e",
  "--teal": "#3f7d58",
} as React.CSSProperties;

const jobs = [
  { tag: "Экскаватор", title: "Сууц барилгын ажилд оператор хэрэгтэй", loc: "Хан-Уул дүүрэгт · 3 сар", pay: "3.5 сая ₮ / сар", employer: "Ган-Эрдэнэ ХХК" },
  { tag: "Бульдозер", title: "Зам талбай тэгшлэх ажил — яаралтай", loc: "Дархан хотод · 1.5 сар", pay: "2.8 сая ₮ / сар", employer: "Тэрбум Тал ХХК" },
  { tag: "Ачигч", title: "Уурхайн талбайд туслах ачигч жолооч", loc: "Архангай аймагт · 6 сар", pay: "4.2 сая ₮ / сар", employer: "Алтан Гадас ХХК" },
];

const trust = [
  { icon: CheckCircle2, title: "Баталгаатай түүх", body: "Жолооч бүрийн өмнөх ажлын түүх, ажилласан хугацаа автоматаар бүртгэгдэж, дараагийн ажил олгогчид харагдана." },
  { icon: Star, title: "Хоёр талын үнэлгээ", body: "Ажил дууссаны дараа жолооч, ажил олгогч хоёулаа нэг нэгнийгээ үнэлж, нийтэд харагдах reputation үүсгэнэ." },
  { icon: Wallet, title: "Цалингийн баталгаа", body: "Цалин олгоогүй ажил олгогчийн түүх бүртгэгдэж, бусад жолоочид сэрэмжлүүлэг харагдана." },
];

export default function ConceptE() {
  return (
    <div
      style={theme}
      className={`${jakarta.variable} ${inter.variable} min-h-screen bg-[var(--bg)] text-[var(--fg)]`}
    >
      <div style={{ fontFamily: "var(--font-body)" }}>
        {/* NAV */}
        <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-xl">
          <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-8">
            <div className="flex items-center gap-2.5 text-lg font-extrabold" style={{ fontFamily: "var(--font-display)" }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] text-sm text-white">Ж</div>
              Жолооч.нэт
            </div>
            <div className="hidden gap-8 text-sm font-medium text-[var(--muted-foreground)] md:flex">
              <a href="#" className="hover:text-[var(--fg)]">Ажлын самбар</a>
              <a href="#" className="hover:text-[var(--fg)]">Жолооч хайх</a>
              <a href="#" className="hover:text-[var(--fg)]">Үнэлгээний систем</a>
              <a href="#" className="hover:text-[var(--fg)]">Тухай</a>
            </div>
            <div className="flex gap-2.5">
              <Button variant="ghost" size="sm">Нэвтрэх</Button>
              <Button size="sm">Бүртгүүлэх</Button>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <header className="px-8 pb-16 pt-24">
          <div className="mx-auto grid max-w-6xl items-center gap-14 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Badge variant="soft"><ShieldCheck className="h-3.5 w-3.5" /> Монголын анхны хариуцлагын систем</Badge>
              <h1
                className="mt-6 text-5xl font-extrabold leading-[1.1] tracking-tight md:text-[50px]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Итгэлтэй <span className="text-[var(--accent)]">жолооч</span>, хариуцлагатай ажил олгогч — нэг дороос
              </h1>
              <p className="mt-5 max-w-md text-[17px] leading-relaxed text-[var(--muted-foreground)]">
                Газар шорооны ажлын түүх, үнэлгээг тогтмол бүртгэж, хоёр талын хариуцлагыг өндөрсгөдөг анхны платформ.
              </p>
              <div className="mt-8 flex flex-wrap gap-3.5">
                <Button className="rounded-full">Ажил хайх <ArrowRight className="h-4 w-4" /></Button>
                <Button variant="outline" className="rounded-full">Жолооч хайх</Button>
              </div>
              <div className="mt-9 flex gap-9">
                {[["2,400+", "Баталгаатай үнэлгээ"], ["860+", "Бүртгэлтэй жолооч"], ["4.8 ★", "Дундаж үнэлгээ"]].map(([n, l]) => (
                  <div key={l}>
                    <div className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>{n}</div>
                    <div className="text-[13px] text-[var(--muted-foreground)]">{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <Card className="rounded-[28px] p-7 shadow-[0_18px_44px_-18px_rgba(196,98,45,0.28)]">
              <div className="mb-5 flex h-[190px] items-center justify-center rounded-3xl bg-[var(--muted)]">
                <svg width="150" height="100" viewBox="0 0 150 100" fill="none">
                  <rect x="18" y="55" width="66" height="26" rx="6" fill="#c4622d" />
                  <rect x="12" y="36" width="32" height="24" rx="6" fill="#9a4a1e" />
                  <rect x="18" y="42" width="18" height="11" rx="2" fill="#fbf6ee" />
                  <path d="M44 46 L94 28 L102 34 L56 54 Z" fill="#3f7d58" />
                  <circle cx="34" cy="84" r="12" fill="#322316" stroke="#7a6a55" strokeWidth="3" />
                  <circle cx="72" cy="84" r="12" fill="#322316" stroke="#7a6a55" strokeWidth="3" />
                </svg>
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="rounded-2xl"><div className="flex h-full w-full items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent-soft-foreground)]">БГ</div></Avatar>
                <div>
                  <div className="text-[15px] font-bold">Б. Ганболд — Экскаватор оператор</div>
                  <div className="text-[13px] text-[var(--muted-foreground)]">Төв аймаг · 6 жил туршлагатай</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4">
                <span className="flex items-center gap-1 text-sm font-bold"><Star className="h-3.5 w-3.5 fill-[var(--teal)] text-[var(--teal)]" />4.9</span>
                <span className="flex items-center gap-1 text-xs font-semibold text-[var(--teal)]"><CheckCircle2 className="h-3.5 w-3.5" /> 34 ажил баталгаатай</span>
              </div>
            </Card>
          </div>
        </header>

        {/* TRUST */}
        <section className="px-8 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-12 max-w-xl text-center">
              <Badge variant="outline">Яаж ажилладаг вэ</Badge>
              <h2 className="mt-4 text-3xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>Цоорхойг хаасан гурван давхар хамгаалалт</h2>
              <p className="mt-3 text-[15px] text-[var(--muted-foreground)]">Facebook группийн зар шиг хариуцлага үгүй биш — бүртгэл, түүх, үнэлгээ бүгд тогтмол хадгалагдана.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {trust.map((t) => (
                <Card key={t.title} className="rounded-3xl p-7 shadow-[0_10px_30px_-18px_rgba(50,35,22,0.18)]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)]">
                    <t.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-base font-bold">{t.title}</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">{t.body}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* JOBS */}
        <section className="bg-[var(--bg2)] px-8 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-12 max-w-xl text-center">
              <Badge variant="outline">Шинэ зарууд</Badge>
              <h2 className="mt-4 text-3xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>Одоо хайж буй ажлууд</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {jobs.map((j) => (
                <Card key={j.title} className="rounded-3xl p-5">
                  <Badge variant="soft" className="mb-3">{j.tag}</Badge>
                  <h4 className="mb-1.5 text-[15px] font-bold leading-snug">{j.title}</h4>
                  <div className="mb-3.5 text-[13px] text-[var(--muted-foreground)]">{j.loc}</div>
                  <div className="mb-3.5 text-lg font-extrabold text-[var(--accent)]">{j.pay}</div>
                  <div className="flex items-center gap-2.5 border-t border-[var(--border)] pt-3.5">
                    <Avatar className="h-7 w-7 rounded-xl blur-[4px]" />
                    <span className="select-none truncate text-[13px] text-[var(--muted-foreground)] blur-[4px]">{j.employer}</span>
                    <span className="ml-auto flex items-center gap-1 text-[11px] text-[var(--muted-foreground)]"><Lock className="h-3 w-3" /> нэвтрэх</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-8 py-20 text-center">
          <h2 className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>Хариуцлагатай нийгэмлэгт нэгдээрэй</h2>
          <p className="mx-auto mt-3 max-w-md text-[var(--muted-foreground)]">Бүртгүүлэхэд 2 минут зарцуулна. Үнэлгээний түүхээ өнөөдрөөс эхлэн бүтээгээрэй.</p>
          <div className="mt-7 flex justify-center gap-3.5">
            <Button className="rounded-full">Жолооч болж бүртгүүлэх <ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" className="rounded-full">Ажил олгогч болж бүртгүүлэх</Button>
          </div>
        </section>

        <footer className="border-t border-[var(--border)] py-8 text-center text-[13px] text-[var(--muted-foreground)]">
          © 2026 Жолооч.нэт — Концепт E: Warm Earth Construction (shadcn)
        </footer>
      </div>
    </div>
  );
}

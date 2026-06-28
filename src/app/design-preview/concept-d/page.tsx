import { Fraunces, Inter } from "next/font/google";
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

const fraunces = Fraunces({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body" });

const theme = {
  "--bg": "#0c0f17",
  "--bg2": "#11151f",
  "--card": "rgba(255,255,255,0.04)",
  "--border": "rgba(255,255,255,0.10)",
  "--fg": "#f1f3f8",
  "--muted": "rgba(255,255,255,0.06)",
  "--muted-foreground": "#9aa3b5",
  "--accent": "#8b5cf6",
  "--accent-foreground": "#ffffff",
  "--accent-soft": "rgba(139,92,246,0.14)",
  "--accent-soft-foreground": "#c4b5fd",
  "--teal": "#22d3ee",
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

export default function ConceptD() {
  return (
    <div
      style={theme}
      className={`${fraunces.variable} ${inter.variable} min-h-screen bg-[var(--bg)] text-[var(--fg)]`}
    >
      <div style={{ fontFamily: "var(--font-body)" }}>
        {/* NAV */}
        <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl">
          <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-8">
            <div className="flex items-center gap-2.5 text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--teal)] text-sm text-white">Ж</div>
              Жолооч<span className="text-[var(--accent)]">.нэт</span>
            </div>
            <div className="hidden gap-8 text-sm text-[var(--muted-foreground)] md:flex">
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
        <header className="relative overflow-hidden px-8 pb-16 pt-24">
          <div className="pointer-events-none absolute -right-40 -top-48 h-[520px] w-[520px] rounded-full bg-[var(--accent)] opacity-[0.14] blur-[110px]" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Badge variant="soft"><ShieldCheck className="h-3.5 w-3.5" /> Монголын анхны хариуцлагын систем</Badge>
              <h1
                className="mt-6 text-5xl font-semibold leading-[1.08] md:text-[52px]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Итгэлтэй <span className="text-[var(--accent)]">жолооч</span>, хариуцлагатай ажил олгогч — нэг дороос
              </h1>
              <p className="mt-5 max-w-md text-[17px] leading-relaxed text-[var(--muted-foreground)]">
                Газар шорооны ажлын түүх, үнэлгээг тогтмол бүртгэж, хоёр талын хариуцлагыг өндөрсгөдөг анхны платформ.
              </p>
              <div className="mt-8 flex flex-wrap gap-3.5">
                <Button>Ажил хайх <ArrowRight className="h-4 w-4" /></Button>
                <Button variant="outline">Жолооч хайх</Button>
              </div>
              <div className="mt-9 flex gap-9">
                {[["2,400+", "Баталгаатай үнэлгээ"], ["860+", "Бүртгэлтэй жолооч"], ["4.8 ★", "Дундаж үнэлгээ"]].map(([n, l]) => (
                  <div key={l}>
                    <div className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>{n}</div>
                    <div className="text-[13px] text-[var(--muted-foreground)]">{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <Card className="p-7">
              <div className="mb-5 flex h-[190px] items-center justify-center rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[#171c28] to-[#0e1119]">
                <svg width="150" height="100" viewBox="0 0 150 100" fill="none">
                  <rect x="18" y="55" width="66" height="26" rx="3" fill="#8b5cf6" />
                  <rect x="12" y="36" width="32" height="24" rx="3" fill="#6d28d9" />
                  <rect x="18" y="42" width="18" height="11" rx="1" fill="#0c0f17" />
                  <path d="M44 46 L94 28 L102 34 L56 54 Z" fill="#22d3ee" />
                  <circle cx="34" cy="84" r="12" fill="#0c0f17" stroke="#3a3f4c" strokeWidth="3" />
                  <circle cx="72" cy="84" r="12" fill="#0c0f17" stroke="#3a3f4c" strokeWidth="3" />
                </svg>
              </div>
              <div className="flex items-center gap-3">
                <Avatar><div className="flex h-full w-full items-center justify-center bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent-soft-foreground)]">БГ</div></Avatar>
                <div>
                  <div className="text-[15px] font-semibold">Б. Ганболд — Экскаватор оператор</div>
                  <div className="text-[13px] text-[var(--muted-foreground)]">Төв аймаг · 6 жил туршлагатай</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4">
                <span className="flex items-center gap-1 text-sm font-medium"><Star className="h-3.5 w-3.5 fill-[var(--teal)] text-[var(--teal)]" />4.9</span>
                <span className="flex items-center gap-1 text-xs text-[var(--teal)]"><CheckCircle2 className="h-3.5 w-3.5" /> 34 ажил баталгаатай</span>
              </div>
            </Card>
          </div>
        </header>

        {/* TRUST */}
        <section className="px-8 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-12 max-w-xl text-center">
              <Badge variant="outline">Яаж ажилладаг вэ</Badge>
              <h2 className="mt-4 text-3xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>Цоорхойг хаасан гурван давхар хамгаалалт</h2>
              <p className="mt-3 text-[15px] text-[var(--muted-foreground)]">Facebook группийн зар шиг хариуцлага үгүй биш — бүртгэл, түүх, үнэлгээ бүгд тогтмол хадгалагдана.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {trust.map((t) => (
                <Card key={t.title} className="p-7">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)]">
                    <t.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold">{t.title}</h3>
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
              <h2 className="mt-4 text-3xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>Одоо хайж буй ажлууд</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {jobs.map((j) => (
                <Card key={j.title} className="bg-[var(--card)] p-5">
                  <Badge variant="soft" className="mb-3">{j.tag}</Badge>
                  <h4 className="mb-1.5 text-[15px] font-semibold leading-snug">{j.title}</h4>
                  <div className="mb-3.5 text-[13px] text-[var(--muted-foreground)]">{j.loc}</div>
                  <div className="mb-3.5 text-lg font-semibold text-[var(--teal)]">{j.pay}</div>
                  <div className="flex items-center gap-2.5 border-t border-[var(--border)] pt-3.5">
                    <Avatar className="h-7 w-7 blur-[4px]" />
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
          <h2 className="text-3xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>Хариуцлагатай нийгэмлэгт нэгдээрэй</h2>
          <p className="mx-auto mt-3 max-w-md text-[var(--muted-foreground)]">Бүртгүүлэхэд 2 минут зарцуулна. Үнэлгээний түүхээ өнөөдрөөс эхлэн бүтээгээрэй.</p>
          <div className="mt-7 flex justify-center gap-3.5">
            <Button>Жолооч болж бүртгүүлэх <ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline">Ажил олгогч болж бүртгүүлэх</Button>
          </div>
        </section>

        <footer className="border-t border-[var(--border)] py-8 text-center text-[13px] text-[var(--muted-foreground)]">
          © 2026 Жолооч.нэт — Концепт D: Glass Premium Violet (shadcn)
        </footer>
      </div>
    </div>
  );
}

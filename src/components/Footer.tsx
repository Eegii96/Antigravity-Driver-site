'use client';

import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, X, FileText, Lock } from 'lucide-react';

export default function Footer() {
  const [showTerms, setShowTerms] = useState<boolean>(false);
  const [showPrivacy, setShowPrivacy] = useState<boolean>(false);

  useEffect(() => {
    if (showTerms || showPrivacy) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showTerms, showPrivacy]);

  return (
    <footer id="footer-section" className="bg-[var(--bg2)] text-[var(--muted-foreground)] border-t border-[var(--border)] text-sm py-12 px-6 relative">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center space-x-2 text-[var(--fg)] font-semibold mb-4 text-base">
            <div className="w-8 h-8 rounded-md bg-[var(--bg)] border border-[var(--border-strong)] flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm">
              <img className="w-full h-full object-cover" src="/logo.jpg" alt="Logo" />
            </div>
            <span className="tracking-tight font-sans">Хүнд машин, механизм & Газар шорооны ажлын сайт</span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed mb-4 font-sans">
            Хүнд машин, механизм, газар шороо, барилга угсралт болон түрээсийн салбарт ажиллаж буй хариуцлагатай жолооч, оператор болон найдвартай ажил олгогчдыг нэгтгэсэн ажлын түүх, тоон үнэлгээний систем. Бид салбарын хэмжээнд залилан болон хариуцлагагүй байдлыг арилгаж, итгэлцэл дээр суурилсан хамтын ажиллагааны орчныг бүрдүүлэх зорилготой.
          </p>
        </div>

        <div>
          <h4 className="text-[var(--fg)] font-medium mb-4 text-sm font-sans">Аюулгүй байдлын зөвлөгөө</h4>
          <ul className="space-y-3 text-xs text-[var(--muted-foreground)] leading-relaxed font-sans">
            <li><strong>1. Үнэлгээ & Түүх нягтлах:</strong> Ажил олгогч эсвэл жолооч, оператортой холбогдохоос өмнө тэдгээрийн ажлын түүх, өмнөх үнэлгээнүүдийг системээс заавал шалгаж хэвшинэ үү.</li>
            <li><strong>2. Тоон үнэлгээ өгөх:</strong> Залилан болон ажлын хариуцлагагүй байдлаас сэргийлэх зорилгоор ажлын гүйцэтгэлийн дараа нөгөө талдаа 1-ээс 5 хүртэлх тоогоор бодит үнэлгээг заавал үлдээнэ үү.</li>
            <li><strong>3. Тохиролцоог баталгаажуулах:</strong> Санхүүгийн болон цалин хөлсний нөхцөл, техникийн бэлэн байдал зэргийг хамтын ажиллагаа эхлэхээс өмнө хоёр талдаа тодорхой тохирч, баталгаажуулна уу.</li>
          </ul>
        </div>

        <div>
          <h4 className="text-[var(--fg)] font-medium mb-4 text-sm font-sans">Холбоо барих</h4>
          <ul className="space-y-2.5 text-xs font-sans">
            <li className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
              <span>enkhyondoo@gmail.com</span>
            </li>
            <li className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
              <span>+976 99106339 (Даваа - Баасан)</span>
            </li>
            <li className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
              <span>Улаанбаатар хот, Сүхбаатар дүүрэг, 1-р хороо</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-[var(--color-glass-border)] mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-[var(--muted-foreground)] font-sans">
        <p>© {new Date().getFullYear()} Хүнд машин, механизм & Газар шорооны ажлын сайт. Бүх эрх хуулиар хамгаалагдсан.</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <span 
            onClick={() => setShowTerms(true)}
            className="hover:text-[var(--fg)] cursor-pointer transition-colors"
          >
            Үйлчилгээний нөхцөл
          </span>
          <span 
            onClick={() => setShowPrivacy(true)}
            className="hover:text-[var(--fg)] cursor-pointer transition-colors"
          >
            Нууцлалын бодлого
          </span>
          <span className="text-[var(--muted-foreground)]">Хувилбар 1.2.0</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TERMS OF SERVICE MODAL (Монгол Улсын стандартын дагуу) */}
      {/* ============================================================== */}
      {showTerms && (
        <div 
          onClick={() => setShowTerms(false)} 
          className="fixed inset-0 bg-[var(--fg)]/40 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-[var(--card)] border border-[var(--color-glass-border)] rounded-md max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-md relative"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[var(--card)] border-b border-[var(--color-glass-border)] px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center space-x-2.5">
                <FileText className="w-5 h-5 text-[var(--accent-soft-foreground)]" />
                <h3 className="text-sm font-bold text-[var(--fg)] font-sans">Үйлчилгээний нөхцөл (Terms of Service)</h3>
              </div>
              <button 
                onClick={() => setShowTerms(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--fg)] transition-colors cursor-pointer p-1 rounded-lg hover:bg-[var(--bg2)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-5 text-xs text-[var(--fg)] leading-relaxed font-sans">
              <div className="bg-[var(--accent-soft)] border border-[var(--accent)] p-4 rounded-md space-y-1.5">
                <p className="font-bold text-[var(--accent-soft-foreground)] text-sm">Хэрэглэгчийн аюулгүй байдлын баталгаа</p>
                <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                  Энэхүү үйлчилгээний нөхцөл нь Монгол Улсын Иргэний хууль, Хэрэглэгчийн эрхийг хамгаалах тухай хууль болон бусад холбогдох хууль тогтоомжийн дагуу боловсруулагдсан болно.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[var(--fg)] text-sm">1. Ерөнхий нөхцөл</h4>
                <p>1.1. Энэхүү платформ нь хүнд машин механизм, газар шорооны ажлын чиглэлээр ажиллаж буй жолооч, оператор болон ажил олгогч нарыг холбох, ажлын түүх, үнэлгээгээр баталгаажсан найдвартай хамтын ажиллагааг үүсгэх зорилготой.</p>
                <p>1.2. Хэрэглэгч системд бүртгүүлснээр энэхүү үйлчилгээний нөхцөлийг бүрэн хүлээн зөвшөөрсөнд тооцогдоно.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[var(--fg)] text-sm">2. Хэрэглэгчийн хариуцлага ба Үнэлгээний систем</h4>
                <p>2.1. Хэрэглэгч өөрийн бүртгэлийн мэдээлэл (нэр, утас, хаяг г.м)-ийн үнэн зөв байдлыг бүрэн хариуцна.</p>
                <p>2.2. Жолооч болон ажил олгогч нар ажлын гүйцэтгэлийн дараа нөгөө талдаа бодитой, үнэн зөв үнэлгээ өгөх үүрэгтэй.</p>
                <p className="text-[var(--alert)] font-semibold">2.3. Ажлын хариуцлага алдаж шалтгаангүй ажил хаясан, техникт санаатай хохирол учруулсан, ажлын байранд архидан согтуурсан, цалин хөлс олгоогүй гэх мэт ноцтой зөрчил гаргасан тохиолдолд хэрэглэгчийн мэдээллийг хар дансанд бүртгэж, цаашид системийг ашиглах болон дахин үйлчилгээ авах боломжгүй болох эрсдэлтэйг анхаарна уу.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[var(--fg)] text-sm">3. Платформын хариуцлагын хязгаарлалт</h4>
                <p>3.1. Платформ нь мэдээлэл дамжуулах, зуучлах, баталгаажуулах үүргийг гүйцэтгэх бөгөөд талуудын хоорондох хөдөлмөрийн болон санхүүгийн шууд маргааныг хариуцахгүй. Гэвч маргаан гарсан тохиолдолд ажлын түүх болон үнэлгээний мэдээллээр дэмжлэг үзүүлнэ.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[var(--fg)] text-sm">4. Үйлчилгээний нөхцөлийн өөрчлөлт</h4>
                <p>4.1. Үйлчилгээний нөхцөл шинэчлэгдэх бүрт хэрэглэгчдэд нээлттэй мэдээлэгдэх бөгөөд үйлчилгээг үргэлжлүүлэн ашиглах нь шинэ нөхцөлийг зөвшөөрсөнд тооцогдоно.</p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="border-t border-[var(--color-glass-border)] px-6 py-4 flex justify-end bg-[var(--bg2)]">
              <button 
                onClick={() => setShowTerms(false)}
                className="bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] font-bold px-5 py-2 rounded transition-all cursor-pointer text-xs font-sans"
              >
                Ойлголоо, зөвшөөрөв
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PRIVACY POLICY MODAL (Хувь хүний мэдээлэл хамгаалах тухай хуульд нийцсэн) */}
      {/* ============================================================== */}
      {showPrivacy && (
        <div 
          onClick={() => setShowPrivacy(false)} 
          className="fixed inset-0 bg-[var(--fg)]/40 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-[var(--card)] border border-[var(--color-glass-border)] rounded-md max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-md relative"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[var(--card)] border-b border-[var(--color-glass-border)] px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center space-x-2.5">
                <Lock className="w-5 h-5 text-[var(--verify)]" />
                <h3 className="text-sm font-bold text-[var(--fg)] font-sans">Нууцлалын бодлого (Privacy Policy)</h3>
              </div>
              <button 
                onClick={() => setShowPrivacy(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--fg)] transition-colors cursor-pointer p-1 rounded-lg hover:bg-[var(--bg2)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-5 text-xs text-[var(--fg)] leading-relaxed font-sans">
              <div className="bg-[rgba(31,138,76,0.08)] border border-[rgba(31,138,76,0.3)] p-4 rounded-md space-y-1.5">
                <p className="font-bold text-[var(--verify)] text-sm">Хувь хүний мэдээллийн аюулгүй байдал</p>
                <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                  Энэхүү нууцлалын бодлого нь Монгол Улсын Хувь хүний мэдээлэл хамгаалах тухай хуульд бүрэн нийцсэн бөгөөд таны хувийн мэдээллийг цуглуулах, боловсруулах, хамгаалахад баримтлах үндсэн зарчмыг тодорхойлно.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[var(--fg)] text-sm">1. Цуглуулах мэдээлэл</h4>
                <p>1.1. Бид хэрэглэгчийн үйлчилгээ авах зорилгоор оруулсан дараах мэдээллүүдийг цуглуулна: Овог нэр / Компанийн нэр, утасны дугаар, хаяг байршил, мэргэшсэн техникийн төрөл, ажлын түүх болон танилцуулга намтар (bio).</p>
                <p>1.2. Нэвтрэх нууц кодыг систем шифрлэн (encrypted) хадгалах бөгөөд ямар ч администратор, гуравдагч этгээд харах боломжгүйгээр хамгаалагдсан болно.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[var(--fg)] text-sm">2. Мэдээллийн ашиглалт ба Зорилго</h4>
                <p>2.1. Таны оруулсан мэдээллийг зөвхөн ажил олгогч болон операторыг холбох, үнэлгээ өгөх, системийн найдвартай ажиллагааг хангахад ашиглана.</p>
                <p className="text-[var(--fg)] font-semibold">2.2. Систем нь хэрэглэгчийн утасны дугаар болон бусад хувийн мэдээллийг зар сурталчилгаанд худалдах, бусдад зөвшөөрөлгүйгээр шилжүүлэхийг хатуу хориглоно.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[var(--fg)] text-sm">3. Хэрэглэгчийн эрх болон Профайл нууцлал</h4>
                <p>3.1. Хэрэглэгч өөрийн профайлыг бусдад харагдуулахгүй байх (isPublic тохиргоо) эрхтэй.</p>
                <p>3.2. Хэрэглэгч өөрийн мэдээллийг хэдийд ч засах, системээс өөрийн бүртгэлийг бүрэн устгах (Аюулгүй байдлын цэсээр) эрхтэй.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[var(--fg)] text-sm">4. Мэдээллийн аюулгүй байдал</h4>
                <p>4.1. Систем нь таны мэдээллийг хамгаалах сүүлийн үеийн SSL шифрлэлт болон аюулгүй байдлын стандартыг ашиглаж байна.</p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="border-t border-[var(--color-glass-border)] px-6 py-4 flex justify-end bg-[var(--bg2)]">
              <button 
                onClick={() => setShowPrivacy(false)}
                className="bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] font-bold px-5 py-2 rounded transition-all cursor-pointer text-xs font-sans"
              >
                Ойлголоо, хүлээн зөвшөөрөв
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}

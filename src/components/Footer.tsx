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
    <footer id="footer-section" className="bg-[#111827] text-gray-400 border-t border-gray-800 text-sm py-12 px-6 relative">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center space-x-2 text-white font-semibold mb-4 text-base">
            <div className="w-8 h-8 rounded-lg bg-[#080d1a] border border-emerald-500/20 flex items-center justify-center relative overflow-hidden shrink-0 shadow-md">
              <svg className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                {/* Caterpillar Track base */}
                <rect x="6" y="46" width="36" height="8" rx="4" fill="currentColor" fillOpacity="0.1" />
                <line x1="12" y1="50" x2="36" y2="50" strokeWidth="2" strokeDasharray="4 3" />
                <circle cx="11" cy="50" r="2" fill="currentColor" />
                <circle cx="24" cy="50" r="2" fill="currentColor" />
                <circle cx="37" cy="50" r="2" fill="currentColor" />
                
                {/* Rotating Cabin base structure */}
                <path d="M10 40h28v6H10z" fill="currentColor" fillOpacity="0.2" />
                <path d="M14 26h18v14H14z" fill="currentColor" fillOpacity="0.1" />
                <path d="M16 26h10l4 8H14l2-8z" />
                
                {/* Boom (Main arm) - extending up and right */}
                <path d="M28 34 L44 14" strokeWidth="4.5" className="text-cyan-400" />
                
                {/* Dipper / Stick (Outer arm) - pivoting down from boom tip */}
                <path d="M44 14 L52 30" strokeWidth="3.5" className="text-amber-400" />
                
                {/* Bucket / Scoop - pivoting at the end of the stick */}
                <path d="M52 30 L46 36 L39 33 Z" fill="currentColor" fillOpacity="0.3" strokeWidth="2.5" className="text-amber-500" />
                
                {/* Joint Pins */}
                <circle cx="28" cy="34" r="2" className="fill-white stroke-none" />
                <circle cx="44" cy="14" r="2" className="fill-white stroke-none" />
                <circle cx="52" cy="30" r="2" className="fill-white stroke-none" />
                
                {/* Hydraulic lines */}
                <path d="M26 30 Q36 22 41 16" stroke="currentColor" strokeWidth="1" opacity="0.6" />
              </svg>
            </div>
            <span className="tracking-tight font-sans text-neon-emerald">Хүнд машин, механизм & Газар шорооны ажлын сайт</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-4 font-sans">
            Хүнд машин, механизм, газар шороо, барилга угсралт болон түрээсийн салбарт ажиллаж буй хариуцлагатай жолооч, оператор болон найдвартай ажил олгогчдыг нэгтгэсэн ажлын түүх, тоон үнэлгээний систем. Бид салбарын хэмжээнд залилан болон хариуцлагагүй байдлыг арилгаж, итгэлцэл дээр суурилсан хамтын ажиллагааны орчныг бүрдүүлэх зорилготой.
          </p>
        </div>

        <div>
          <h4 className="text-white font-medium mb-4 text-sm font-sans">Аюулгүй байдлын зөвлөгөө</h4>
          <ul className="space-y-3 text-xs text-gray-500 leading-relaxed font-sans">
            <li><strong>1. Үнэлгээ & Түүх нягтлах:</strong> Ажил олгогч эсвэл жолооч, оператортой холбогдохоос өмнө тэдгээрийн ажлын түүх, өмнөх үнэлгээнүүдийг системээс заавал шалгаж хэвшинэ үү.</li>
            <li><strong>2. Тоон үнэлгээ өгөх:</strong> Залилан болон ажлын хариуцлагагүй байдлаас сэргийлэх зорилгоор ажлын гүйцэтгэлийн дараа нөгөө талдаа 1-ээс 5 хүртэлх тоогоор бодит үнэлгээг заавал үлдээнэ үү.</li>
            <li><strong>3. Тохиролцоог баталгаажуулах:</strong> Санхүүгийн болон цалин хөлсний нөхцөл, техникийн бэлэн байдал зэргийг хамтын ажиллагаа эхлэхээс өмнө хоёр талдаа тодорхой тохирч, баталгаажуулна уу.</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-medium mb-4 text-sm font-sans">Холбоо барих</h4>
          <ul className="space-y-2.5 text-xs font-sans">
            <li className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Ekhyondoo@gmail.com</span>
            </li>
            <li className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>+976 99106339 (Даваа - Баасан)</span>
            </li>
            <li className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Улаанбаатар хот, Сүхбаатар дүүрэг, 1-р хороо</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-gray-800 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 font-sans">
        <p>© {new Date().getFullYear()} Хүнд машин, механизм & Газар шорооны ажлын сайт. Бүх эрх хуулиар хамгаалагдсан.</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <span 
            onClick={() => setShowTerms(true)}
            className="hover:text-white cursor-pointer transition-colors"
          >
            Үйлчилгээний нөхцөл
          </span>
          <span 
            onClick={() => setShowPrivacy(true)}
            className="hover:text-white cursor-pointer transition-colors"
          >
            Нууцлалын бодлого
          </span>
          <span className="text-gray-600">Хувилбар 1.2.0</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TERMS OF SERVICE MODAL (Монгол Улсын стандартын дагуу) */}
      {/* ============================================================== */}
      {showTerms && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative">
            {/* Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center space-x-2.5">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white font-sans">Үйлчилгээний нөхцөл (Terms of Service)</h3>
              </div>
              <button 
                onClick={() => setShowTerms(false)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-5 text-xs text-gray-300 leading-relaxed font-sans">
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl space-y-1.5">
                <p className="font-bold text-emerald-400 text-sm">Хэрэглэгчийн аюулгүй байдлын баталгаа</p>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Энэхүү үйлчилгээний нөхцөл нь Монгол Улсын Иргэний хууль, Хэрэглэгчийн эрхийг хамгаалах тухай хууль болон бусад холбогдох хууль тогтоомжийн дагуу боловсруулагдсан болно.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">1. Ерөнхий нөхцөл</h4>
                <p>1.1. Энэхүү платформ нь хүнд машин механизм, газар шорооны ажлын чиглэлээр ажиллаж буй жолооч, оператор болон ажил олгогч нарыг холбох, ажлын түүх, үнэлгээгээр баталгаажсан найдвартай хамтын ажиллагааг үүсгэх зорилготой.</p>
                <p>1.2. Хэрэглэгч системд бүртгүүлснээр энэхүү үйлчилгээний нөхцөлийг бүрэн хүлээн зөвшөөрсөнд тооцогдоно.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">2. Хэрэглэгчийн хариуцлага ба Үнэлгээний систем</h4>
                <p>2.1. Хэрэглэгч өөрийн бүртгэлийн мэдээлэл (нэр, утас, хаяг г.м)-ийн үнэн зөв байдлыг бүрэн хариуцна.</p>
                <p>2.2. Жолооч болон ажил олгогч нар ажлын гүйцэтгэлийн дараа нөгөө талдаа бодитой, үнэн зөв үнэлгээ өгөх үүрэгтэй.</p>
                <p className="text-amber-400 font-semibold">2.3. Ажлын хариуцлага алдаж шалтгаангүй ажил хаясан, техникт санаатай хохирол учруулсан, ажлын байранд архидан согтуурсан, цалин хөлс олгоогүй гэх мэт ноцтой зөрчил гаргасан тохиолдолд хэрэглэгчийн мэдээллийг хар дансанд бүртгэж, цаашид системийг ашиглах болон дахин үйлчилгээ авах боломжгүй болох эрсдэлтэйг анхаарна уу.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">3. Платформын хариуцлагын хязгаарлалт</h4>
                <p>3.1. Платформ нь мэдээлэл дамжуулах, зуучлах, баталгаажуулах үүргийг гүйцэтгэх бөгөөд талуудын хоорондох хөдөлмөрийн болон санхүүгийн шууд маргааныг хариуцахгүй. Гэвч маргаан гарсан тохиолдолд ажлын түүх болон үнэлгээний мэдээллээр дэмжлэг үзүүлнэ.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">4. Үйлчилгээний нөхцөлийн өөрчлөлт</h4>
                <p>4.1. Үйлчилгээний нөхцөл шинэчлэгдэх бүрт хэрэглэгчдэд нээлттэй мэдээлэгдэх бөгөөд үйлчилгээг үргэлжлүүлэн ашиглах нь шинэ нөхцөлийг зөвшөөрсөнд тооцогдоно.</p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="border-t border-slate-800 px-6 py-4 flex justify-end bg-slate-950/40">
              <button 
                onClick={() => setShowTerms(false)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2 rounded-xl transition-all cursor-pointer text-xs font-sans"
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative">
            {/* Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center space-x-2.5">
                <Lock className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-sans">Нууцлалын бодлого (Privacy Policy)</h3>
              </div>
              <button 
                onClick={() => setShowPrivacy(false)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-5 text-xs text-gray-300 leading-relaxed font-sans">
              <div className="bg-cyan-500/5 border border-cyan-500/20 p-4 rounded-xl space-y-1.5">
                <p className="font-bold text-cyan-400 text-sm">Хувь хүний мэдээллийн аюулгүй байдал</p>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Энэхүү нууцлалын бодлого нь Монгол Улсын Хувь хүний мэдээлэл хамгаалах тухай хуульд бүрэн нийцсэн бөгөөд таны хувийн мэдээллийг цуглуулах, боловсруулах, хамгаалахад баримтлах үндсэн зарчмыг тодорхойлно.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">1. Цуглуулах мэдээлэл</h4>
                <p>1.1. Бид хэрэглэгчийн үйлчилгээ авах зорилгоор оруулсан дараах мэдээллүүдийг цуглуулна: Овог нэр / Компанийн нэр, утасны дугаар, хаяг байршил, мэргэшсэн техникийн төрөл, ажлын түүх болон танилцуулга намтар (bio).</p>
                <p>1.2. Нэвтрэх нууц кодыг систем шифрлэн (encrypted) хадгалах бөгөөд ямар ч администратор, гуравдагч этгээд харах боломжгүйгээр хамгаалагдсан болно.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">2. Мэдээллийн ашиглалт ба Зорилго</h4>
                <p>2.1. Таны оруулсан мэдээллийг зөвхөн ажил олгогч болон операторыг холбох, үнэлгээ өгөх, системийн найдвартай ажиллагааг хангахад ашиглана.</p>
                <p className="text-emerald-400">2.2. Систем нь хэрэглэгчийн утасны дугаар болон бусад хувийн мэдээллийг зар сурталчилгаанд худалдах, бусдад зөвшөөрөлгүйгээр шилжүүлэхийг хатуу хориглоно.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">3. Хэрэглэгчийн эрх болон Профайл нууцлал</h4>
                <p>3.1. Хэрэглэгч өөрийн профайлыг бусдад харагдуулахгүй байх (isPublic тохиргоо) эрхтэй.</p>
                <p>3.2. Хэрэглэгч өөрийн мэдээллийг хэдийд ч засах, системээс өөрийн бүртгэлийг бүрэн устгах (Аюулгүй байдлын цэсээр) эрхтэй.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">4. Мэдээллийн аюулгүй байдал</h4>
                <p>4.1. Систем нь таны мэдээллийг хамгаалах сүүлийн үеийн SSL шифрлэлт болон аюулгүй байдлын стандартыг ашиглаж байна.</p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="border-t border-slate-800 px-6 py-4 flex justify-end bg-slate-950/40">
              <button 
                onClick={() => setShowPrivacy(false)}
                className="bg-cyan-600 hover:bg-cyan-550 text-white font-semibold px-5 py-2 rounded-xl transition-all cursor-pointer text-xs font-sans"
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

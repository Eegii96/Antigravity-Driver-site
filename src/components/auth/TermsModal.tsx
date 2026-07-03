'use client';

import { FileText, X } from 'lucide-react';

interface TermsModalProps {
  onClose: () => void;
}

/** Terms of Service modal (static content). Render conditionally by the parent. */
export default function TermsModal({ onClose }: TermsModalProps) {
  return (
        <div 
          onClick={() => onClose()}
          className="fixed inset-0 bg-[var(--bg2)] flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in text-left"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--card)] border border-[var(--border)] rounded-md max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-md relative"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[var(--card)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center space-x-2.5">
                <FileText className="w-5 h-5 text-[var(--accent-soft-foreground)]" />
                <h3 className="text-sm font-bold text-[var(--fg)] font-sans">Үйлчилгээний нөхцөл (Terms of Service)</h3>
              </div>
              <button
                onClick={() => onClose()}
                className="text-[var(--muted-foreground)] hover:text-[var(--fg)] transition-colors cursor-pointer p-1 rounded-lg hover:bg-[var(--bg2)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 text-xs text-[var(--muted-foreground)] leading-relaxed font-sans">
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
                <p className="text-red-700 font-semibold">2.3. Ажлын хариуцлага алдаж шалтгаангүй ажил хаясан, техникт санаатай хохирол учруулсан, ажлын байранд архидан согтуурсан, цалин хөлс олгоогүй гэх мэт ноцтой зөрчил гаргасан тохиолдолд хэрэглэгчийн мэдээллийг хар дансанд бүртгэж, цаашид системийг ашиглах болон дахин үйлчилгээ авах боломжгүй болох эрсдэлтэйг анхаарна уу.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[var(--fg)] text-sm">3. Платформын хариуцлагын хязгаарлалт</h4>
                <p>3.1. Платформ нь мэдээлэл дамжуулах, зуучлах, баталгаажуулах үүргийг гүйцэтгэх бөгөөд талуудын хоорондох хөдөлмөрийн болон санхүүгийн шууд маргааныг хариуцахгүй. Гэвч маргаан гарсан тохиобдолд ажлын түүх болон үнэлгээний мэдээллээр дэмжлэг үзүүлнэ.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[var(--fg)] text-sm">4. Үйлчилгээний нөхцөлийн өөрчлөлт</h4>
                <p>4.1. Үйлчилгээний нөхцөл шинэчлэгдэх бүрт хэрэглэгчдэд нээлттэй мэдээлэгдэх бөгөөд үйлчилгээг үргэлжлүүлэн ашиглах нь шинэ нөхцөлийг зөвшөөрсөнд тооцогдоно.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--border)] px-6 py-4 flex justify-end bg-[var(--card)]">
              <button
                onClick={() => onClose()}
                className="bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] font-semibold px-5 py-2 rounded-md transition-all cursor-pointer text-xs font-sans"
              >
                Ойлголоо, зөвшөөрөв
              </button>
            </div>
          </div>
        </div>
  );
}

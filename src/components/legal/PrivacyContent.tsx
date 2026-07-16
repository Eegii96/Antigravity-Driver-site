/**
 * Canonical Privacy-Policy copy — the SINGLE source rendered by both the
 * /privacy page and the auth PrivacyModal. Edit legal text here only.
 */
export default function PrivacyContent() {
  return (
    <div className="space-y-5 text-sm text-[var(--fg)] leading-relaxed font-sans text-left">
      <div className="bg-[rgba(35,121,82,0.08)] p-4 rounded-xl space-y-1.5">
        <p className="font-bold text-[var(--verify)] text-sm">Хувь хүний мэдээллийн аюулгүй байдал</p>
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
          Энэхүү нууцлалын бодлого нь Монгол Улсын Хувь хүний мэдээлэл хамгаалах тухай хуульд бүрэн нийцсэн бөгөөд таны хувийн мэдээллийг цуглуулах, боловсруулах, хамгаалахад баримтлах үндсэн зарчмыг тодорхойлно.
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="font-bold text-[var(--fg)] text-[15px]">1. Цуглуулах мэдээлэл</h2>
        <p>1.1. Бид хэрэглэгчийн үйлчилгээ авах зорилгоор оруулсан дараах мэдээллүүдийг цуглуулна: Овог нэр / Компанийн нэр, утасны дугаар, хаяг байршил, мэргэшсэн техникийн төрөл, ажлын түүх болон танилцуулга намтар (bio).</p>
        <p>1.2. Нэвтрэх нууц кодыг систем шифрлэн (encrypted) хадгалах бөгөөд ямар ч администратор, гуравдагч этгээд харах боломжгүйгээр хамгаалагдсан болно.</p>
      </div>

      <div className="space-y-2">
        <h2 className="font-bold text-[var(--fg)] text-[15px]">2. Мэдээллийн ашиглалт ба зорилго</h2>
        <p>2.1. Таны оруулсан мэдээллийг зөвхөн ажил олгогч болон операторыг холбох, үнэлгээ өгөх, системийн найдвартай ажиллагааг хангахад ашиглана.</p>
        <p className="text-[var(--fg)] font-semibold">2.2. Систем нь хэрэглэгчийн утасны дугаар болон бусад хувийн мэдээллийг зар сурталчилгаанд худалдах, бусдад зөвшөөрөлгүйгээр шилжүүлэхийг хатуу хориглоно.</p>
      </div>

      <div className="space-y-2">
        <h2 className="font-bold text-[var(--fg)] text-[15px]">3. Хэрэглэгчийн эрх болон профайл нууцлал</h2>
        <p>3.1. Хэрэглэгч өөрийн профайлыг бусдад харагдуулахгүй байх (isPublic тохиргоо) эрхтэй.</p>
        <p>3.2. Хэрэглэгч өөрийн мэдээллийг хэдийд ч засах, системээс өөрийн бүртгэлийг бүрэн устгах (Аюулгүй байдлын цэсээр) эрхтэй.</p>
      </div>

      <div className="space-y-2">
        <h2 className="font-bold text-[var(--fg)] text-[15px]">4. Мэдээллийн аюулгүй байдал</h2>
        <p>4.1. Систем нь таны мэдээллийг хамгаалах сүүлийн үеийн SSL шифрлэлт болон аюулгүй байдлын стандартыг ашиглаж байна.</p>
      </div>
    </div>
  );
}

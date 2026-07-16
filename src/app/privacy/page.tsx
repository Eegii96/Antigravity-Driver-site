import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import PrivacyContent from '../../components/legal/PrivacyContent';

export const metadata: Metadata = {
  title: 'Нууцлалын бодлого',
  description:
    'Жолооч Монголиа платформын нууцлалын бодлого — хувийн мэдээлэл цуглуулах, ашиглах, хамгаалах зарчим болон хэрэглэгчийн эрх.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div className="flex-grow bg-[var(--bg)] text-[var(--fg)] font-sans">
      <div className="max-w-2xl mx-auto w-full px-4 md:px-6 py-10 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold min-h-11 bg-[var(--card)] hover:bg-[var(--bg2)] text-[var(--fg)] border border-[var(--border)] hover:border-[var(--border-strong)] px-4 rounded-full transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Нүүр хуудас</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <Lock className="w-6 h-6 text-[var(--verify)]" aria-hidden="true" />
          <h1 className="text-[26px] md:text-[30px] font-display font-bold tracking-tight text-[var(--fg)]">
            Нууцлалын бодлого
          </h1>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 md:p-8 shadow-sm">
          <PrivacyContent />
        </div>
      </div>
    </div>
  );
}

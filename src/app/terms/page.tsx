import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import TermsContent from '../../components/legal/TermsContent';

export const metadata: Metadata = {
  title: 'Үйлчилгээний нөхцөл',
  description:
    'Жолооч Монголиа платформын үйлчилгээний нөхцөл — хэрэглэгчийн хариуцлага, үнэлгээний систем, хар данс болон платформын хариуцлагын хязгаарлалт.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
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
          <FileText className="w-6 h-6 text-[var(--accent-soft-foreground)]" aria-hidden="true" />
          <h1 className="text-[26px] md:text-[30px] font-display font-bold tracking-tight text-[var(--fg)]">
            Үйлчилгээний нөхцөл
          </h1>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 md:p-8 shadow-sm">
          <TermsContent />
        </div>
      </div>
    </div>
  );
}

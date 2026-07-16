'use client';

import { Lock, X } from 'lucide-react';
import PrivacyContent from '../legal/PrivacyContent';

interface PrivacyModalProps {
  onClose: () => void;
}

/**
 * Privacy Policy modal — renders the shared canonical copy from
 * `components/legal/PrivacyContent.tsx` (same source as the /privacy page).
 * Render conditionally by the parent.
 */
export default function PrivacyModal({ onClose }: PrivacyModalProps) {
  return (
        <div
          onClick={() => onClose()}
          className="fixed inset-0 bg-[var(--fg)]/40 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in text-left"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--card)] border border-[var(--border-strong)] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto overscroll-contain shadow-md relative"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[var(--card)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center space-x-2.5">
                <Lock className="w-5 h-5 text-[var(--verify)]" />
                <h3 className="text-sm font-bold text-[var(--fg)] font-sans">Нууцлалын бодлого (Privacy Policy)</h3>
              </div>
              <button
                onClick={() => onClose()}
                aria-label="Хаах"
                className="min-w-11 min-h-11 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--fg)] transition-colors cursor-pointer rounded-full hover:bg-[var(--bg2)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <PrivacyContent />
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--border)] px-6 py-4 flex justify-end bg-[var(--card)]">
              <button
                onClick={() => onClose()}
                className="bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] font-semibold px-6 min-h-11 rounded-full transition-all cursor-pointer text-sm font-sans"
              >
                Ойлголоо, хүлээн зөвшөөрөв
              </button>
            </div>
          </div>
        </div>
  );
}

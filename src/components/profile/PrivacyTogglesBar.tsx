'use client';

import type { User } from '../../types';

type VisibilityField = 'emailVisible' | 'phoneVisible' | 'historyVisible' | 'reviewsVisible';

interface PrivacyTogglesBarProps {
  profileUser: User;
  onToggle: (field: VisibilityField) => void;
}

const TOGGLES: { field: VisibilityField; label: string }[] = [
  { field: 'emailVisible', label: 'Имэйл' },
  { field: 'phoneVisible', label: 'Утас' },
  { field: 'historyVisible', label: 'Ажлын түүх' },
  { field: 'reviewsVisible', label: 'Сэтгэгдэл' },
];

/**
 * Granular privacy toggles for the owner's own profile (email/phone/history/
 * reviews visibility). A field counts as visible unless explicitly `false`.
 */
export default function PrivacyTogglesBar({ profileUser, onToggle }: PrivacyTogglesBarProps) {
  return (
    <div className="bg-[var(--color-glass-bg)] p-4 rounded-md border border-[var(--color-glass-border)] flex flex-wrap gap-4 items-center justify-between text-xs w-full">
      <div className="text-[var(--muted-foreground)] font-bold uppercase tracking-wider text-[10px]">
        Нууцлалын Тохиргоо (Хүмүүст харагдуулах):
      </div>
      <div className="flex flex-wrap gap-4">
        {TOGGLES.map(({ field, label }) => {
          const on = profileUser[field] !== false;
          return (
            <div key={field} className="flex items-center space-x-2">
              <span className="text-[11px] text-[var(--muted-foreground)] font-medium">{label}:</span>
              <button
                type="button"
                onClick={() => onToggle(field)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                  on ? 'bg-[var(--accent)]' : 'bg-[var(--bg2)]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out mt-0.5 ml-0.5 ${
                    on ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

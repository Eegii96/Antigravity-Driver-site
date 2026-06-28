#!/usr/bin/env bash
# One-shot Hi-vis Industrial color migration for a single file.
# Maps retired Glass-Premium-Violet dark-theme classes to canonical tokens.
# Opacity-suffixed variants are handled BEFORE plain ones so we never emit
# a broken "[var(--token)]/NN" class. Run: hivis-migrate.sh <file>
set -euo pipefail
f="$1"

sed -E -i \
  -e 's/ backdrop-blur-(sm|md|lg|xl|2xl|3xl)//g' \
  -e 's/text-\[#f1f3f8\]/text-[var(--fg)]/g' \
  -e 's/text-\[#e3e6ee\]/text-[var(--fg)]/g' \
  -e 's/text-\[#c8cbe0\]/text-[var(--fg)]/g' \
  -e 's/text-\[#c4b5fd\]/text-[var(--accent-soft-foreground)]/g' \
  -e 's/text-\[#9aa3b5\]/text-[var(--muted-foreground)]/g' \
  -e 's/placeholder-\[#9aa3b5\]/placeholder-[var(--muted-foreground)]/g' \
  -e 's#bg-\[var\(--color-brand-bg2\)\]#bg-[var(--card)]#g' \
  -e 's#bg-\[var\(--color-brand-bg\)\]#bg-[var(--bg)]#g' \
  -e 's#hover:bg-white/\[0\.06\]#hover:bg-[var(--bg2)]#g' \
  -e 's#hover:bg-white/20#hover:bg-[var(--border)]#g' \
  -e 's#hover:bg-white/10#hover:bg-[var(--bg2)]#g' \
  -e 's#bg-white/\[0\.06\]#bg-[var(--bg2)]#g' \
  -e 's#bg-white/10#bg-[var(--bg2)]#g' \
  -e 's#bg-white/5#bg-[var(--bg2)]#g' \
  -e 's#hover:border-white/20#hover:border-[var(--border-strong)]#g' \
  -e 's#border-white/10#border-[var(--border)]#g' \
  -e 's#border-white/20#border-[var(--border)]#g' \
  -e 's#hover:bg-violet-[0-9]+(/[0-9]+)?#hover:brightness-95#g' \
  -e 's#(bg)-violet-[0-9]+/[0-9]+#bg-[var(--accent-soft)]#g' \
  -e 's#(bg)-violet-[0-9]+#bg-[var(--accent)]#g' \
  -e 's#(text)-violet-[0-9]+(/[0-9]+)?#text-[var(--accent-soft-foreground)]#g' \
  -e 's#(fill|stroke)-violet-[0-9]+(/[0-9]+)?#\1-[var(--accent)]#g' \
  -e 's#(border|ring|divide|from|to|via)-violet-[0-9]+(/[0-9]+)?#\1-[var(--accent)]#g' \
  -e 's#shadow-violet-[0-9]+(/[0-9]+)?##g' \
  -e 's#hover:bg-(teal|cyan|sky|emerald)-[0-9]+(/[0-9]+)?#hover:brightness-95#g' \
  -e 's#(bg)-(teal|cyan|sky|emerald)-[0-9]+/[0-9]+#bg-[rgba(31,138,76,0.1)]#g' \
  -e 's#(bg)-(teal|cyan|sky|emerald)-[0-9]+#bg-[var(--verify)]#g' \
  -e 's#(text|fill|stroke)-(teal|cyan|sky|emerald)-[0-9]+(/[0-9]+)?#\1-[var(--verify)]#g' \
  -e 's#(border|ring|divide|from|to|via)-(teal|cyan|sky|emerald)-[0-9]+(/[0-9]+)?#\1-[var(--verify)]#g' \
  -e 's#hover:bg-amber-[0-9]+(/[0-9]+)?#hover:brightness-95#g' \
  -e 's#(bg)-amber-[0-9]+/[0-9]+#bg-[rgba(255,92,40,0.1)]#g' \
  -e 's#(bg)-amber-[0-9]+#bg-[var(--alert)]#g' \
  -e 's#(text|fill|stroke)-amber-[0-9]+(/[0-9]+)?#\1-[var(--alert)]#g' \
  -e 's#(border|ring|divide|from|to|via)-amber-[0-9]+(/[0-9]+)?#\1-[var(--alert)]#g' \
  -e 's#(text)-slate-200#text-[var(--fg)]#g' \
  -e 's#(text)-slate-[0-9]+#text-[var(--muted-foreground)]#g' \
  -e 's#(placeholder)-slate-[0-9]+#placeholder-[var(--muted-foreground)]#g' \
  -e 's#(border|ring|divide)-slate-[0-9]+(/[0-9]+)?#\1-[var(--border)]#g' \
  -e 's#(bg)-slate-[0-9]+(/[0-9]+)?#bg-[var(--bg2)]#g' \
  -e 's#text-white\b#text-[var(--accent-foreground)]#g' \
  "$f"
echo "migrated: $f"

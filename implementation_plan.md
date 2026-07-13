# Redesign: "Calm Professional" design system (2026-07-13)

Product-owner decision: Hi-vis Industrial is retired. New visual language modeled on the
owner's reference (smilifye.webflow.io — warm, soft, premium service-marketplace look),
generated with the `ui-ux-pro-max` skill (Marketplace/Directory pattern, professional
trust palette) and adapted for Mongolian Cyrillic + 30–50 y.o. mobile audience.

## Design language

- **Mood**: calm, trustworthy, premium service marketplace. Warm paper background,
  solid white cards, ONE dark ink brand color used for primary CTAs, soft sage tint
  for highlights, generous whitespace, big friendly headings in sentence case
  (NO uppercase/condensed "nameplate" styling), pill-shaped buttons.
- **Fonts** (all Cyrillic subsets, via next/font): display = **Manrope** (600–800),
  body = **Inter**, numbers keep Geist Mono only where already used (phones).
- **Radii**: cards/panels `rounded-2xl` (16px), inputs `rounded-xl`, buttons & chips
  `rounded-full` (pills), images `rounded-xl`, big brand bands `rounded-3xl` (inset).
- **Type scale (mobile-first)**: body/descriptions 15–16px, card titles 17–18px,
  section headings 26–32px, hero 34–52px, meta 13–14px, tiny labels 12px minimum.

## Tokens (globals.css — same variable names, new values)

| Token | Value | Role |
|---|---|---|
| --bg | #FAF9F6 | warm paper page bg |
| --bg2 | #F1EFE9 | cream alternating section |
| --card | #FFFFFF | cards/panels |
| --border | #E8E5DD | hairline |
| --border-strong | #D9D5CB | emphasis border (soft) |
| --fg | #172629 | deep teal-ink text + dark bands |
| --muted-foreground | #5C6763 | secondary text |
| --concrete | #A6ACA7 | decorative only |
| --accent | #172629 | PRIMARY CTA fill (ink pill) |
| --accent-foreground | #FFFFFF | text on accent |
| --accent-soft | #EAF0EC | sage tint chip/badge bg |
| --accent-soft-foreground | #33604C | text on sage |
| --verify | #237952 | success/salary/completed |
| --alert | #BC4F24 | terracotta attention |
| --tint | #8FB3BE | steel-blue heading highlight (on dark) |

Status semantics: open = NO badge on collapsed cards (default state); sage chip in
expanded view; in-progress / needs-review = terracotta chip; completed+reviewed =
green chip. No pulsing dots.

## Scope (phase 1 — this change)

1. `layout.tsx` — Manrope replaces Oswald (`--font-manrope`).
2. `globals.css` — token overhaul, panel radius, hazard-stripe deleted.
3. `BoardHero.tsx` — rewritten: ink band, sentence-case Manrope, white pill CTA with
   arrow circle, stats row, soft trust cards. No hazard stripe / watermark / yellow.
4. `JobBoard.tsx` — quiet top notice, softened header (pill CTAs), sentence-case
   section headings, pill filter chips, rounded-2xl search panel with 16px input,
   pill tabs/buttons, emoji cleanup.
5. `JobCard.tsx` — rounded-2xl cards, 15px body text (was 12px), placeholder
   description ("Нэмэлт мэдээлэл оруулаагүй.") hidden, badge noise removed, pill
   action buttons, share menu emojis → Lucide icons. Guest blur logic UNCHANGED (§2).
6. `BoardInfoSections.tsx` — sage tag chips, sentence-case headings, rounded-2xl
   cards, FAQ plus-toggle, closing CTA as inset rounded-3xl ink card.
7. `Footer.tsx` — inherits tokens; minor pill/radius polish.
8. AGENTS.md §4 updated with this system as canonical.

Phase 2 (next): JobDetailClient, Auth, ProfileView, SettingsView, modals — they
already consume the same tokens so the palette carries automatically; typography
and radius polish to follow.

## Rules honored

- Masonry board structure untouched (AGENTS.md §5), guest blur logic untouched (§2),
  auth flows untouched (§1). `npm run build` must pass before finishing (§6).

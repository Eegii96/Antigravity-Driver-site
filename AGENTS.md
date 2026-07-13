<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Jolooch.net — AI Agent Development Guidelines (Алтан Дүрмүүд)

This file contains **strict, machine-readable architectural and business logic rules** for Jolooch.net.
Any AI agent (Antigravity, Claude Code, Gemini CLI, etc.) modifying this repository **MUST follow every rule below without exception**, before writing a single line of code.

---

## 0. Before You Write Any Code — Mandatory Pre-Flight Checklist

> [!IMPORTANT]
> Complete ALL of the following steps before touching source files:
> 1. Read `AGENTS.md` in full (this file).
> 2. Read `src/types.ts` — know every interface and their exact field names and types.
> 3. Read `src/context/AuthContext.tsx` — understand the auth state lifecycle.
> 4. Read the relevant component/page you are modifying.
> 5. After editing, run `npm run build` and fix ALL TypeScript errors before finishing.

---

## 1. Authentication & Session Management

- **Single Source of Truth**: Every client component and page MUST read user session state exclusively from `useAuth()` imported from `@/context/AuthContext` (alias) or the relative path `../../context/AuthContext`.
- **No Direct localStorage for Session State**: Never call `localStorage.getItem('currentUser')` inside React components or pages to check if a user is logged in. The only legitimate use of `localStorage` for the current user is inside `src/lib/db.ts` — the `getCurrentUser()` and `setCurrentUser()` utility functions — which are already called by `AuthContext` internally.
- **Logout Execution**: The sign-out flow MUST call the `logout()` function from `useAuth()`. It internally runs Firebase `signOut(auth)` and clears all session state. Never call `signOut(auth)` directly from a component.
- **Auth Loading State**: Always check `loading` from `useAuth()` before rendering auth-gated UI. Show a spinner or skeleton while `loading === true`.
- **Single Session Policy (Concurrent Login Prevention)**: The application enforces a strict single-session policy. When a user logs in (or registers), a unique `activeSessionId` is generated, saved in `localStorage`, and updated in Firestore. The `AuthContext` listens to the user's Firestore document in real-time. If the `activeSessionId` in Firestore changes and does not match the local `activeSessionId`, the user must be signed out immediately and redirected to `/auth` with a notification.

---

## 2. Guest Privacy Protection (Blur Logic)

- **Guest Detection**: `currentUser === null` means the visitor is a guest (not logged in).
- **Employer Name Blur**: In all job card views, if `currentUser` is `null`, render the employer name using `getMockEmployerName(job.id)` in the DOM (never the real name), and apply `filter blur-[5px] select-none cursor-pointer`.
- **Phone Number Blur**: Same rule. If guest, render `getMockEmployerPhone(job.id)` and blur with `filter blur-[5px] select-none`.
- **Click on Blurred Elements**: Must call `e.stopPropagation()` and `setShowBlurWarningModal(true)` — never expand the card or navigate.
- **Data Safety Rule**: Real employer names and phone numbers must NEVER appear in the DOM for unauthenticated users. Only mock data is safe to render for guests.

---

## 3. Type System — Know Before You Code

The canonical source of truth for all data types is `src/types.ts`. Key rules:

- **`Job.status`** is typed as `'open' | 'in_progress' | 'completed'`. The value `'closed'` does NOT exist. Use `'completed'` for finished jobs.
- **Direct Completion on Hiring**: When hiring/selecting an operator, the job status must directly transition from `'open'` to `'completed'`, bypassing the `'in_progress'` status.
- **Cancel Selection (Deselection)**: To revert a selected operator, the job status must transition back from `'completed'` to `'open'`, clearing all hired operator details and deleting any associated `jobHistory` records.
- **Tabbed Partitioning**: On the main job board, open and completed jobs must be strictly partitioned into separate filter tabs (`Нийт зар` and `Дууссан зар`) to prevent confusion.
- **`Job.applicants`** is `string[]` — an array of operator User IDs.
- **`Job.hiredOperatorId`** is `string | undefined` — the ID of the hired operator.
- **`Job.isReviewedByEmployer`** and **`Job.isReviewedByOperator`** are `boolean | undefined`.
- **`User.type`** is `'operator' | 'employer'` only.
- Never use `(job as any)` to bypass types. If a property is missing from `Job`, add it to `src/types.ts` first.

---

## 4. Design, Styling & Mongolian Grammar Rules

### Design System: "Calm Professional" — CANONICAL (2026-07-13)

> [!IMPORTANT]
> The former **"Hi-vis Industrial"** system (and the earlier "Glass Premium Violet") is **RETIRED** by product-owner decision (2026-07-13). The canonical system is now **"Calm Professional"**, built from the product owner's reference (smilifye.webflow.io — warm premium service-marketplace look) with the `ui-ux-pro-max` skill. Phase 1 (tokens, fonts, homepage: hero, board, cards, info sections) shipped 2026-07-13; remaining pages (JobDetailClient, Auth, ProfileView, SettingsView, modals) inherit the tokens automatically and get typography/radius polish in phase 2.

**Calm Professional rules (canonical):**

- **Mood**: calm, trustworthy, premium marketplace. Warm paper background, solid white cards, ONE deep teal-ink brand color, sage tint highlights, generous whitespace. NO industrial styling: no hazard stripes, no condensed/uppercase display type, no hi-vis yellow, no pulsing dots, no emoji in UI (Lucide icons only).
- **Tokens** (values live in `globals.css`; consume via `var(--...)` only): `--bg` #FAF9F6 paper · `--bg2` #F1EFE9 cream · `--card` #FFFFFF · `--border` #E8E5DD · `--border-strong` #D9D5CB · `--fg` #172629 teal-ink (text + dark brand bands) · `--muted-foreground` #5C6763 · `--accent` #172629 (primary CTA fill = ink pill, `--accent-foreground` #FFFFFF) · `--accent-soft` #EAF0EC sage (`--accent-soft-foreground` #33604C) · `--verify` #237952 · `--alert` #BC4F24 terracotta · `--tint` #8FB3BE steel-blue (heading highlight on dark bands only, never small text).
- **Typography**: display = Manrope (600–800, **sentence case always** — never uppercase headings), body = Inter, Geist Mono only for phone numbers. All via `next/font` with `cyrillic` subset (`--font-manrope`, `--font-inter`, `--font-geist-mono`).
- **Type scale (mobile-first)**: body/descriptions 15–16px, card titles 17–18px, section headings 26–34px, hero 34/52px, meta 13–14px, 12px absolute minimum. Search/text inputs ≥16px (prevents iOS auto-zoom).
- **Radii**: cards/panels `rounded-2xl`, inputs `rounded-xl`, buttons & chips `rounded-full` (pills), images `rounded-xl`, inset dark CTA bands `rounded-3xl`.
- **Buttons**: primary = ink pill (`bg-[var(--accent)] text-[var(--accent-foreground)] rounded-full`); on dark bands = paper-white pill with a rotating arrow-circle (`ArrowUpRight` in a `--fg` circle). Secondary = bordered pill. Hover = `hover:opacity-90` or `hover:brightness-95`, never color swaps.
- **Status semantics**: `open` = NO badge on collapsed cards (default state shows nothing; expanded view may show a sage "Нээлттэй зар" chip) · `in_progress` / completed-unreviewed = terracotta chip · completed+reviewed = green chip. Chips are `rounded-full`, tint bg + colored text, no borders, no animation.
- **Empty content**: never render the legacy placeholder string "Нэмэлт мэдээлэл оруулаагүй." — hide empty descriptions entirely (see `hasRealDescription` in `JobCard.tsx`).

Design-system-agnostic rules that remain in force regardless of the visual design:

- **Target Audience**: Jolooch.net is primarily accessed on mobile phones by users aged 30–50 (blue-collar operators and employers). All UI must be minimal, highly legible in daylight/outdoors, touch-optimized, and confidence-inspiring.
- **Tokens over hardcodes**: All brand/status/CTA colors must be defined as CSS variables in `globals.css` and consumed via Tailwind arbitrary-value classes (e.g. `bg-[var(--accent)]`) — never as scattered ad-hoc hex values or one-off Tailwind color utilities.
- **No Placeholder Images**: Never use `<img src="placeholder.jpg">`. Use Lucide React icons or styled SVG avatars instead.
- **Fonts via `next/font` only**: All fonts load through `next/font/google` in `layout.tsx`, wired to CSS variables (`--font-display`, `--font-sans`, etc.). Never hardcode a raw `font-family` string — fonts must be self-hosted at build time, not silently falling back to system fonts.
- **Motion**: Respect `prefers-reduced-motion` in all animations.

### Mongolian Grammar & SEO Rules
- **Location Suffixes**: Always append correct Mongolian location suffixes:
  - `... аймаг` ➔ `... аймагт` (e.g., Архангай аймагт)
  - `... дүүрэг` ➔ `... дүүрэгт` (e.g., Баянзүрх дүүрэгт)
  - `... сум` ➔ `... суманд` (e.g., Цогтцэций суманд)
  - `... хот` ➔ `... хотод` (e.g., Дархан хотод)
- **Salary Formatting**: Format salaries to human-readable Mongolian:
  - 1,000,000+ ➔ `X.X сая` (e.g., 3.5 сая)
  - 1,000+ ➔ `X мянга` (e.g., 120 мянга)
- **Title Patterns**:
  - Jobs: `[Байршил] ажиллах [Техникчин] яаралтай авна — Цалин [Дүн] ([Нэгж]) | Жолооч Монголиа`
  - Operator Profile: `[Нэр] — Хүнд механизмын оператор (Туршлага: X жил, Үнэлгээ: X★) | Жолооч Монголиа`
  - Employer Profile: `[Нэр] — Ажил олгогч ([Компанийн нэр]) | Жолооч Монголиа`

---

## 5. Component & Page Architecture

- **Page Routing (`src/app/`)**: The application uses Next.js App Router.
  - `/` (Root page): Renders `BoardClient.tsx`, which serves as a client-side wrapper around the `JobBoard.tsx` component.
  - `/board`: Server-side redirects to `/`.
  - `/jobs/[id]`: Renders `JobDetailClient.tsx` for displaying standalone, search engine-indexable job detail pages. This is the share link target.
  - `/applications`: Renders `ApplicationsClient.tsx`, which embeds `ProfileView.tsx` with `defaultTab="applications"`.
  - `/profile`: Renders `ProfilePage` (using client-side `ProfileContent`). Can display the current user's profile or another user's profile via query parameter `?id=xxx`.
  - `/settings`: Renders `SettingsClient.tsx` which wraps `SettingsView.tsx`.
  - `/auth`: Renders `AuthClient.tsx` which wraps `Auth.tsx`.
- **Client Component Wrapper Pattern**: Server pages (`page.tsx`) often render client wrappers (`*Client.tsx`) with `'use client'` to handle client-side hooks (such as authentication context, router navigation, and state).
- **Core Components (`src/components/`)**:
  - `JobBoard.tsx`: Main board displaying job filters, search, collapsed cards, and expanded cards. Note: The expanded card renders **inline within the masonry column layout** rather than inside a modal.
  - `ProfileView.tsx`: Displays profile information, application history for operators, and job management dashboard for employers.
  - `SettingsView.tsx`: Controls notifications, account deletion, profile editing, and theme settings.
  - `Auth.tsx`: Form components for user registration and sign-in.
  - `JobPostModal.tsx`: Dialog for employers to create new job listings.
  - `ProfileEditModal.tsx`: Dialog for updating user contact information, categories, and background.
  - `ReviewModal.tsx`: Dialog for submitting post-job reviews and ratings.
- **Context & Helpers**:
  - `AuthContext.tsx`: The single auth state provider. Never create other auth contexts.
  - `db.ts`: Data access layer containing all Firestore reads, writes, and localStorage persistence.
  - `getMockEmployerName(jobId)` and `getMockEmployerPhone(jobId)`: Deterministic local helpers in `JobBoard.tsx` and `JobDetailClient.tsx` used to display mock employer details to guests before blur effects are applied. They must be kept in sync.
- **Job Board Masonry Layout (Single DOM Node per Card)**: The job list in `JobBoard.tsx` is deliberately NOT a plain `grid grid-cols-2` — a CSS grid stretches every row to its tallest card, leaving large background gaps under short text-only cards next to tall image cards (shipped bug, fixed 2026-07-13). It is a **two-column masonry**: on `md+` the cards split by index parity into two independently-stacked flex columns (`md:flex-col`), so each column packs tightly; below `md` the column wrappers collapse to `display: contents` and each card wrapper's inline `order` (its original index) restores the single-column chronological flow (newest first). Do NOT revert this container to a CSS grid, and do NOT "fix" responsiveness by rendering the card list twice (e.g. a hidden mobile copy + a desktop copy): every job card MUST exist exactly once in the DOM, because the click-outside collapse logic and other lookups rely on `getElementById` with the unique `job-card-collapsed-<id>` / `job-card-expanded-<id>` ids.
- **State Reset on Navigation (Dynamic Keys)**: When implementing or modifying client pages that support dynamic query parameters (e.g. `?id=xxx`, `?jobId=xxx`) or handle different entities, always wrap the client component in a wrapper that applies a dynamic `key` (e.g., `key={searchParams.toString() || 'default'}`). This ensures React fully unmounts and remounts the component when parameters change, preventing stale data leakage, caching issues, or state-related errors.
- **Profile Page Job List Filtering**: Whenever refreshing or updating job lists in `ProfileView.tsx` (such as in review submission callbacks or action success handlers), you MUST check `profileUser.type`. Filter using operator-specific conditions (`j.applicants.includes(profileUser.id) || j.hiredOperatorId === profileUser.id`) for operators, and employer-specific conditions (`j.employerId === profileUser.id`) for employers. Do not default to operator-only filter criteria.
- **Modal Click-Outside Close Logic**: All present and future modal overlays/dialogs (which use fullscreen backdrops with class `fixed inset-0`) MUST support click-outside-to-close (and touch/tap to close on mobile). Implement this by putting `onClick={() => onClose()}` (or equivalent close state setter) on the backdrop div, and stopping event propagation using `onClick={(e) => e.stopPropagation()}` on the inner modal container card/form div. This ensures clicks/touches outside the card close the modal, while interactions inside it do not. Loading indicators and non-user-interactive status screens are exempt.
- **Modal & Popup Background Scroll Lock**: Whenever a modal dialogue, fullscreen overlay, or scrollable popover/dropdown (like the notifications list) is active, the background document body scroll MUST be locked to prevent scroll chaining. This is achieved by setting `document.body.style.overflow = 'hidden'` in a `useEffect` hook and restoring it on cleanup/unmount, combined with adding the `overscroll-contain` Tailwind utility class on scrollable containers.
- **Review List Sorting & Formatting**: In `ProfileView.tsx`, both received reviews (`displayReviews`) and given reviews (`givenReviews`) lists MUST be sorted in descending order of their creation date (newest reviews first). All review dates displayed in the UI must use the consistent `M/D/YYYY` format (e.g., `6/14/2026`).

---

## 6. Build, Deployment & Sitemap Policy

- **Environment Variables**: Publicly exposed environment variables MUST be prefixed with `NEXT_PUBLIC_` (e.g. `NEXT_PUBLIC_FIREBASE_API_KEY`).
- **Static Export**: The project is built using Next.js Static HTML Export (`output: 'export'` in `next.config.ts`). Output directory is `out/`.
- **Sitemap Generation**: Running `npm run build` automatically triggers the script `scripts/generate-sitemap.mjs` to generate/update `sitemap.xml`. Exclude unneeded paths (like `/settings`, `/board`) via `EXCLUDED_PATHS` array in sitemap generator.
- **Domain Redirects**: All non-primary traffic (e.g., `web.app`, `firebaseapp.com`) must be redirected to `https://jolooch.net` using the redirection script embedded in `src/app/layout.tsx`.
- **TypeScript Check**: Before finishing any task, run `npm run build`. This triggers Next.js compilation AND TypeScript type checking. Fix every error before marking a task done.
- **Deploy Command**: To push changes to production (jolooch.net), run:
  ```
  npx firebase-tools deploy --only hosting
  ```
  from the project root.
- **Never deploy without a passing build.** A build with TypeScript errors is never acceptable in production.

---

## 7. Firebase & Data Rules

- **Firestore**: User profiles are stored in the `users` collection, keyed by Firebase Auth UID. Job listings are in the `jobs` collection.
- **Auth**: Firebase Authentication is the identity provider. The `AuthContext` subscribes to `onAuthStateChanged` and syncs state with Firestore profile data.
- **Firestore Rules**: Security rules live in `firestore.rules`. Do not relax rules without explicit instruction.
- **No hardcoded API keys**: API keys and secrets are in `.env` (gitignored). Never hardcode them in source files.
- **Direct Base64 Image Compression**: All user-uploaded images for jobs (e.g. machinery or earthwork photos) MUST be compressed on the client side using Canvas API (max dimensions 800px, JPEG format, 75% quality) to ensure the Base64 data string remains lightweight (<150KB) and safe for Firestore document size limits.
- **Job Image Display Styling**: When rendering job images, apply `rounded-xl`, proper borders, and handle image overflow carefully (`bg-slate-950/40`, `object-cover` or `object-contain`). Ensure images preserve aspect ratios and do not stretch or warp.
- **Before Tightening `firestore.rules` Read Access — Audit Pre-Auth Client Queries First**: Before changing any `allow read` rule from `if true` to `if request.auth != null` (or similar tightening), grep the entire `src/` tree for every client-side `getDocs`/`getDoc`/`query`/`onSnapshot` call against that collection, and check whether any of them run **before** the user is authenticated (e.g. login's email/phone→auth-email lookup, registration's duplicate-check, password-recovery's account lookup — all of which historically queried `users` directly from the client pre-auth). A rule tightened without this audit will silently break those flows: `getDocs` throws `permission-denied`, which callers often catch and treat as "not found" or "wrong password" rather than surfacing the real cause. Any lookup that must run pre-auth belongs in an Admin-SDK-backed callable Cloud Function instead (mirrors `resolveLoginEmail`/`resolveAccountForRecovery`/`resetPasswordWithAnswers` in `functions/src/index.ts`), which bypasses Firestore rules entirely and can be scoped to return only the minimal fields the client needs.
- **After Deploying a 2nd-Gen Callable Cloud Function — Verify Public Invoker IAM**: `firebase deploy --only functions` does not reliably grant `allUsers` → `roles/run.invoker` on the underlying Cloud Run service for newly created 2nd-gen `onCall` functions (observed: functions created successfully but returned HTML `403 Forbidden` — a Google Frontend IAM rejection, not a Firebase callable error — until the binding was added manually). After every functions deploy that creates or recreates a function, verify with `gcloud run services get-iam-policy <function-name-lowercase> --region=us-central1` that the policy contains `allUsers`/`roles/run.invoker`; if the policy is empty, grant it with `gcloud run services add-iam-policy-binding <function-name-lowercase> --region=us-central1 --member=allUsers --role=roles/run.invoker`. This is the standard, expected configuration for callable functions — the function's own code still validates the Firebase Auth ID token internally, so this does not weaken security. Do not assume "deployed successfully" means "callable."
- **CSP Must Be Updated for EVERY New Third-Party Service — Then Verified in the Browser**: The site ships a strict `Content-Security-Policy` header from `firebase.json` (hosting `headers`), and CSP violations fail **silently** for users — a blocked script/connect target doesn't throw a visible error in the app; the dependent feature just hangs or shows a permanent loading state. This exact bug class has now shipped to production **three times**: (1) `connect-src` missing `*.cloudfunctions.net` broke all client→Cloud-Function calls (homepage user-count stuck on "..."); (2) `script-src`/`connect-src` missing `googletagmanager.com`/`google-analytics.com` silently broke Firebase Analytics; (3) `script-src` missing `www.google.com`/`www.gstatic.com`/`apis.google.com` broke App Check's `ReCaptchaV3Provider` token fetch, which in turn made ALL callable-function invocations hang forever before reaching the network (the callable SDK awaits the App Check token first — the user-count stat froze on "..." again). Therefore, whenever integrating, enabling, or lazy-loading ANY SDK or third-party service that touches the network (new Firebase product, analytics, reCAPTCHA, maps, payment, CDN font, etc.): (a) identify every domain it loads scripts from, connects to, or embeds frames from (check the vendor's official CSP documentation); (b) add them to the correct directive(s) in `firebase.json`'s CSP — `script-src`, `connect-src`, and `frame-src` are the usual suspects; (c) after deploying, open the live site's browser console (or run Lighthouse's `errors-in-console` audit) and confirm ZERO CSP-violation messages; and (d) confirm the feature's actual network request fires and succeeds (e.g. in the Network tab), not just that the page renders. A feature is not "integrated" until it has been observed working through the deployed CSP.

---

## 8. AI Agent Work Guidelines

- **Planning Mode**: For complex tasks, major refactoring, or new features, the agent must create `implementation_plan.md` and obtain user approval before writing code. For simple bug fixes or single-file UI updates, planning is not required.
- **Subagent Usage**: The agent can spawn subagents to run parallel tasks (e.g. background builds, linting, research) to save time and work efficiently.
- **Single Source of Truth**: This file (`AGENTS.md`) is the absolute source of truth for all coding rules. If any other documentation contradicts this file, this file takes precedence.
- **Proactive Rule Suggestion (Meta-Rule)**: Whenever the agent resolves a complex logical bug, implements a critical business/security logic constraint, or identifies a formatting/styling standard, the agent MUST proactively recommend adding a corresponding rule to this `AGENTS.md` file at the end of the task. This ensures the development guidelines evolve continuously and prevent future regression bugs.

---

## 9. Git Safety Rules — ЗАЙЛШГҮЙ ДАГАЖ МӨРДӨХ (Destructive Command Prevention)

> [!CAUTION]
> Эдгээр дүрмийг зөрчих нь production дээр хэрэглэгдэж буй UI/UX дизайныг бүхэлд нь устгах эрсдэлтэй. Ямар ч нөхцөлд дараах дүрмүүдийг зөрчихгүй байна.

- **`git checkout <file>` ХОРИГЛОНО**: Source файл дээр `git checkout` эсвэл `git restore` командыг **ямар ч нөхцөлд** ашиглаж болохгүй. Эдгээр командууд нь тухайн файлын бүх uncommitted өөрчлөлтийг буцааж, өмнө хийсэн бүх ажлыг устгадаг. TypeScript алдаа засахдаа ч гэсэн ашиглаж болохгүй.
- **TypeScript алдааг засах зөв арга**: `git checkout` биш, `multi_replace_file_content` эсвэл `replace_file_content` tool-оор тухайн алдааг шууд засна.
- **`git reset --hard` ХОРИГЛОНО**: Working directory дахь uncommitted өөрчлөлтийг устгах `git reset --hard` командыг хэрэглэгчийн explicit зөвшөөрөлгүйгээр ашиглаж болохгүй.
- **`git clean -fd` ХОРИГЛОНО**: Untracked файлуудыг устгах командыг хэрэглэгчийн тусгай зөвшөөрөлгүйгээр ашиглаж болохгүй.
- **Аюулгүй git командууд**: Зөвхөн дараах git командуудыг зөвшөөрнө: `git status`, `git diff`, `git log`, `git stash` (устгахгүй, хадгалдаг тул), `git add`, `git commit`.
- **Алдааг засахын өмнө diff шалга**: TypeScript эсвэл build алдаа гарвал, эхлээд `git diff <file>` ажиллуулж, тухайн файлын одоогийн байдлыг ойлгосны үндсэн дээр `replace_file_content` tool-оор засна.
- **Commit before risky ops**: Томоохон өөрчлөлт хийхийн өмнө `git add -A && git commit -m "..."` хийж, ажиллаж буй кодыг хамгаалах.



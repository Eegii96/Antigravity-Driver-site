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

### UI & Styling (Premium & Mobile-First)
- **Target Audience**: Jolooch.net is primarily accessed on mobile phones by users aged 30–50. All UI must be minimal, highly legible, and touch-optimized.
- **Dark Background**: Use `#070a13` as the base background (defined as `--color-brand-bg` in `globals.css`). Do not use `bg-black`, `bg-gray-900`, or system defaults as the page background.
- **Glassmorphism Panels**: Use `backdrop-blur-md`, `bg-slate-900/60`, and `border border-slate-800` for panel cards. Avoid flat opaque surfaces for primary content panels.
- **Color Palette**: Use HSL-tuned Tailwind slate/emerald/amber/sky/rose colors. Never use plain red, blue, or green.
- **No Placeholder Images**: Never use `<img src="placeholder.jpg">`. Use Lucide React icons or styled SVG avatars instead.
- **Typography**: Use `font-sans` (Inter) for UI text and `font-mono` for numbers, codes, phone numbers, and dates.

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
  - `JobBoard.tsx`: Main board displaying job filters, search, collapsed cards, and expanded cards. Note: The expanded card renders **inline within the grid** rather than inside a modal.
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
- **State Reset on Navigation (Dynamic Keys)**: When implementing or modifying client pages that support dynamic query parameters (e.g. `?id=xxx`, `?jobId=xxx`) or handle different entities, always wrap the client component in a wrapper that applies a dynamic `key` (e.g., `key={searchParams.toString() || 'default'}`). This ensures React fully unmounts and remounts the component when parameters change, preventing stale data leakage, caching issues, or state-related errors.
- **Profile Page Job List Filtering**: Whenever refreshing or updating job lists in `ProfileView.tsx` (such as in review submission callbacks or action success handlers), you MUST check `profileUser.type`. Filter using operator-specific conditions (`j.applicants.includes(profileUser.id) || j.hiredOperatorId === profileUser.id`) for operators, and employer-specific conditions (`j.employerId === profileUser.id`) for employers. Do not default to operator-only filter criteria.

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



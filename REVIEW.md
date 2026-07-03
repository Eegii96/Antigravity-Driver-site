# Jolooch.net — Бүрэн Мэргэжлийн Аудит (Website Audit)

**Огноо:** 2026-07-02 · **Аудитор:** Senior full-stack web consultant (Claude Code)
**Хамрах хүрээ:** UX/UI · Performance & SEO · Code Quality & Security · Conversion & Content
**Арга зүй:** Кодын статик шинжилгээ (бүх гол файлыг мөр мөрөөр уншсан), build output (`out/`) шинжилгээ, `npm audit`, git түүхийн шалгалт. Production сервер, бодит Core Web Vitals хэмжилт хийгээгүй — тэдгээрийг "Гараар шалгах шаардлагатай" хэсэгт тусгав.

---

## 1. Илрүүлсэн технологийн стек (Discovered Stack)

- **Frontend:** Next.js 16.2.7 (App Router, `output: 'export'` — бүрэн static HTML export), React 19.2.4, TypeScript 5, Tailwind CSS 4
- **Backend:** Firebase — Firestore (өгөгдөл), Firebase Auth (нэвтрэлт), Cloud Storage (зураг), 2nd-gen Cloud Functions (`resolveLoginEmail`, `resolveAccountForRecovery`, `resetPasswordWithAnswers`, `optimizeBio` + Gemini)
- **Hosting:** Firebase Hosting (`out/` фолдер, rewrites + security headers `firebase.json`-д)
- **Тест:** Playwright тохируулагдсан, гэхдээ ганц spec файлтай (`tests/profile-navigation.spec.ts`)
- **Build:** `npm run build` → Next build + `scripts/generate-sitemap.mjs` (sitemap автоматаар үүсдэг)

---

## 2. Ерөнхий дүгнэлт (Executive Summary)

| Чиглэл | Оноо /100 |
|---|---|
| UX/UI & Дизайн | **62** |
| Performance & SEO | **55** |
| Код & Аюулгүй байдал | **42** |
| Conversion & Контент | **58** |
| **Нийт дундаж** | **≈54** |

**Дүгнэлт:** Сайт нь шинээр нээгдсэн marketplace-ийн хувьд гайхалтай өргөн функцтэй (үнэлгээний систем, нэг session бодлого, серверт шилжүүлсэн нууц үг сэргээлт, JSON-LD, sitemap автоматжуулалт), монгол хэлний контент нь чанартай. Гэвч **аюулгүй байдлын 4 ноцтой цоорхой** нь сайтын гол үнэ цэн болох "итгэлцлийн систем"-ийг өөрийг нь хуурамчаар үйлдэх боломж олгож байна: нэг бүртгэл үүсгэсэн ямар ч хүн бүх хэрэглэгчийн утас/хаяг/нууц үгийн hash-ийг татаж авах, дурын хүний үнэлгээг өөрчлөх, дурын хүнд хуурамч мэдэгдэл илгээх боломжтой. Мөн бүртгэл устгах "хүсэлт" нь хаана ч бүртгэгддэггүй хуурамч товч байгаа нь Нууцлалын бодлогодоо амласан амлалтыг зөрчиж байна. Эдгээрийг **эхний 7 хоногт** засах ёстой. Хоёрдугаарт — mobile-д залгах `tel:` линк байхгүй, шинэ зарууд Facebook share болон Google-д харагдахгүй байгаа нь өсөлтийн хамгийн том 2 хаалт юм.

---

## 3. Топ 10 тэргүүлэх асуудал (Impact × Urgency)

| # | Зэрэг | Асуудал | Нотолгоо | Хугацаа |
|---|---|---|---|---|
| 1 | 🔴 | Нэвтэрсэн ямар ч хэрэглэгч БҮХ хэрэглэгчийн утас, имэйл, гэрийн хаяг, нууц үгийн hash, нууц асуултын hash-ийг бөөнөөр татаж чадна | `firestore.rules:8` + `src/lib/db/users.ts:17-37` + `src/components/JobBoard.tsx:204` | 1-3 өдөр |
| 2 | 🔴 | Итгэлцлийн систем хуурамчлагдана: дурын хэрэглэгч бусдын rating-ийг шууд бичих, хуурамч jobHistory үүсгэх, дурын хүнд "албан ёсны" мэдэгдэл илгээх эрхтэй | `firestore.rules:16-24, 74, 82` | 1 өдөр |
| 3 | 🔴 | Бүртгэл устгах хүсэлт юу ч хийдэггүй — зөвхөн local state солино. Нууцлалын бодлого §3.2-ын амлалт зөрчигдөнө (хуулийн эрсдэл) | `src/components/SettingsView.tsx:467` | <1 цаг (түр засвар) |
| 4 | 🟠 | Нэвтрэлтгүй Cloud Functions: утасны дугаараас имэйл асгардаг, бүртгэл enumeration, нууц асуултын хариуг хязгааргүй brute-force хийж болно | `functions/src/index.ts:58-151` | 1-3 өдөр |
| 5 | 🟠 | Deploy-оос ХОЙШ тавигдсан зарууд Facebook share/Google-д нүүр хуудас болж харагдана (static export + rewrite → `/index.html`), sitemap-д ордоггүй | `firebase.json:26`, `out/jobs/` дотор 8 хуудас л байна, `scripts/generate-sitemap.mjs` | 1-3 өдөр |
| 6 | 🟠 | Утасны дугаар хаана ч дарж залгах `tel:` линк биш — залгаж холбогдох нь сайтын гол conversion үйлдэл мөртлөө | `src/components/jobboard/JobCard.tsx:120-125, 576-580`, `JobDetailClient.tsx:258-264` | <1 цаг |
| 7 | 🟠 | Фонтууд кирилл үсэг дэмждэггүй: Saira Condensed-д кирилл glyph огт байхгүй, Inter нь `subsets:["latin"]`-аар л ачаалагддаг → сайтын бараг бүх текст system fallback фонтоор гардаг | `src/app/layout.tsx:12-27` | <1 цаг |
| 8 | 🟠 | Analytics огт байхгүй — хайлт, зар үзэлт, залгалт, зар тавилт гэх нэг ч funnel хэмжигдэхгүй | `src/` бүхэлдээ (grep: 0 илэрц) | 1 өдөр |
| 9 | 🟠 | Профайл зураг base64-ээр Firestore user doc-д ордог; 2MB шалгалт байгаа ч Firestore-ийн 1MB doc limit + base64-ийн +33% инфляциар том зурагтай бүртгэл ДУНДУУРАА УНАДАГ (Auth хэрэглэгч үүсчихээд профайл бичигдэхгүй) | `src/components/auth/RegisterForm.tsx:41-53` | 1 өдөр |
| 10 | 🟠 | `applicants` массивыг дурын нэвтэрсэн хэрэглэгч бүхэлд нь СОЛИХ эрхтэй (өрсөлдөгчөө хасаж болно) + race condition (transaction/`arrayUnion` хэрэглэдэггүй) | `firestore.rules:44`, `src/lib/db/jobs.ts:166-168` | 1 өдөр |

---

## 4. Дэлгэрэнгүй олдворууд

### PILLAR 3 — Код & Аюулгүй байдал (эхэлж тавив — хамгийн чухал)

#### 🔴 S1. Бүх хэрэглэгчийн PII + нууц үгийн hash бөөнөөр татагдана
- **Нотолгоо:** `firestore.rules:8` (`allow read: if request.auth != null` — ямар ч нэвтэрсэн хэрэглэгч БҮХ user doc уншина), `src/lib/db/users.ts:17-25` (`getUsers()` бүх collection-ийг татдаг), `:31-37` (`subscribeToUsers` — бүх collection-д realtime listener), `src/components/JobBoard.tsx:199-206` (нэвтэрсэн хүн бүрд энэ subscription ажилладаг).
- **Яагаад чухал:** Нэг бүртгэл үүсгэсэн scraper бүх хэрэглэгчийн утас, имэйл, **гэрийн хаяг**, PBKDF2 нууц үгийн hash (`registerUser` үүнийг user doc-д хадгалдаг — `src/lib/db/session.ts:227-229`), нууц асуултын hash-ийг татаж авна. Нууц үгийн hash offline brute-force хийгдэх боломжтой. `emailVisible`/`phoneVisible` privacy toggle нь зөвхөн UI-д ажилладаг — өгөгдөл өөрөө бүрэн ил.
- **Засвар (чиглэл):**
  1. `password`, `securityAnswer1/2` талбарыг user doc-оос БҮРМӨСӨН хас (Firebase Auth нууц үгээ өөрөө хадгалдаг тул client-д давхар hash хадгалах хэрэггүй; нууц асуултын hash-ийг `users/{uid}/private/secrets` subcollection руу зөө — rules: зөвхөн Cloud Function уншина).
  2. Бүх-collection read-ийг больж, зөвхөн шаардлагатай profile-ийг `getSingleUser`-ээр тат. Зарын карт дээр ажил олгогчийн нэр/утас хэрэгтэй бол зар нийтлэх үед job doc-д `employerPhone` талбар хийж хадгал (jobs унших нь аль хэдийн public тул guest-blur бодлоготойгоо уялдуулж зөвхөн нэвтэрсэн үед үзүүлэх бол Cloud Function-оор өг).
  3. `firestore.rules`-д list/собранie уншилтыг хориглох: `allow get: if request.auth != null; allow list: if false;` (эсвэл зөвхөн public талбартай тусдаа `publicProfiles` collection).
- **Хугацаа:** Medium (1-3 өдөр)

#### 🔴 S2. Rating/түүх/мэдэгдэл хуурамчлах боломж (итгэлцлийн системийн cөнөөлт)
- **Нотолгоо:**
  - `firestore.rules:16-24` — дурын нэвтэрсэн хэрэглэгч ДУРЫН user doc-ийн `rating`/`ratingCount`-ийг шууд бичнэ (review үүсгэлгүйгээр өөрийгөө 5.0★/9999 үнэлгээтэй болгох, өрсөлдөгчөө 0★ болгох).
  - `firestore.rules:74` — `jobHistory` collection-д дурын нэвтэрсэн хэрэглэгч дурын бичилт хийнэ (хуурамч "гүйцэтгэсэн ажлын түүх").
  - `firestore.rules:82` — `notifications`-д дурын нэвтэрсэн хэрэглэгч ДУРЫН хэрэглэгч рүү мэдэгдэл бичнэ/устгана. `JobBoard.tsx:329-453`-ийн handler нь мэдэгдлийн ГАРЧГИЙН текстээр navigation хийдэг тул хуурамч "Шинэ үнэлгээ ирлээ" мэдэгдлээр хэрэглэгчийг төөрөгдүүлэх phishing-суваг болно.
- **Яагаад чухал:** Сайтын үнэ цэнийн тулгуур нь "бодит үнэлгээ, баталгаат түүх" (BoardHero-гийн амлалт). Эдгээр rules-тэй үед тэр амлалт техникийн хувьд худал.
- **Засвар:** rating-ийг client-ээс бичихийг больж, review үүсэх/устахад Cloud Function trigger (`onDocumentWritten('reviews/{id}')`)-ээр серверт дахин тооц. `jobHistory` бичилтийг зөвхөн тухайн job-ийн employer (`get(/databases/.../jobs/$(jobId)).data.employerId == request.auth.uid`)-д зөвшөөр. `notifications` create-ийг Cloud Function-д шилжүүлэх, эсвэл наад зах нь `request.resource.data.userId`-д бичихийг зөвхөн系统ийн үйлдлээс гарах баталгаатай нөхцөлөөр хязгаарла; update/delete-ийг зөвхөн эзэмшигчид нь олго.
- **Хугацаа:** Medium (1-3 өдөр)

#### 🔴 S3. Бүртгэл устгах хүсэлт — хуурамч функц
- **Нотолгоо:** `src/components/SettingsView.tsx:456-468` — "Илгээх" товч зөвхөн `setDeleteSuccess(true)` дуудаад "24 цагийн дотор шийдвэрлэнэ" гэж амлана. Firestore бичилт, имэйл, мэдэгдэл — юу ч үүсдэггүй.
- **Яагаад чухал:** Нууцлалын бодлого §3.2 (`Footer.tsx:206`) "хэрэглэгч бүртгэлээ бүрэн устгах эрхтэй" гэж амладаг. Хувь хүний мэдээлэл хамгаалах тухай хуультай нийцсэн гэж мэдэгддэг сайтад энэ нь хуулийн бодит эрсдэл.
- **Засвар (түр, <1 цаг):** `deletionRequests` collection-д `{userId, reason, createdAt}` бичээд өөрт нь мэдэгдэл үүсгэ. (Бүрэн шийдэл: Cloud Function-оор Auth user + user doc + холбоотой зарыг цэвэрлэх.)
- **Хугацаа:** Quick win (түр) / Medium (бүрэн)

#### 🟠 S4. Нэвтрэлтгүй callable функцүүд — enumeration + brute force
- **Нотолгоо:** `functions/src/index.ts:58-74` (`resolveLoginEmail`) — дурын утасны дугаар өгөхөд тухайн хүний **имэйл хаягийг** буцаана (нэвтрэлтгүйгээр!). `:78-104` (`resolveAccountForRecovery`) — бүртгэлтэй эсэхийг батлах + нууц асуултуудыг өгнө. `:107-151` (`resetPasswordWithAnswers`) — оролдлогын тоолуур, rate limit, App Check аль нь ч байхгүй тул normalize хийгдсэн (lowercase) бага энтропитэй хариултуудыг хязгааргүй таах боломжтой → account takeover зам.
- **Засвар:**
  1. Firebase **App Check** идэвхжүүлж 3 функцэд `enforceAppCheck: true` тавь.
  2. `resolveLoginEmail`-ийг бүтэн имэйл буцаадаггүй болго (login-д хэрэгтэй бол masked/hash-ээр эсвэл шууд sign-in оролдлогод ашиглах internal token буцаа).
  3. `resetPasswordWithAnswers`-д Firestore-д оролдлогын тоолуур (`recoveryAttempts/{userId}`): 5 удаа буруу бол 1 цаг түгжих.
- **Хугацаа:** Medium (1-3 өдөр)

#### 🟠 S5. `applicants` массив — дурын хэрэглэгч бүхэлд нь солино + race
- **Нотолгоо:** `firestore.rules:44` — `hasOnly(['applicants'])` нөхцөл нь агуулгыг шалгадаггүй: ямар ч нэвтэрсэн хэрэглэгч бусдын зарын applicants-ийг `[]` болгож өрсөлдөгчдөө хасч чадна. `src/lib/db/jobs.ts:166-168` — read-modify-write (транзакцгүй): зэрэг хоёр хүн хүсэлт илгээвэл нэг нь алга болно.
- **Засвар (before/after):**
```ts
// Одоо (jobs.ts:166-168):
const updatedApplicants = [...job.applicants, operatorId];
await updateDoc(jobRef, { applicants: updatedApplicants });

// Болгох:
import { arrayUnion } from 'firebase/firestore';
await updateDoc(jobRef, { applicants: arrayUnion(operatorId) });
```
```
// firestore.rules — зөвхөн ӨӨРИЙГӨӨ нэмэх/хасахыг зөвшөөрөх:
request.resource.data.diff(resource.data).affectedKeys().hasOnly(['applicants']) &&
request.resource.data.applicants.removeAll(resource.data.applicants).hasOnly([request.auth.uid]) ||
resource.data.applicants.removeAll(request.resource.data.applicants).hasOnly([request.auth.uid])
```
- **Хугацаа:** Small (<1 өдөр)

#### 🟠 S6. `deleteJob` — өөрийн rules-ээ зөрчсөн query (баталгаатай алдаа)
- **Нотолгоо:** `src/lib/db/jobs.ts:132-137` — `where('relatedId','==',jobId)` query нь notifications collection-д хийгддэг, гэтэл `firestore.rules:80-81` нь зөвхөн `userId == request.auth.uid` нөхцөлтэй уншилт зөвшөөрдөг. Firestore rules нь query-г бүхэлд нь батлах ёстой тул энэ query ҮРГЭЛЖ `permission-denied` шиднэ. Дараалал: `deleteDoc` (амжилттай) → query (алдаа) → `throw` → `JobBoard.tsx:559-569` "Зарыг устгахад алдаа гарлаа" toast. **Үр дүн:** зар устсан мөртлөө хэрэглэгчид алдаа харагдана, notifications/jobHistory цэвэрлэгдэлгүй үлдэнэ.
- **Засвар:** notification цэвэрлэгээг Cloud Function (`onDocumentDeleted('jobs/{id}')`)-д шилжүүл, эсвэл client-ээс зөвхөн өөрийн мэдэгдлүүдийг (`where('userId','==',uid).where('relatedId','==',jobId)`) устга.
- **Хугацаа:** Small (<1 өдөр)

#### 🟠 S7. Нууц үгийн hash-ийг Firestore-д давхар хадгалдаг (шаардлагагүй)
- **Нотолгоо:** `src/lib/db/session.ts:227-229`, `SettingsView.tsx:135-138` — Firebase Auth аль хэдийн нууц үгийг хамгаалж хадгалдаг байтал client-ээс PBKDF2 hash-ийг user doc-д бичдэг. S1-тэй нийлээд offline cracking-ийн түүхий эд болно. PBKDF2 100k iteration нь ГТ хэрнээ GPU-д харьцангуй хямд.
- **Засвар:** `password` талбарыг бүх write path-аас устгаж, одоо байгаа doc-уудаас цэвэрлэх нэг удаагийн migration хий. `SettingsView`-ийн "одоогийн нууц үг шалгах" алхам `reauthenticateWithCredential` (аль хэдийн байгаа, мөр 127)-аар бүрэн хангагдана.
- **Хугацаа:** Small (<1 өдөр)

#### 🟡 S8. Guest blur — API түвшинд хамгаалагдаагүй
- **Нотолгоо:** `firestore.rules:32` (`jobs` public read) + job doc-д `employerName`, `hiredOperatorName` байдаг. Мөн prerender хийгдсэн зарын хуудасны meta description (`src/app/jobs/[id]/page.tsx:81`) болон JSON-LD `hiringOrganization.name` (`:149`) нь ажил олгогчийн ЖИНХЭНЭ нэрийг static HTML-д оруулдаг — нэвтрээгүй хүн view-source-оор шууд харна. AGENTS.md §2-ын "бодит нэр DOM-д гарч болохгүй" дүрэм UI blur-ээр л биелж, өгөгдлийн түвшинд задгай. (Утас нь users collection-д тул хамгаалагдсан — сайн.)
- **Засвар:** Бизнес шийдвэр хэрэгтэй: (а) нэрийг нээлттэй гэж зарлаад blur-ийг зөвхөн утсанд үлдээх (SEO-д ч ашигтай), эсвэл (б) job doc-оос `employerName`-ийг хасаж бүх газар users-ээс авах. Одоогийн байдал хоёулангийнх нь дундах "хуурамч аюулгүй байдал".
- **Хугацаа:** Small

#### 🟡 S9. CSP-д `unsafe-eval` + `unsafe-inline`
- **Нотолгоо:** `firebase.json:78`. Static Next production bundle-д `eval` шаардлагагүй.
- **Засвар:** `'unsafe-eval'`-ийг хасаад бүх хуудсыг шалга; inline script (`layout.tsx:66-70` redirect script)-ийг nonce эсвэл тусдаа файл болговол `unsafe-inline`-ийг ч хасаж болно.
- **Хугацаа:** Small

#### 🟡 S10. Spam/abuse хамгаалалт байхгүй
- **Нотолгоо:** Зар нийтлэх (`db/jobs.ts:91`), бүртгүүлэх — квот, rate limit, App Check, CAPTCHA аль нь ч байхгүй. Нэг хэрэглэгч script-ээр 10,000 зар нийтэлж болно (`limit(200)` учир самбар бүхэлдээ спамд дарагдана).
- **Засвар:** App Check + rules-д зар/өдөр квот (жишээ нь `jobs` create үед хэрэглэгчийн сүүлийн зарын `createdAt`-г шалгах нь rules-ээр хэцүү тул Cloud Function руу шилжүүлэх нь зөв) — наад зах нь эхний ээлжинд App Check.
- **Хугацаа:** Medium

#### 🟡 S11. Бусад кодын чанарын олдворууд
- `JobBoard.tsx:865-874` — `signOut(auth)`-ийг компонентоос шууд дууддаг нь AGENTS.md §1-ийн өөрийн дүрмийг зөрчинө (`useAuth().logout()` ашиглах ёстой). `JobDetailClient.tsx:194` зөв хийсэн байгаа.
- `src/lib/db/jobs.ts:93`, `reviews.ts:82` — ID нь `Date.now()` дээр суурилдаг: мөргөлдөх магадлалтай + таагдахуйц. `crypto.randomUUID()` эсвэл Firestore auto-ID ашигла.
- `db/jobs.ts:256-281` — `cancelHiring` нь `isReviewedByEmployer/Operator` тугуудыг reset хийдэггүй, өгсөн review-г устгадаггүй → "нээлттэй мөртлөө үнэлэгдсэн" зөрчилтэй төлөв үүсч болно. Мөн `JobBoard.tsx:571-575`-д алдааны боловсруулалт огт алга (toast ч гарахгүй).
- `db/*.ts` бүх fetch функц алдааг залгиад `[]` буцаадаг → сүлжээний алдааны үед самбар "хоосон" харагдана, retry/error UI байхгүй.
- `getNotifications()` (`db/notifications.ts:80-186`) — унших зам дээр бичилт хийдэг (seeding/migration) бөгөөд mark-read бүрийн дараа дахин дуудагддаг (`JobBoard.tsx:318`) → илүүдэл read/write.
- `recalculateUserRating` (`db/reviews.ts:45-78`) — нэг review-д БҮХ reviews + 200 job татдаг. `where('jobId','in',...)` эсвэл серверт шилжүүл.
- Legacy design token: `--color-glass-border` 147, `--color-glass-bg` 29 удаа хэрэглэгдсээр (alias-аар зүгээр ажиллаж байгаа ч AGENTS.md §4-ийн цэвэрлэгээ хийгдээгүй).
- `JobBoardProps` (`JobBoard.tsx:52-59`) — `onLogout` гэх мэт 5 prop зарлагдсан ч хэрэглэгддэггүй (dead code).
- `npm audit`: 2 moderate (postcss <8.5.10, next-ийн transitive dependency) — Next-ийн patch хувилбар гарахыг хүлээгээд шинэчил.
- Gemini API түлхүүр git түүхэнд үлдсэн (commit 3bb7825-оор устгасан ч түүхэнд бий, мөн `.env`-д `NEXT_PUBLIC_GEMINI_API_KEY` мөр хуучирч үлдсэн). **Түлхүүрийг Google AI Studio-оос ROTATE хийсэн эсэхээ баталгаажуул** — үгүй бол одоо ч ашиглагдах боломжтой.

---

### PILLAR 1 — UX/UI & Дизайн

#### 🟠 U1. Кирилл фонт ачаалагддаггүй (дизайн системийн үндэс ажиллахгүй байна)
- **Нотолгоо:** `src/app/layout.tsx:12-27` — Saira Condensed (кирилл glyph байхгүй фонт) + Inter/`subsets:["latin"]`. Сайт 100% кириллээр байгаа тул **бүх монгол текст system fallback** (Arial/Segoe) фонтоор рендэрлэгдэнэ. "Nameplate" display типографи зөвхөн латин үсэг/тоон дээр л ажиллана.
- **Засвар:**
```ts
// layout.tsx — before:
const saira = Saira_Condensed({ variable: "--font-saira", subsets: ["latin"], weight: [...] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: [...] });

// after (Oswald нь кирилл дэмждэг, AGENTS.md §4-д зөвшөөрөгдсөн alternate):
const display = Oswald({ variable: "--font-saira", subsets: ["latin", "cyrillic"], weight: ["500","600","700"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "cyrillic"], weight: ["400","500","600","700"] });
```
- **Хугацаа:** Quick win (<1 цаг). Анхаар: кирилл subset нэмэхээр фонт файлын жин нэмэгдэнэ — `display:'swap'` default тул render блоклохгүй.

#### 🟠 U2. Үсгийн хэмжээ хэт жижиг — зорилтот хэрэглэгчдэд тохирохгүй
- **Нотолгоо:** Сайт даяар `text-[8px]`–`text-[11px]`, `text-xs` давамгайлдаг (жишээ: `JobBoard.tsx:653` тайлбар 9px, `JobCard.tsx:560` тодорхойлолт 12px, огноо 10px). AGENTS.md §4 өөрөө "30-50 насны, гадаа нарны гэрэлд, утсаараа" гэж тодорхойлсон.
- **Яагаад чухал:** Гол худалдан авагчид тань текстээ уншиж чадахгүй бол бүх funnel-ийн суурь нурна.
- **Засвар:** Body/тодорхойлолтын доод хэмжээг 14px (text-sm), мета мэдээллийг 12px (text-xs) болго; 8-10px хэмжээг бүрмөсөн хас.
- **Хугацаа:** Medium (олон файлд хүрнэ)

#### 🟡 U3. Touch target 44×44px хүрдэггүй
- **Нотолгоо:** `JobCard.tsx:287` "Сонгох" (`px-3 py-1.5` ≈ 28px өндөр), мэдэгдлийн "Устгах" (`JobBoard.tsx:757-767`), modal-ын жижиг X товчнууд.
- **Засвар:** Гол үйлдлийн товчнуудад `min-h-11` (44px) стандарт тогтоо.
- **Хугацаа:** Small

#### 🟡 U4. Мэдэгдлийн dropdown жижиг дэлгэцэнд багтахгүй магадлалтай
- **Нотолгоо:** `JobBoard.tsx:693` — `w-[360px]` тогтмол өргөнтэй, баруун захад bell дүрснээс зүүн тийш дэлгэгдэнэ. 360px viewport дээр зүүн захаас халина (root-ийн `overflow-x-hidden` таслана).
- **Засвар:** `w-[min(360px,calc(100vw-2rem))]` эсвэл mobile-д fixed full-width sheet.
- **Хугацаа:** Quick win

#### 🟡 U5. JobDetail-ийн профайл цэс hover-оор л онгойдог
- **Нотолгоо:** `JobDetailClient.tsx:144-148` — товчинд `onClick` алга, зөвхөн `onMouseEnter/Leave`. Touch төхөөрөмжид найдваргүй.
- **Засвар:** `JobBoard.tsx:303-309`-тэй ижил toggle onClick нэм.
- **Хугацаа:** Quick win

#### 🟡 U6. Брэнд нэр 3 янз
- **Нотолгоо:** Metadata = "Жолооч Монголиа" (`layout.tsx:33`), самбарын header = "Хүнд машин, механизм & Газар шорооны ажлын сайт" (`JobBoard.tsx:652`), зарын дэлгэрэнгүй header = **"Antigravity Driver"** (`JobDetailClient.tsx:138` — дотоод англи кодын нэр хэрэглэгчид ил гарчээ!).
- **Яагаад чухал:** Шинэ marketplace-д итгэл = танигдахуйц нэг нэр. FB share-ээс орж ирсэн хүн өөр нэртэй сайт үзвэл эргэлзэнэ.
- **Засвар:** Нэг брэнд нэр сонгож (Жолооч / Jolooch.net) бүх header, metadata, footer-т нэг мөр болго. "Antigravity Driver"-ийг яаралтай сол.
- **Хугацаа:** Quick win

#### 🟡 U7. Хоосон marketplace-ийн төлөв
- **Нотолгоо:** `JobBoard.tsx:1044-1058` — зар байхгүй үед "Хайлтанд нийцэх ажил олдсонгүй" (шүүлтүүр идэвхгүй байсан ч). Зочинд "Бүртгэлтэй хэрэглэгч: ..." гэж三 цэг харагдана (`JobBoard.tsx:921` — guests users уншиж чадахгүй тул) — эвдэрсэн мэт.
- **Засвар:** Шүүлтүүргүй хоосон үед "Анхны зараа үнэгүй тавьж түрүүлээрэй 🚜" + CTA; зочны хэрэглэгчийн тоог Cloud Function-оор эсвэл build-time тоогоор үзүүл (эсвэл картыг нуу).
- **Хугацаа:** Quick win

#### 🟡 U8. Contrast зөрчлүүд (WCAG AA)
- **Нотолгоо:** Цайвар дэвсгэр дээр `text-red-300` (`RegisterForm.tsx:513, 573`, `JobPostModal.tsx:205`), `text-rose-200` (`SettingsView.tsx:405`) — 4.5:1-д огт хүрэхгүй. Мөн 8-9px текстүүд瑕 contrast-аас гадна хэмжээгээрээ унадаг.
- **Засвар:** Алдааны текстийг `text-rose-700` болго (цайвар дэвсгэрт).
- **Хугацаа:** Quick win

#### ✅ Сайн талууд (энэ pillar-т): нэг h1 бүтэц, `lang="mn"`, skip-link (`layout.tsx:73`), `:focus-visible` outline (`globals.css:124`), `prefers-reduced-motion` дэмжлэг (`globals.css:214`), collapsed картын keyboard дэмжлэг (`JobCard.tsx:509-512`), modal-уудын scroll lock + click-outside тууштай хэрэгжсэн, blur warning modal-ийн UX сайн.

---

### PILLAR 2 — Performance & SEO

#### 🟠 P1. Шинэ зарууд SEO/Facebook-д "үл үзэгдэгч" (хамгийн том SEO асуудал)
- **Нотолгоо:** Static export тул `generateStaticParams` (`src/app/jobs/[id]/page.tsx:41-61`) зөвхөн BUILD хийх үеийн заруудыг prerender хийдэг — `out/jobs/`-д одоо 8 л хуудас байна. `firebase.json:26` нь бусад бүх `/jobs/:id`-г `/index.html` (нүүр самбар!) руу rewrite хийдэг. Facebook scraper JS ажиллуулдаггүй тул deploy-оос хойш тавигдсан зарын share линк **нүүр хуудасны title/description, og:image-гүй** харагдана; Google мөн зарын контентыг индекслэхгүй. Sitemap ч мөн build үеийн snapshot (`generate-sitemap.mjs`).
- **Яагаад чухал:** Монголд Facebook = гол тархалтын суваг. Хамгийн шинэ (хамгийн үнэ цэнтэй!) зарууд нь яг хамгийн муу share/SEO-тэй байна.
- **Засвар (сонголтоор):**
  1. **Хамгийн хялбар:** Cloud Scheduler-ээр өдөрт 2-4 удаа `npm run build && firebase deploy --only hosting` автомат re-build (CI). Sitemap ч мөн шинэчлэгдэнэ.
  2. **Зөв шийдэл:** `/jobs/:id` rewrite-ийг SSR Cloud Function руу чиглүүлж (Firebase Hosting + functions integration) meta/og/JSON-LD-г динамикаар тарьж, body-д одоо байгаа client компонентоо ашиглах.
  3. Наад зах нь rewrite-ийг `/index.html` биш зарын дэлгэрэнгүй рендэрлэдэг тусдаа shell HTML руу чиглүүл (одоогийн rewrite нь хэрэглэгчид САМБАР харуулдаг эсэхийг гараар шалга — доорх M-жагсаалт).
- **Хугацаа:** Medium–Large

#### 🟠 P2. Bundle жин — 3G-д хүнд
- **Нотолгоо:** `out/_next/static/chunks/`-ийн хамгийн том chunk **712KB** (Firebase SDK багц), нийт static JS ≈2.5MB (raw). `public/logo.jpg` **277KB** байж 40×40px хэмжээтэй харагдана (`JobBoard.tsx:649`, eager). Rural 3G (~400kbps) дээр зөвхөн эдгээр нь 15-20 секунд.
- **Хамгийн том хөшүүрэг:**
  1. `logo.jpg` → 80×80 WebP (~3KB) болго — 274KB хэмнэлт, quick win.
  2. Firebase-ийн `getFunctions/httpsCallable`-ийг login/register үед л dynamic import хий; `motion` (12.x) багцын хэрэглээг шалгаж хэрэглэдэггүй бол хас.
  3. Firestore-ийн эхний query-г 200 биш 30-50 зараар хязгаарлаж "цааш үзэх" pagination нэм (`db/jobs.ts:24,38`) — сүлжээний payload шууд буурна.
- **Хугацаа:** Quick win (лого) + Medium (бусад)

#### 🟡 P3. Зургийн thumbnail байхгүй
- **Нотолгоо:** Upload үед 800px/75% JPEG болгож шахдаг нь сайн (`src/lib/storage.ts:6-36`), гэвч collapsed картын 144px өндөр thumbnail (`JobCard.tsx:544-557`) дээр мөн л бүтэн 800px зургийг татдаг. 20 зартай самбар ≈ 2-4MB зураг.
- **Засвар:** Upload үед 2 хувилбар (thumb 320px + full 800px) хадгалах, эсвэл Firebase Extensions "Resize Images". `loading="lazy"` аль хэдийн байгаа нь сайн.
- **Хугацаа:** Medium

#### 🟡 P4. Title/meta-ийн алдаанууд
- **Нотолгоо (build output-оос батлагдсан):**
  - Зарын хуудас: `<title>... | Жолооч Монголиа | Жолооч Монголиа</title>` — `jobs/[id]/page.tsx:79-80` дотроо суффикс нэмдэг + `layout.tsx:31-34`-ийн template дахин нэмдэг (давхардал).
  - Нүүр: `<title>Барилга, Механизмын Ажлын Нэгдсэн Систем</title>` — брэнд суффикс огт ороогүй (out/index.html-д батлагдсан).
  - **`og:image` сайт даяар 0** (out/*.html-д grep = 0) — FB share бүр зураггүй. Монголд FB давамгай тул энэ нь CTR-ийг эрс бууруулна.
  - `rel="canonical"` хаана ч байхгүй (out-д 0).
- **Засвар:** page-үүдээс `| Жолооч Монголиа`-г хасч template-д даатга; `layout.tsx` metadata-д `openGraph.images: ['/og-cover.jpg']` (1200×630, брэндтэй cover зураг хий); `alternates: { canonical: './' }` нэм.
- **Хугацаа:** Quick win (title/canonical) + Small (og зураг бэлтгэх)

#### 🟡 P5. Sitemap/индексжилтийн стратеги
- **Нотолгоо:** `scripts/generate-sitemap.mjs:15` — `/profile` EXCLUDED_PATHS-д алга, гэтэл `/profile` нь зочдыг `/auth` руу шиддэг (`src/app/profile/page.tsx:26-29`) → crawler-т хэрэггүй; `lastmod` бүх URL-д build өдөр (`:47`) — худал дохио; `/auth` priority 0.8 өндөр. Дууссан заруудын хуудас JobPosting JSON-LD-тэйгээ (validThrough 30 хоног) хэвээр индекслэгдэнэ — Google for Jobs "ажил хаагдмагц зарыг хас" гэсэн шаардлагатай зөрчилдөнө.
- **Засвар:** `/profile`-ийг exclude; `status==='completed'` заруудад `robots: { index: false }` metadata (эсвэл JSON-LD-г хасах); lastmod-д job.createdAt ашигла.
- **Хугацаа:** Small

#### 🟡 P6. Structured data өргөжүүлэлт
- **Нотолгоо:** JobPosting JSON-LD чанартай хийгдсэн (`jobs/[id]/page.tsx:119-159` — validThrough, baseSalary, MNT бүгд зөв). Гэхдээ Organization + WebSite JSON-LD нүүр хуудсанд алга; түрээсийн зарт (machinery_rental) JobPosting биш Product/Offer тохиромжтой.
- **Бэлэн snippet (layout.tsx эсвэл page.tsx-д):**
```tsx
const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Жолооч Монголиа',
  url: 'https://jolooch.net',
  logo: 'https://jolooch.net/logo.jpg',
  contactPoint: { '@type': 'ContactPoint', telephone: '+976-99106339', contactType: 'customer service', areaServed: 'MN', availableLanguage: 'mn' },
};
```
- **Хугацаа:** Quick win

#### 🟡 P7. Локал SEO боломж ашиглагдаагүй
- Аймаг тус бүрийн landing хуудас (`/jobs/umnugovi` г.м, build үед 22 static хуудас үүсгэх) нь "Өмнөговь экскаватор ажил" төрлийн эрэлттэй хайлтуудыг авах хамгийн хямд зам. `LOCATION_OPTIONS` (`src/lib/job-format.ts:7-31`) аль хэдийн бэлэн. — **Medium**

#### ✅ Сайн талууд: static export + Firebase CDN; `preconnect` hints (`layout.tsx:62-65`); `_next/static`-д immutable cache, HTML-д no-cache (`firebase.json:30-48`); HSTS+preload, nosniff, frame DENY, Permissions-Policy бүрэн; robots.txt + sitemap автомат; `next/font` self-hosting; зургийн lazy loading; domain redirect script.

---

### PILLAR 4 — Conversion & Контент

#### 🟠 C1. `tel:` линк байхгүй — гол conversion үйлдэл гацдаг
- **Нотолгоо:** `JobCard.tsx:120-125` (expanded), `:576-580` (collapsed), `JobDetailClient.tsx:258-264` — утас бүгд энгийн `<span>` текст. Хэрэглэгч дугаарыг цээжилж/хуулж залгах ёстой.
- **Засвар (before/after):**
```tsx
// Одоо:
<span className="font-mono text-xs font-bold ...">{getEmployerPhone(job) || 'Утасгүй'}</span>

// Болгох (нэвтэрсэн үед):
{currentUser && getEmployerPhone(job) ? (
  <a href={`tel:${getEmployerPhone(job)}`} onClick={(e) => e.stopPropagation()}
     className="font-mono text-sm font-bold text-[var(--fg)] underline decoration-[var(--accent)] min-h-11 flex items-center">
    {getEmployerPhone(job)}
  </a>
) : (/* одоогийн blur logic */)}
```
Мөн expanded картад томоор "📞 Залгах" гэсэн үндсэн CTA товч нэмэхийг зөвлөе (accent шар, бүтэн өргөн).
- **Хугацаа:** Quick win — магадгүй энэ аудитын хамгийн өндөр ROI-той засвар.

#### 🟠 C2. Analytics/хэмжилт 0
- **Нотолгоо:** `src/`-д gtag/GA/Firebase Analytics/plausible ямар ч илэрц алга.
- **Minimum viable tracking plan:** Firebase Analytics (SDK аль хэдийн орсон тул +жин бага): `search` (query, filters), `view_job` (jobId, status), `contact_click` (tel: дарсан — C1-тэй хамт), `share_job` (platform), `apply_submit`, `post_started` / `post_completed`, `sign_up_started` / `sign_up_completed`. Эдгээр 8 event нь хоёр funnel-ийг бүрэн харуулна.
- **Хугацаа:** Small (1 өдөр)

#### 🟡 C3. Бүртгэлийн саад (friction)
- **Нотолгоо:** `RegisterForm.tsx` — нэг дэлгэцэнд 12+ талбар; **гэрийн хаяг заавал** (`:69` — залгах marketplace-д шаардлагагүй саад); нууц үгэнд тусгай тэмдэгт заавал (`:71` — NIST 800-63B ийм composition rule-ээс татгалзахыг зөвлөдөг, 30-50 насны хэрэглэгчдэд ялангуяа саад); имэйл input `type="text"` (`:170` — mobile keyboard буруу).
- **Засвар:** Хаягийг optional болго; тусгай тэмдэгтийн шаардлагыг хасаад min 8 урт үлдээ; бүртгэлийг 2 алхам болго (алхам 1: нэр/утас/нууц үг → бүртгэл үүснэ; алхам 2: профайл баяжуулах, алгасаж болно). Bio/машин сонголт/аватар бүгд 2-р алхамд.
- **Хугацаа:** Medium

#### 🟡 C4. Зарын чанарын хөтөч сул + далд default-ууд буруу дохио өгнө
- **Нотолгоо:** `JobPostModal.tsx:99-105` — `machineryType` үргэлж `'Бусад'`, `salaryUnit` үргэлж `'Өдрөөр'`, `duration` үргэлж `'Тохиролцоно'` гэж далдуур бичигддэг. Үр дагавар: (1) хайлт machineryType-аар ажилладаг (`JobBoard.tsx:607`) ч шинэ зарууд бүгд "Бусад"; (2) зарын дэлгэрэнгүйд "АЖЛЫН ХУГАЦАА: Тохиролцоно" үргэлж (`JobDetailClient.tsx:326-330`); (3) цалин "Өдрөөр" эсэх нь худал байж болно → JSON-LD-ийн `unitText`/`employmentType` (`jobs/[id]/page.tsx:99-117`) буруу гарна.
- **Засвар:** Формд машины төрөл (MACHINE_OPTIONS аль хэдийн `auth/constants.ts:9`-д бий) + цалингийн нэгж (Өдрөөр/Цагаар/Төслөөр) 2 талбар нэм; зургийн prompt-д "Техник, талбайн зургаа оруулбал 3 дахин их хандалт авна" гэх мэт урамшуулах текст.
- **Хугацаа:** Small

#### 🟡 C5. Амьд байдлын дохио / retention
- **Байхгүй:** үзэлтийн тоо, "N цагийн өмнө" relative огноо (одоо `2026.06.28` форматтай — `job-format.ts:58`), хадгалсан хайлт, favorites, шинэ тохирох зарын push/имэйл. Нэгэнт notification систем + realtime listener бэлэн тул "миний аймагт шинэ зар" мэдэгдэл бол хамгийн хямд retention hook.
- **Хугацаа:** Medium (favorites/notify) / Quick win (relative огноо)

#### 🟡 C6. Контентын жижиг олдворууд
- `JobDetailClient.tsx:138` — "Antigravity Driver" (U6-тай давхар, конверсийн итгэлд ч нөлөөтэй).
- `JobCard.tsx:355` — "Цалингийн мурилт" гэдэг нь "мурийлт/маргаан"-ы алдаатай бичилт бололтой — шалгаж засах.
- Guest-ийн "Бүртгэлтэй хэрэглэгч: ..." (U7) — итгэлийн дохио гэж тавьсан зүйл эвдэрсэн мэт харагдана.
- Footer-ийн холбоо барих имэйл gmail хаяг (`Footer.tsx:51`) — өөрийн домэйнтэй имэйл (info@jolooch.net) итгэл нэмнэ. **Quick win**
- InAppBrowserGuard (`InAppBrowserGuard.tsx:15-24`) — FB/Messenger доторх browser-ээс Chrome руу автоматаар шиддэг нь session хадгалалтад зөв санаа, гэхдээ intent хориглогдвол ямар ч fallback UI байхгүй тул хэрэглэгч юу болсоныг мэдэхгүй үлдэнэ. Fallback banner нэм.

#### ✅ Сайн талууд: Web Share API + FB/Messenger/Telegram deep-link share (`JobCard.tsx:388-500` — Монголын хэрэглээнд маш зөв); guest-д самбар бүрэн нээлттэй (зөв gating — browse нээлттэй, contact нэвтрэлтээр); хоёр талын үнэлгээний урсгал бүрэн; мэдэгдлийн realtime систем; монгол хэлний бичвэрүүд ерөнхийдөө уран, natural.

---

## 5. Quick Wins жагсаалт (тус бүр <1 цаг)

- [ ] **Утасны дугааруудыг `tel:` линк болгох** (JobCard ×2, JobDetailClient) — хамгийн өндөр ROI
- [ ] **Бүртгэл устгах хүсэлтийг Firestore-д бичдэг болгох** (`deletionRequests` collection) — хуулийн эрсдэл хаагдана
- [ ] **Фонтод `"cyrillic"` subset нэмэх + Saira→Oswald** (`layout.tsx:12-27`)
- [ ] **logo.jpg → 80px WebP** (277KB → ~3KB)
- [ ] **"Antigravity Driver" брэнд нэрийг солих** (`JobDetailClient.tsx:138`)
- [ ] **Зарын title-ийн давхар суффикс засах** (`jobs/[id]/page.tsx:79-80`)
- [ ] **og:image (1200×630) нэмэх** (`layout.tsx` metadata)
- [ ] **`alternates.canonical` нэмэх**
- [ ] **Organization JSON-LD нэмэх** (бэлэн snippet §P6-д)
- [ ] **`text-red-300`/`text-rose-200` → `text-rose-700`** (RegisterForm, JobPostModal, SettingsView)
- [ ] **Sitemap-аас `/profile` хасах** (`generate-sitemap.mjs:15`)
- [ ] **Хоосон самбарын CTA** ("Анхны зараа тавь")
- [ ] **Мэдэгдлийн dropdown-ийг viewport-д багтаах** (`w-[min(360px,calc(100vw-2rem))]`)
- [ ] **JobDetail профайл цэсэнд onClick нэмэх**
- [ ] **`applyForJob`-д `arrayUnion` ашиглах**
- [ ] **`JobBoard.tsx:865`-ийн шууд `signOut`-ийг `useAuth().logout()` болгох**
- [ ] **Gemini түлхүүр rotate хийгдсэн эсэхийг шалгаад `.env`-ээс хуучин мөрийг устгах**

---

## 6. 30 хоногийн үйл ажиллагааны төлөвлөгөө

### 7 хоног 1 — Аюулгүй байдлын цоорхойг хаах (юу ч бүү нэм, эхлээд хамгаал)
1. `firestore.rules` шинэчлэл: users list хориглох; rating/ratingCount client бичилт хориглох; notifications/jobHistory write хатуу хязгаарлах; applicants дүрэм (S1, S2, S5)
2. `password`/`securityAnswer*` hash-уудыг user doc-оос салгах migration (S7, S1)
3. Cloud Functions: App Check + оролдлогын тоолуур + `resolveLoginEmail`-ийн имэйл дискложерийг хаах (S4)
4. Бүртгэл устгах хүсэлтийг бодитоор бичдэг болгох (S3)
5. Rating-ийн дахин тооцооллыг Cloud Function trigger руу шилжүүлэх (S2-ын хоёрдугаар хэсэг)

### 7 хоног 2 — Conversion + суурь хэмжилт
1. `tel:` линкүүд + "Залгах" CTA (C1)
2. Firebase Analytics + 8 event (C2)
3. Quick wins жагсаалтыг бүрэн гүйцээх (фонт, лого, брэнд, title, og:image, contrast)
4. `deleteJob` цэвэрлэгээг Cloud Function-д шилжүүлэх (S6)

### 7 хоног 3-4 — SEO + өсөлтийн суурь
1. Шинэ зарын хуудасны асуудлыг шийдэх: cron re-build ЭСВЭЛ SSR function (P1) — энэ бол marketplace-ийн indexing-ийн амин сүнс
2. Дууссан заруудыг noindex (P5)
3. Аймаг тус бүрийн landing хуудсууд (P7)
4. Бүртгэлийг 2 алхам болгож хөнгөлөх, хаягийг optional (C3)
5. Зарын формд машины төрөл + цалингийн нэгж талбар (C4)
6. Thumbnail pipeline (P3), эхний query-г 50 болгож pagination (P2)
7. "Миний аймагт шинэ зар" мэдэгдэл (C5)

---

## 7. Сайн хийгдсэн зүйлс (хадгалж, үргэлжлүүлэх ёстой)

1. **Нууц үг сэргээлтийг Admin SDK-тай Cloud Function-д server-side шилжүүлсэн архитектур** (`functions/src/index.ts`) — timing-safe харьцуулалт, PBKDF2, хариултын hash-ийг хэзээ ч client-д буцаадаггүй. Зөвхөн rate limit/App Check дутуу.
2. **Security headers-ийн иж бүрдэл** (`firebase.json:50-80`) — HSTS+preload, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, CSP. Ийм түвшний тохиргоо шинэ сайтад ховор.
3. **JobPosting JSON-LD** — validThrough, baseSalary/MNT, employmentType mapping зэрэг нь Google for Jobs-д бэлэн, чанартай.
4. **Share урсгал** — Web Share API + FB/Messenger/Telegram deep links (`JobCard.tsx:388-500`) нь Монголын хэрэглээний бодит зураглалд тааруулагдсан.
5. **Дизайн системийн сахилга** — токенууд нэг газарт (`globals.css`), legacy alias-ууд ухаалгаар холбогдсон, дизайны дүрэм AGENTS.md-д баримтжсан. (Кирилл фонтын асуудлыг л засах хэрэгтэй.)
6. **Гест хэрэглэгчдэд самбар нээлттэй, contact нь нэвтрэлтээр** гэсэн gating стратеги нь шинэ marketplace-ийн liquidity-д зөв сонголт.
7. **Upload зургийн client-side шахалт** (`storage.ts` — 800px/75% JPEG) + Storage rules-ийн хэмжээ/төрлийн шалгалт (`storage.rules`).
8. **Кодын модульчлал сайжирсан** — db.ts barrel + domain модулиуд, JobBoard-оос JobCard/BoardHero салгасан refactor нь өмнөх review-гийн "монолит" асуудлыг шийдэж эхэлсэн.
9. **Playwright суурь** тавигдсан (өргөжүүлэх л хэрэгтэй), build-д TypeScript шалгалт + sitemap автоматжуулалт орсон.
10. **Монгол хэлний UX бичвэрүүд** — natural, хэрэглэгчээ хүндэлсэн өнгө аястай; Үйлчилгээний нөхцөл/Нууцлалын бодлого нь дотоодын хуультай уялдуулж бичигдсэн.

---

## 8. Гараар шалгах шаардлагатай (Requires manual verification)

1. **Шинэ зарын URL-ийн бодит зан төлөв:** `/jobs/<deploy-ээс хойшхи id>` руу шууд орwhen `/index.html` rewrite ямар харагдаж байгааг (самбар уу, зарын дэлгэрэнгүй үү) browser-ээр шалгах. Facebook Sharing Debugger-ээр шинэ зарын линкийг шалгах.
2. **Gemini API түлхүүр rotate хийгдсэн эсэх** — git түүхэнд байгаа тул хуучин түлхүүр идэвхтэй л бол эрсдэлтэй.
3. **Бодит Core Web Vitals** — PageSpeed Insights / CrUX-ээр jolooch.net-ийн field data (энэ аудит зөвхөн статик шинжилгээ).
4. **Cloud Functions-ийн invoker IAM** — AGENTS.md §7-д тэмдэглэгдсэн `allUsers`/`roles/run.invoker` тохиргоо 4 функц дээр бүгд хэвийн эсэх.
5. **App Check идэвхжүүлэлтийн дараа** login/register/recovery урсгалыг бүх browser дээр regression-тест хийх.
6. **Firebase Auth-ийн brute-force хамгаалалт** (IDENTITY_TOOLKIT quota) хангалттай эсэх — консолоос rate тохиргоог харах.
7. **`out/`-ийн нийт жин ба анхны хуудасны network waterfall** — бодит 3G throttle-тэй хэмжилт.

---

*Энэхүү аудит нь кодын тухайн агшны (2026-07-02, commit 3bb7825) төлөв байдалд суурилав. Мөр дугаарууд өөрчлөгдөж болзошгүй тул олдвор бүрийг файл + контекстээр нь баталгаажуулж засварлана уу.*

import { onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenAI } from '@google/genai';

const geminiApiKey = defineSecret('GEMINI_API_KEY');

interface OptimizeBioParams {
  fullName: string;
  experienceYears: number;
  machineTypes: string[];
  rawBio: string;
  currentBio?: string;
  userType?: 'operator' | 'employer';
}

// Helper function to detect if a name is a company or a personal name
function isCompanyName(name: string): boolean {
  const lower = name.toLowerCase().trim();
  const companyKeywords = [
    'ххк', 'компани', 'групп', 'корпораци', 'сольюшн', 'солушн',
    'xxk', 'llc', 'company', 'group', 'уурхай', 'үйлдвэр',
    'нэгдэл', 'тбб', 'корп', 'corp', 'limited', 'төсөл'
  ];
  return companyKeywords.some(kw => lower.includes(kw));
}

function buildPrompt(params: OptimizeBioParams): string {
  const { fullName, experienceYears, machineTypes, rawBio, currentBio, userType = 'operator' } = params;
  const machines = machineTypes.length > 0 ? machineTypes.join(', ') : 'Хүнд даацын машин механизм';

  const operatorTones = [
    "Техникийн арчилгаа, аюулгүй байдал болон нягт сахилга батыг голлон онцолсон, боловсон өнгө аястай",
    "Ажлын тууштай байдал, уул уурхай болон барилгын талбайн туршлагаа илэрхийлсэн, итгэл даахуйц өнгө аястай",
    "Шуургай дайчин, даалгасан ажлыг цагт нь чанартай гүйцэтгэх өндөр хариуцлагатай өнгө аястай",
    "Архинаас хол, муу зуршилгүй, хөдөлмөрийн дүрмийг чанд баримтлах сахилга баттай өнгө аястай"
  ];

  const employerTones = [
    "Хөдөлмөрийн аюулгүй байдал (HSE) болон ажилчдын эрүүл мэндийг нэгдүгээрт тавьдаг, хариуцлагатай ажил олгогч өнгө аястай",
    "Цалин хөлс болон санхүүгийн тооцоог цаг хугацаанд нь ягштал шийддэг, найдвартай ажил олгогч өнгө аястай",
    "Ажилчдын тав тухтай кэмп, хоол хүнс болон найрсаг, халуун дулаан соёлтой хамт олныг бүрдүүлсэн өнгө аястай",
    "Итгэлцэл дээр суурилсан, ажилтнаа хүндэлдэг, тогтвортой урт хугацааны төслүүдтэй хамт олон өнгө аястай"
  ];

  const tones = userType === 'employer' ? employerTones : operatorTones;

  let availableTones = [...tones];
  if (currentBio) {
    const cb = currentBio.toLowerCase();
    if (userType === 'employer') {
      if (cb.includes('аюулгүй') || cb.includes('hse') || cb.includes('эрүүл')) {
        availableTones = availableTones.filter(t => !t.includes('Хөдөлмөрийн аюулгүй'));
      }
      if (cb.includes('цалин') || cb.includes('хөлс') || cb.includes('санхүү')) {
        availableTones = availableTones.filter(t => !t.includes('Цалин хөлс'));
      }
      if (cb.includes('кэмп') || cb.includes('хоол') || cb.includes('тав тух')) {
        availableTones = availableTones.filter(t => !t.includes('Ажилчдын тав тухтай'));
      }
      if (cb.includes('хүндэлдэг') || cb.includes('итгэлцэл') || cb.includes('соёлтой')) {
        availableTones = availableTones.filter(t => !t.includes('Итгэлцэл дээр'));
      }
    } else {
      if (cb.includes('арчилгаа') || cb.includes('тос') || cb.includes('эвдрэлгүй') || cb.includes('сул зогсолтгүй')) {
        availableTones = availableTones.filter(t => !t.includes('Техникийн арчилгаа'));
      }
      if (cb.includes('уурхай') || cb.includes('кэмп') || cb.includes('хөдөө') || cb.includes('говь')) {
        availableTones = availableTones.filter(t => !t.includes('Ажлын тууштай байдал'));
      }
      if (cb.includes('цагт нь') || cb.includes('даалгасан') || cb.includes('шуурхай') || cb.includes('гүйцэтгэх')) {
        availableTones = availableTones.filter(t => !t.includes('Шуургай дайчин'));
      }
      if (cb.includes('архи') || cb.includes('сахилга') || cb.includes('хорт зуршил') || cb.includes('зуршилгүй')) {
        availableTones = availableTones.filter(t => !t.includes('Архинаас хол'));
      }
    }
  }
  const finalTones = availableTones.length > 0 ? availableTones : tones;
  const randomTone = finalTones[Math.floor(Math.random() * finalTones.length)];

  if (userType === 'employer') {
    const isCompany = isCompanyName(fullName);
    const perspectiveInstruction = isCompany
      ? `Энэ нь БАЙГУУЛЛАГА / КОМПАНИ тул компанийн зүгээс төлөөлөн бичнэ үү (Жишээ нь: "Манай компанийн зүгээс...", "Бид хамт олондоо...", "Манай хамт олон...", "Бид тогтвортой төслүүд..."). Хэзээ ч хувь хүн өөрийгөө бичиж байгаа мэтээр бүү бич.`
      : `Энэ нь ХУВЬ ХҮН / ХУВИЙН АЖИЛ ОЛГОГЧ тул тухайн хувь хүний зүгээс өөрийгөө төлөөлүүлэн бичнэ үү (Жишээ нь: "Би ажил олгогч ${fullName} байна...", "Миний зүгээс...", "Би өөрийн хувийн төсөл дээр...", "Миний бие ажилтнаа хүндэлдэг..."). Компани юм шиг "манай компани" гэж хэзээ ч бичиж болохгүй!`;

    return `Үүрэг: Та хүнд машин механизмын салбарын шилдэг ажил олгогч/компанийн танилцуулга бичих туслах юм.
Ажил олгогчийн мэдээлэл:
- Ажил олгогчийн/Компанийн нэр: ${fullName}
- Анхны тэмдэглэл: "${rawBio}"
- Онцлох өнгө аяс: ${randomTone}

Хүсэлт: Дээрх мэдээлэл болон онцлох өнгө аяс дээр үндэслэн ажил олгогчийн танилцуулгыг маш товч бөгөөд тодорхой (максимум 2-3 өгүүлбэр, хэт нуршуу бус), утга найруулгын хувьд маш цэвэрхэн, алдаагүй Монгол хэлээр мэргэжлийн хэмжээнд бичнэ үү. Ажил хайж буй операторуудад найдвартай, аюулгүй, соёлтой хамт олон гэсэн сэтгэгдэл төрүүлэх ёстой.
АНХААРАХ ШААРДЛАГА:
- ЖОЛООЧ ЭСВЭЛ ОПЕРАТОР ГЭЖ БИЧИЖ БОЛОХГҮЙ! Та бол ажилтан авах гэж буй АЖИЛ ОЛГОГЧ/ЗАХИАЛАГЧ тал юм.
- БИЧИХ ХЭЛБЭР, ТӨЛӨӨЛӨЛ: ${perspectiveInstruction}
- Хэрэв тэмдэглэл (rawBio) дотор өмнө нь системээр үүсгэсэн хэвшмэл танилцуулга бичвэр орсон байвал түүнийг огт давхардуулахгүйгээр устгаж, зөвхөн шинээр өөр өвөрмөц найруулгатай өгүүлбэрүүдийг зохиож буцаана уу.
- Хариултад ямар ч тохиолдолд олон одон тэмдэг (**), хаалт эсвэл markdown тэмдэглэгээ бүү ашигла! Зөвхөн цэвэр энгийн текст хэлбэрээр буцаана.
- Итгэл даахуйц, аюулгүй байдал (HSE)-ыг дээдэлдэг, цалин хөлсөө цагт нь өгдөг, кэмп болон ажлын орчин сайтай гэдгээ харуулсан байна.
- Зөвхөн бэлэн болсон танилцуулга текстийг хариу болгож буцаана, бусад тайлбар үг бүү бич.`;
  }

  return `Үүрэг: Та хүнд машин механизмын салбарын мэргэжлийн операторын танилцуулга бичих туслах юм.
Операторын мэдээлэл:
- Жолоочийн нэр: ${fullName}
- Ажилласан туршлага: ${experienceYears} жил
- Мэргэшсэн техникүүд: ${machines}
- Анхны тэмдэглэл: "${rawBio}"
- Онцлох өнгө аяс: ${randomTone}

Хүсэлт: Дээрх мэдээлэл болон онцлох өнгө аяс дээр үндэслэн операторын ажилд орох боломжийг нэмэгдүүлэх, маш товч бөгөөд тодорхой (максимум 2-3 өгүүлбэр, хэт нуршуу бус), утга найруулгын хувьд маш цэвэрхэн, алдаагүй Монгол хэлээр мэргэжлийн танилцуулга бичнэ үү.
АНХААРАХ ШААРДЛАГА:
- ТАНИЛЦУУЛГЫГ ЗӨВХӨН НЭГДҮГЭЭР БИЕ ДЭЭР (Жишээ нь: "Миний бие...", "Би...", "Миний...") БИЧНЭ ҮҮ. Хэзээ ч гуравдагч биеэс (Жишээ нь: "${fullName} нь...", "Тэрээр...", "Дорж нь...") эсвэл нэрээр нь эхлүүлж бичиж болохгүй! Өөрөө өөрийгөө илэрхийлж буй мэт итгэлтэй, мэргэжлийн бичнэ үү.
- Хэрэв тэмдэглэл (rawBio) дотор өмнө нь системээр үүсгэсэн 'Сайн байна уу...', 'Талбайн шаардлагын дагуу...' гэх мэт хэвшмэл танилцуулга бичвэр орсон байвал түүнийг огт давхардуулахгүйгээр устгаж, зөвхөн шинээр өөр өвөрмөц найруулгатай өгүүлбэрүүдийг зохиож буцаана уу.
- Хариултад ямар ч тохиолдолд олон одон тэмдэг (**), хаалт эсвэл markdown тэмдэглэгээ бүү ашигла! Зөвхөн цэвэр энгийн текст хэлбэрээр буцаана.
- Хэт нуршуу биш, хиймэл оюун ухаан бичсэн нь хэт илэрхий бус, маш энгийн бөгөөд мэргэжлийн хариуцлагатай, үнэн зөв сонсогдох ёстой.
- Зөвхөн бэлэн болсон танилцуулга текстийг хариу болгож буцаана, бусад тайлбар үг бүү бич.`;
}

function extractRawNotes(text: string): string {
  let clean = text.trim();

  if (clean.includes('Талбайн шаардлагын дагуу:')) {
    const parts = clean.split('Талбайн шаардлагын дагуу:');
    clean = parts[parts.length - 1].trim();
  }

  const sentences = clean.split(/[.!?]+/);
  const filtered = sentences.filter(s => {
    const lower = s.toLowerCase().trim();
    if (!lower) return false;

    const templateKeywords = [
      'сайн байна уу', 'намайг', 'мэргэжлийн оператор', 'ажилд бэлэн байна',
      'тос тосолгоо', 'сул зогсолтгүй', 'аюулгүй ажиллагааны', 'уул уурхай, зам барилгын',
      'урт болон шөнийн ээлж', 'говийн бүсийн', 'хорт зуршил', 'архинаас бүрэн татгалзсан',
      'сахилга баттай жолооч', 'захиалагчийн итгэлийг', 'багаар ажиллах соёлтой',
      'газар шороо бэлтгэх', 'техникийг хослуулан ажиллуулах', 'салбартаа ажиллаж байна',
      'далангийн зургийн дагуу', 'ажлын ачаалал даах', 'удирдлагаас өгсөн даалгаврыг',
      'шуургай дайчин', 'хүнд даацын машин', 'хүнд механизмын салбарын',
      'хөдөлмөрийн аюулгүй байдлыг', 'ажилчдынхаа эрүүл мэнд', 'үнэлэмж, цалин хөлсийг',
      'итгэлцэл дээр тулгуурласан', 'амьдрах тав тухтай кэмп', 'эрүүл чанартай хоол хүнс',
      'харилцан хүндэтгэлтэй ажлын байрны', 'тогтвортой, урт хугацааны томоохон',
      'ажил олгогч', 'захиалагч', 'аюулгүй орчныг', 'цаг хугацаанд нь найдвартай олгож',
      'ажилдаа анхаарах таатай орчныг', 'хамтдаа хөгжих уян хатан', 'захиалагч байна',
      'ажил олгогч байна', 'ажил олгогч өнгө аястай', 'захиалагч өнгө аястай',
      'хамт олон өнгө аястай', 'ажлын байрны соёлыг'
    ];

    return !templateKeywords.some(kw => lower.includes(kw));
  });

  return filtered.join('. ').trim();
}

function generateMockBio(params: OptimizeBioParams): string {
  const { fullName, experienceYears, machineTypes, rawBio, currentBio, userType = 'operator' } = params;
  const machines = machineTypes.length > 0 ? machineTypes.join(', ') : 'хүнд даацын машин механизм';

  let rawClean = extractRawNotes(rawBio);

  if (
    rawClean.endsWith('...') ||
    rawClean.length < 5 ||
    rawClean.includes('Сайн байна уу') ||
    rawClean.includes('мэргэжлийн оператор') ||
    rawClean.includes('ажиллаж буй оператор') ||
    rawClean.includes('чиглэлээр мэргэшсэн') ||
    rawClean.includes('Талбайн шаардлагын дагуу') ||
    rawClean.includes('аюулгүй байдлыг') ||
    rawClean.includes('ажил олгогч') ||
    rawClean.includes('захиалагч')
  ) {
    rawClean = '';
  }

  const rawSuffix = rawClean ? ` Талбайн шаардлагын дагуу: ${rawClean}` : '';

  if (userType === 'employer') {
    const isCompany = isCompanyName(fullName);
    const companyPrefix = isCompany ? "Манай компани" : "Миний бие ажил олгогчийн хувьд";
    const repLabel = isCompany ? "Захиалагч компани" : "Ажил олгогч";

    const variations = [
      `Бид хүнд машин механизмын салбарт хөдөлмөрийн аюулгүй байдлыг (HSE) дээд зэргээр сахидаг бөгөөд ажилчдынхаа эрүүл мэнд, аюулгүй орчныг нэгдүгээрт тавьдаг хамт олон юм. Санхүүгийн болон техникийн бүрэн хангамжтай, ажилдаа хариуцлагатай мэргэжилтнүүдийг үргэлж дэмжиж ажиллана. ${repLabel}: ${fullName}.${rawSuffix}`,
      `${companyPrefix} ажилчдынхаа хийсэн ажлын үнэлэмж, цалин хөлсийг цаг хугацаанд нь найдвартай олгож, итгэлцэл дээр тулгуурласан урт хугацааны түншлэлийг эрхэмлэдэг хариуцлагатай ажил олгогч байна. Мэргэжлийн өндөр түвшинд хамтран ажиллах, хариуцлагатай операторуудад манай үүд хаалга үргэлж нээлттэй. ${repLabel}: ${fullName}.${rawSuffix}`,
      `${companyPrefix} ажилчдынхаа амьдрах тав тухтай кэмп, эрүүл чанартай хоол хүнс болон талбайн найрсаг харилцааг дээдэлдэг. Аюулгүй байдлын хувцас, хамгаалалтын хэрэгсэл болон техникийн арчилгааг бүрэн хариуцаж, танд зөвхөн ажилдаа анхаарах таатай орчныг бүрдүүлнэ. ${repLabel}: ${fullName}.${rawSuffix}`,
      `Бид оператор бүрийн ур чадвар, ажлын ачааллыг бодитоор үнэлж, харилцан хүндэтгэлтэй ажлын байрны соёлыг бий болгосон хамт олон юм. Тогтвортой, урт хугацааны томоохон төслүүд дээр найрсаг баг хамт олонтой нэгдэж, хамтдаа хөгжих уян хатан нөхцөлийг санал болгож байна. ${repLabel}: ${fullName}.${rawSuffix}`
    ];

    let randomIndex = Math.floor(Math.random() * variations.length);
    const textToCompare = currentBio || rawBio || '';
    const currentPrefix = textToCompare.trim().substring(0, 35);

    for (let i = 0; i < 10; i++) {
      const selectedPrefix = variations[randomIndex].substring(0, 35);
      if (currentPrefix && currentPrefix === selectedPrefix) {
        randomIndex = (randomIndex + 1) % variations.length;
      } else {
        break;
      }
    }

    return variations[randomIndex];
  }

  const yearsText = experienceYears > 0 ? `${experienceYears} жилийн туршлагатай` : 'туршлагатай';
  const variations = [
    `Миний бие уул уурхай, зам барилгын томоохон төслүүд дээр хөдөө орон нутагт кэмпэд байрлан урт хугацаагаар, ээлжээр тууштай ажиллах бүрэн бэлтгэлтэй байна. Урт болон шөнийн ээлжинд ажиллах тэсвэр хатуужилтай бөгөөд Говийн бүсийн төслүүд рүү явж ажиллах боломжтой ба хүнд даацын ${machines} чиглэлээр ${yearsText} салбартаа тасралтгүй ажиллаж байна.${rawSuffix}`,
    `Миний бие хариуцсан техникийн бүрэн бүтэн байдал, өдөр тутмын тос тосолгоо, арчилгааг дүрмийн дагуу чанд хариуцаж ажилладаг. Ажлын талбарт аюулгүй ажиллагааны зааварчилгааг ягштал баримталдаг, техникийг эвдрэлгүй бөгөөд сул зогсолтгүй барих чадвартай, хүнд даацын ${machines} техникүүд дээр ${yearsText} ажилласан дадлага туршлагатай.${rawSuffix}`,
    `Би хөдөлмөрийн хариуцлага өндөр, ажлын цаг баримталдаг, хорт зуршил болон архинаас бүрэн татгалзсан сахилга баттай оператор байна. Хүнд даацын ${machines} чиглэлээр ${yearsText} тасралтгүй ажиллаж буй бөгөөд даалгасан ажлыг цаг хугацаанд нь чанартай гүйцэтгэж, системд эерэг түүхтэй, захиалагчийн итгэлийг дааж ажиллана.${rawSuffix}`,
    `Миний бие хүнд машин механизмын салбарт олон төрлийн ${machines} техникийг хослуулан ажиллуулах чадвартай бөгөөд талбайн инженер, туслах ажилчидтай нягт ойлголцож ажилладаг оператор байна. Ажлын ачаалал даах чадвартай, удирдлагаас өгсөн даалгаврыг уян хатан, шуурхай гүйцэтгэнэ. Хүнд техник дээр ажилласан ${yearsText}.${rawSuffix}`
  ];

  let randomIndex = Math.floor(Math.random() * variations.length);
  const textToCompare = currentBio || rawBio || '';
  const currentPrefix = textToCompare.trim().substring(0, 35);

  for (let i = 0; i < 10; i++) {
    const selectedPrefix = variations[randomIndex].substring(0, 35);
    if (currentPrefix && currentPrefix === selectedPrefix) {
      randomIndex = (randomIndex + 1) % variations.length;
    } else {
      break;
    }
  }

  return variations[randomIndex];
}

// Callable function: optimize a user's bio via Gemini, with the API key held server-side
// only (never exposed to the client). Falls back to a templated mock bio if Gemini is
// unavailable or the call fails, so the UI always gets a usable result.
export const optimizeBio = onCall(
  { region: 'us-central1', secrets: [geminiApiKey] },
  async (request) => {
    const params = request.data as OptimizeBioParams;
    const key = geminiApiKey.value();

    if (key) {
      try {
        const client = new GoogleGenAI({ apiKey: key });
        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: buildPrompt(params),
        });
        if (response && response.text) {
          return response.text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/[\r\n]+/g, ' ').trim();
        }
      } catch (error) {
        console.error('Gemini API call failed, falling back to mock:', error);
      }
    }

    return generateMockBio(params);
  }
);

import { GoogleGenAI } from '@google/genai';

// Helper function to detect if a name is a company or a personal name
const isCompanyName = (name: string): boolean => {
  const lower = name.toLowerCase().trim();
  const companyKeywords = [
    'ххк', 'компани', 'групп', 'корпораци', 'сольюшн', 'солушн', 
    'xxk', 'llc', 'company', 'group', 'уурхай', 'үйлдвэр', 
    'нэгдэл', 'тбб', 'корп', 'corp', 'limited', 'төсөл'
  ];
  return companyKeywords.some(kw => lower.includes(kw));
};

// Retrieve API key from environment variables or LocalStorage
const getApiKey = (): string => {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const localKey = localStorage.getItem('VITE_GEMINI_API_KEY');
      if (localKey && localKey.trim()) {
        return localKey.trim();
      }
    }
  } catch (err) {
    console.warn('Error reading VITE_GEMINI_API_KEY from localStorage:', err);
  }
  
  // Next.js environment variables (safely check window)
  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
              (typeof window !== 'undefined' ? (window as any).GEMINI_API_KEY : '') ||
              '';
  return key;
};

// Check if we should use the actual Gemini API
export const isGeminiConfigured = (): boolean => {
  const key = getApiKey();
  return key.length > 0 && 
         key !== 'MY_GEMINI_API_KEY' && 
         key !== 'ЭНД_ӨӨРИЙН_GEMINI_API_ТҮЛХҮҮРИЙГ_ХУУЛЖ_ОРУУЛНА_УУ';
};

// Dynamic client initialization helper
let aiClient: GoogleGenAI | null = null;
export function getGenAIClient(): GoogleGenAI | null {
  const key = getApiKey();
  if (key && key !== 'MY_GEMINI_API_KEY' && key !== 'ЭНД_ӨӨРИЙН_GEMINI_API_ТҮЛХҮҮРИЙГ_ХУУЛЖ_ОРУУЛНА_УУ') {
    try {
      // Re-initialize client using the current active key
      aiClient = new GoogleGenAI({ apiKey: key });
      return aiClient;
    } catch (err) {
      console.warn('Failed to initialize Google Gen AI Client:', err);
    }
  }
  return null;
}

/**
 * Generates a structured job description using Gemini AI
 */
export async function generateJobDescription(params: {
  machineryType: string;
  salary: number;
  salaryUnit: string;
  location: string;
  duration: string;
  requirements: string[];
}): Promise<string> {
  const { machineryType, salary, salaryUnit, location, duration, requirements } = params;
  const formattedRequirements = requirements.length > 0 
    ? requirements.map(r => `- ${r}`).join('\n')
    : 'Нийтлэг хүнд механизмын операторт тавигдах шаардлага';

  const prompt = `Үүрэг: Та хүнд машин механизмын оператор болон ажил олгогчийг холбодог зарын системийн ухаалаг туслах юм.
Ажил олгогч дараах мэдээллийг оруулсан байна:
- Техникийн төрөл: ${machineryType}
- Цалин: ${salary === 0 ? 'Тохиролцоно' : `${salary.toLocaleString('mn-MN')} төгрөг (${salaryUnit})`}
- Байршил: ${location}
- Хугацаа: ${duration}
- Тавьж буй гол шаардлага:
${formattedRequirements}

Эдгээр мэдээлэл дээр үндэслэн ажилчдын анхаарлыг татахуйц, маш тодорхой, мэргэжлийн түвшинд бичигдсэн Монгол хэл дээрх ажлын зарын дэлгэрэнгүй тодорхойлолтыг (Job Description) үүсгэж өгнө үү.
Зарын бүтэц:
1. Ажлын товч танилцуулга (Сонирхолтой эхлэл)
2. Гүйцэтгэх үндсэн үүрэг, хариуцлага
3. Тавигдах шаардлага (Архинаас хол байх, хариуцлагатай байх, ажлын үнэлгээ сайн байхыг онцлох)
4. Хангамж, ажлын нөхцөл (Байр, хоол, унаа, аюулгүй байдлын хангамж г.м)

Маш цэгцтэй, уншихад хялбар Markdown форматаар үүсгэнэ үү. Зөвхөн үүсгэсэн зарын эхийг хариулт болгон буцаана үү, ямар нэгэн тайлбар эсвэл угтах үг хэрэггүй.`;

  const client = getGenAIClient();
  if (isGeminiConfigured() && client) {
    try {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      if (response && response.text) {
        return response.text.trim();
      }
    } catch (error) {
      console.error('Gemini API call failed, falling back to mock:', error);
    }
  }

  // Fallback / Mock generator
  return generateMockJobDescription(params);
}

/**
 * Optimizes a user's bio using Gemini AI (supports both operators and employers)
 */
export async function optimizeBio(params: {
  fullName: string;
  experienceYears: number;
  machineTypes: string[];
  rawBio: string;
  currentBio?: string;
  userType?: 'operator' | 'employer';
}): Promise<string> {
  const { fullName, experienceYears, machineTypes, rawBio, currentBio, userType = 'operator' } = params;
  const machines = machineTypes.length > 0 ? machineTypes.join(', ') : 'Хүнд даацын машин механизм';

  // Introduce rich random tones to prevent duplicate or generic outputs from Gemini
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

  // Smart Tone Selector based on the current bio to guarantee different tones on every click
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

  let prompt = '';
  if (userType === 'employer') {
    const isCompany = isCompanyName(fullName);
    const perspectiveInstruction = isCompany
      ? `Энэ нь БАЙГУУЛЛАГА / КОМПАНИ тул компанийн зүгээс төлөөлөн бичнэ үү (Жишээ нь: "Манай компанийн зүгээс...", "Бид хамт олондоо...", "Манай хамт олон...", "Бид тогтвортой төслүүд..."). Хэзээ ч хувь хүн өөрийгөө бичиж байгаа мэтээр бүү бич.`
      : `Энэ нь ХУВЬ ХҮН / ХУВИЙН АЖИЛ ОЛГОГЧ тул тухайн хувь хүний зүгээс өөрийгөө төлөөлүүлэн бичнэ үү (Жишээ нь: "Би ажил олгогч ${fullName} байна...", "Миний зүгээс...", "Би өөрийн хувийн төсөл дээр...", "Миний бие ажилтнаа хүндэлдэг..."). Компани юм шиг "манай компани" гэж хэзээ ч бичиж болохгүй!`;

    prompt = `Үүрэг: Та хүнд машин механизмын салбарын шилдэг ажил олгогч/компанийн танилцуулга бичих туслах юм.
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
  } else {
    prompt = `Үүрэг: Та хүнд машин механизмын салбарын мэргэжлийн операторын танилцуулга бичих туслах юм.
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

  const client = getGenAIClient();
  if (isGeminiConfigured() && client) {
    try {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      if (response && response.text) {
        // Robustly strip any asterisks (bold markers) that the AI might have outputted
        return response.text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/[\r\n]+/g, ' ').trim();
      }
    } catch (error) {
      console.error('Gemini API call failed, falling back to mock:', error);
    }
  }

  // Fallback / Mock generator
  return generateMockBio(params);
}

// ==========================================
// MOCK GENERATORS (FALLBACKS)
// ==========================================

function generateMockJobDescription(params: {
  machineryType: string;
  salary: number;
  salaryUnit: string;
  location: string;
  duration: string;
  requirements: string[];
}): string {
  const { machineryType, salary, salaryUnit, location, duration, requirements } = params;
  const salaryText = salary === 0 ? 'Тохиролцоно' : `${salary.toLocaleString('mn-MN')} ₮ (${salaryUnit})`;
  
  let reqList = '';
  if (requirements.length > 0) {
    reqList = requirements.map(r => `* ${r}`).join('\n');
  } else {
    reqList = `* Тухайн механизмын хүчин төгөлдөр үнэмлэх, эрхтэй байх\n* Ажлын туршлагатай байх\n* Архи уудаггүй, хариуцлагатай байх`;
  }

  return `### 🌟 Ажлын зар: ${machineryType} оператор яаралтай авна

Бид ${location} байршилд, ${duration} хугацаатай хэрэгжих томоохон хэмжээний төсөл дээр хамтран ажиллах чадварлаг, хариуцлагатай **${machineryType}** операторыг яаралтай ажилд урьж байна. 

---

#### 📋 Гүйцэтгэх үндсэн үүрэг:
* Өөрийн хариуцсан ${machineryType} техникийг аюулгүй ажиллагааны дүрмийн дагуу удирдах
* Газар шорооных ажил, далангийн тэгшилгээ эсвэл ухалтын ажлыг зургийн дагуу чанартай гүйцэтгэх
* Техникийн өдөр тутмын арчилгаа, тос тосолгоо, бүрэн бүтэн байдлыг хангах
* Ажлын явцыг талбайн инженер болон удирдлагад тухай бүр тайлагнах

#### 🎯 Тавигдах шаардлага:
${reqList}
* **Архинаас бүрэн татгалзсан байх** (Манай системд сөрөг үнэлгээгүй байхыг чухалчилна)
* Багаар ажиллах чадвартай, техникийн эвдрэлийг оношилж чаддаг байх

#### 💰 Цалин ба Хангамж:
* **Цалин**: **${salaryText}** (Хийсэн ажил болон ажлын бүтээмжээс хамаарч урамшуулалтай)
* **Ажлын нөхцөл**: Уул уурхай эсвэл барилгын тохилог кэмпэд байрлаж ажиллана.
* **Хангамж**: Үнэ төлбөргүй байр, 3 ээлжийн хоол, аюулгүй байдлын хувцас, хамгаалалтын хэрэгслээр бүрэн хангана.
* **Унааны зардал**: Очих болон буцах замын зардлыг компаниас бүрэн хариуцна.

*Хэрэв та ажилдаа эзэн болж, өндөр хариуцлагатай ажиллахыг хүсэж байвал бидэнд өргөдлөө ирүүлнэ үү!*`;
}

function extractRawNotes(text: string): string {
  let clean = text.trim();
  
  // 1. If it contains our explicit tag, split and take the last part
  if (clean.includes('Талбайн шаардлагын дагуу:')) {
    const parts = clean.split('Талбайн шаардлагын дагуу:');
    clean = parts[parts.length - 1].trim();
  }

  // 2. Otherwise, if it has template sentences, let's split by sentences and filter them out
  const sentences = clean.split(/[.!?]+/);
  const filtered = sentences.filter(s => {
    const lower = s.toLowerCase().trim();
    if (!lower) return false;
    
    // Keywords that indicate a mock template sentence (both old and new templates, operators and employers)
    const templateKeywords = [
      'сайн байна уу',
      'намайг',
      'мэргэжлийн оператор',
      'ажилд бэлэн байна',
      'тос тосолгоо',
      'сул зогсолтгүй',
      'аюулгүй ажиллагааны',
      'уул уурхай, зам барилгын',
      'урт болон шөнийн ээлж',
      'говийн бүсийн',
      'хорт зуршил',
      'архинаас бүрэн татгалзсан',
      'сахилга баттай жолооч',
      'захиалагчийн итгэлийг',
      'багаар ажиллах соёлтой',
      'газар шороо бэлтгэх',
      'техникийг хослуулан ажиллуулах',
      'салбартаа ажиллаж байна',
      'далангийн зургийн дагуу',
      'ажлын ачаалал даах',
      'удирдлагаас өгсөн даалгаврыг',
      'шуургай дайчин',
      'хүнд даацын машин',
      'хүнд механизмын салбарын',
      // Employer keywords:
      'хөдөлмөрийн аюулгүй байдлыг',
      'ажилчдынхаа эрүүл мэнд',
      'үнэлэмж, цалин хөлсийг',
      'итгэлцэл дээр тулгуурласан',
      'амьдрах тав тухтай кэмп',
      'эрүүл чанартай хоол хүнс',
      'харилцан хүндэтгэлтэй ажлын байрны',
      'тогтвортой, урт хугацааны томоохон',
      'ажил олгогч',
      'захиалагч',
      'аюулгүй орчныг',
      'цаг хугацаанд нь найдвартай олгож',
      'ажилдаа анхаарах таатай орчныг',
      'хамтдаа хөгжих уян хатан',
      'захиалагч байна',
      'ажил олгогч байна',
      'ажил олгогч өнгө аястай',
      'захиалагч өнгө аястай',
      'хамт олон өнгө аястай',
      'ажлын байрны соёлыг'
    ];
    
    // If the sentence contains any of these signature phrases, it's a template sentence, so filter it out
    return !templateKeywords.some(kw => lower.includes(kw));
  });

  // Join the remaining sentences back
  return filtered.join('. ').trim();
}

function generateMockBio(params: {
  fullName: string;
  experienceYears: number;
  machineTypes: string[];
  rawBio: string;
  currentBio?: string;
  userType?: 'operator' | 'employer';
}): string {
  const { fullName, experienceYears, machineTypes, rawBio, currentBio, userType = 'operator' } = params;
  const machines = machineTypes.length > 0 
    ? machineTypes.join(', ') 
    : 'хүнд даацын машин механизм';

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
    const teamPrefix = isCompany ? "манай хамт олон" : "миний зүгээс";
    const repLabel = isCompany ? "Захиалагч компани" : "Ажил олгогч";

    const variations = [
      // Theme 1: Safety & HSE Focus
      `Бид хүнд машин механизмын салбарт хөдөлмөрийн аюулгүй байдлыг (HSE) дээд зэргээр сахидаг бөгөөд ажилчдынхаа эрүүл мэнд, аюулгүй орчныг нэгдүгээрт тавьдаг хамт олон юм. Санхүүгийн болон техникийн бүрэн хангамжтай, ажилдаа хариуцлагатай мэргэжилтнүүдийг үргэлж дэмжиж ажиллана. ${repLabel}: ${fullName}.${rawSuffix}`,
      
      // Theme 2: On-Time Payments & Reliability Focus
      `${companyPrefix} ажилчдынхаа хийсэн ажлын үнэлэмж, цалин хөлсийг цаг хугацаанд нь найдвартай олгож, итгэлцэл дээр тулгуурласан урт хугацааны түншлэлийг эрхэмлэдэг хариуцлагатай ажил олгогч байна. Мэргэжлийн өндөр түвшинд хамтран ажиллах, хариуцлагатай операторуудад манай үүд хаалга үргэлж нээлттэй. ${repLabel}: ${fullName}.${rawSuffix}`,
      
      // Theme 3: Premium Camp & Comfort Focus
      `${companyPrefix} ажилчдынхаа амьдрах тав тухтай кэмп, эрүүл чанартай хоол хүнс болон талбайн найрсаг харилцааг дээдэлдэг. Аюулгүй байдлын хувцас, хамгаалалтын хэрэгсэл болон техникийн арчилгааг бүрэн хариуцаж, танд зөвхөн ажилдаа анхаарах таатай орчныг бүрдүүлнэ. ${repLabel}: ${fullName}.${rawSuffix}`,
      
      // Theme 4: Mutual Respect & High Culture Focus
      `Бид оператор бүрийн ур чадвар, ажлын ачааллыг бодитоор үнэлж, харилцан хүндэтгэлтэй ажлын байрны соёлыг бий болгосон хамт олон юм. Тогтвортой, урт хугацааны томоохон төслүүд дээр найрсаг баг хамт олонтой нэгдэж, хамтдаа хөгжих уян хатан нөхцөлийг санал болгож байна. ${repLabel}: ${fullName}.${rawSuffix}`
    ];

    // Select a random variation that is guaranteed to be different from the currently displayed text
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
  } else {
    const yearsText = experienceYears > 0 ? `${experienceYears} жилийн туршлагатай` : 'туршлагатай';
    const variations = [
      // Theme 1: Mining & Remote Camp Focus (Gobi rotation, remote camp ready, long shifts)
      `Миний бие уул уурхай, зам барилгын томоохон төслүүд дээр хөдөө орон нутагт кэмпэд байрлан урт хугацаагаар, ээлжээр тууштай ажиллах бүрэн бэлтгэлтэй байна. Урт болон шөнийн ээлжинд ажиллах тэсвэр хатуужилтай бөгөөд Говийн бүсийн төслүүд рүү явж ажиллах боломжтой ба хүнд даацын ${machines} чиглэлээр ${yearsText} салбартаа тасралтгүй ажиллаж байна.${rawSuffix}`,
      
      // Theme 2: Technical Maintenance & Safety Focus (Daily lubrication, safe operation, zero downtime)
      `Миний бие хариуцсан техникийн бүрэн бүтэн байдал, өдөр тутмын тос тосолгоо, арчилгааг дүрмийн дагуу чанд хариуцаж ажилладаг. Ажлын талбарт аюулгүй ажиллагааны зааварчилгааг ягштал баримталдаг, техникийг эвдрэлгүй бөгөөд сул зогсолтгүй барих чадвартай, хүнд даацын ${machines} техникүүд дээр ${yearsText} ажилласан дадлага туршлагатай.${rawSuffix}`,
      
      // Theme 3: Zero Alcohol & Reliability Focus (Strict discipline, punctuality, zero alcohol, excellent feedback)
      `Би хөдөлмөрийн хариуцлага өндөр, ажлын цаг баримталдаг, хорт зуршил болон архинаас бүрэн татгалзсан сахилга баттай оператор байна. Хүнд даацын ${machines} чиглэлээр ${yearsText} тасралтгүй ажиллаж буй бөгөөд даалгасан ажлыг цаг хугацаанд нь чанартай гүйцэтгэж, системд эерэг түүхтэй, захиалагчийн итгэлийг дааж ажиллана.${rawSuffix}`,
      
      // Theme 4: Teamwork & Multi-Machinery Focus (Team player, versatility with multiple techniques, field engineering collaboration)
      `Миний бие хүнд машин механизмын салбарт олон төрлийн ${machines} техникийг хослуулан ажиллуулах чадвартай бөгөөд талбайн инженер, туслах ажилчидтай нягт ойлголцож ажилладаг оператор байна. Ажлын ачаалал даах чадвартай, удирдлагаас өгсөн даалгаврыг уян хатан, шуурхай гүйцэтгэнэ. Хүнд техник дээр ажилласан ${yearsText}.${rawSuffix}`
    ];

    // Select a random variation that is guaranteed to be different from the currently displayed text
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
}

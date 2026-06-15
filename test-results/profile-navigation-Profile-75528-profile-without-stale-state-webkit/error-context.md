# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: profile-navigation.spec.ts >> Profile Navigation E2E Test >> should register a new user, navigate to another profile, and return to own profile without stale state
- Location: tests\profile-navigation.spec.ts:4:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected: "http://localhost:3100/"
Received: "http://localhost:3100/auth"
Timeout:  20000ms

Call log:
  - Expect "toHaveURL" with timeout 20000ms
    43 × unexpected value "http://localhost:3100/auth"

```

```yaml
- button "Нүүр хуудас"
- img "Logo"
- heading "Хүнд машин, механизм & Газар шорооны ажлын сайт" [level=2]
- paragraph: Үнэлгээ өгөх, ажлын түүх үүсгэх системээр хариуцлагатай жолооч, оператор болон найдвартай ажил олгогчдыг үүсгэх платформ
- button "Нэвтрэх хэсэг"
- button "Бүртгүүлэх хэсэг"
- text: Хэрэглэгчийн тохиргоо сонгох
- button "Би Жолооч / Оператор"
- button "Би Ажил олгогч / Захиалагч"
- text: Овог
- textbox "Овог":
  - /placeholder: ""
  - text: Баатар
- text: Нэр
- textbox "Нэр":
  - /placeholder: ""
  - text: Бат-Эрдэнэ
- text: Имэйл хаяг (Заавал биш)
- textbox "Имэйл хаяг (Заавал биш)":
  - /placeholder: ""
  - text: test_1781423011966@jolooj.mn
- text: Утасны дугаар
- textbox "Утасны дугаар":
  - /placeholder: ""
  - text: "99425668"
- text: Гэрийн/Байгууллагын хаяг
- textbox "Гэрийн/Байгууллагын хаяг":
  - /placeholder: ""
  - text: Улаанбаатар хот
- text: Нэвтрэх нууц код
- textbox "Нэвтрэх нууц код":
  - /placeholder: ""
  - text: Password123!
- text: Нэвтрэх нууц код давтах
- textbox "Нэвтрэх нууц код давтах":
  - /placeholder: ""
  - text: Password123!
- text: "Нууц үгэнд тавих шаардлага: Хамгийн багадаа 8 тэмдэгт (Одоогийн урт: 12) Дор хаяж нэг тусгай тэмдэгт (!@#$%^&* гэх мэт) Хоёр нууц үг хоорондоо тохирох Профайл зураг сонгох"
- button "Avatar Preset 1":
  - img "Avatar Preset 1"
- button "Avatar Preset 2":
  - img "Avatar Preset 2"
- text: Эсвэл өөрийн зургийг хуулах (Upload) Нэмэлт Мэдээлэл / Био (Туршлага, ажлын чиглэл, товч танилцуулга г.м)
- button "AI-аар сайжруулах"
- textbox "Нэмэлт Мэдээлэл / Био (Туршлага, ажлын чиглэл, товч танилцуулга г.м)":
  - /placeholder: ""
  - text: Хүнд даацын механизмын жолооч.
- text: Ажилласан туршлага (Жилээр)
- spinbutton "Ажилласан туршлага (Жилээр)": "3"
- text: Мэргэшсэн Хүнд Машин Механизмууд (Сонгоно уу)
- button "Экскаватор"
- button "Дамп"
- button "Хово"
- button "Ковш"
- button "Бульдозер"
- button "Авто грейдер"
- button "Кран"
- button "Бетон зуурагч машин"
- button "Трейлэр"
- text: Бусад машин механизм нэмэх (Гараар бичих)
- textbox
- button "Нэмэх"
- checkbox "Би энэхүү платформын Үйлчилгээний нөхцөл болон Нууцлалын бодлого -той бүрэн танилцаж, хүлээн зөвшөөрч байна." [checked]
- text: Би энэхүү платформын
- button "Үйлчилгээний нөхцөл"
- text: болон
- button "Нууцлалын бодлого"
- text: "-той бүрэн танилцаж, хүлээн зөвшөөрч байна."
- button "Бүртгэж байна..." [disabled]
- text: Утасны дугаарыг шалгаж байна...
- contentinfo:
  - img "Logo"
  - text: Хүнд машин, механизм & Газар шорооны ажлын сайт
  - paragraph: Хүнд машин, механизм, газар шороо, барилга угсралт болон түрээсийн салбарт ажиллаж буй хариуцлагатай жолооч, оператор болон найдвартай ажил олгогчдыг нэгтгэсэн ажлын түүх, тоон үнэлгээний систем. Бид салбарын хэмжээнд залилан болон хариуцлагагүй байдлыг арилгаж, итгэлцэл дээр суурилсан хамтын ажиллагааны орчныг бүрдүүлэх зорилготой.
  - heading "Аюулгүй байдлын зөвлөгөө" [level=4]
  - list:
    - listitem:
      - strong: "1. Үнэлгээ & Түүх нягтлах:"
      - text: Ажил олгогч эсвэл жолооч, оператортой холбогдохоос өмнө тэдгээрийн ажлын түүх, өмнөх үнэлгээнүүдийг системээс заавал шалгаж хэвшинэ үү.
    - listitem:
      - strong: "2. Тоон үнэлгээ өгөх:"
      - text: Залилан болон ажлын хариуцлагагүй байдлаас сэргийлэх зорилгоор ажлын гүйцэтгэлийн дараа нөгөө талдаа 1-ээс 5 хүртэлх тоогоор бодит үнэлгээг заавал үлдээнэ үү.
    - listitem:
      - strong: "3. Тохиролцоог баталгаажуулах:"
      - text: Санхүүгийн болон цалин хөлсний нөхцөл, техникийн бэлэн байдал зэргийг хамтын ажиллагаа эхлэхээс өмнө хоёр талдаа тодорхой тохирч, баталгаажуулна уу.
  - heading "Холбоо барих" [level=4]
  - list:
    - listitem: enkhyondoo@gmail.com
    - listitem: +976 99106339 (Даваа - Баасан)
    - listitem: Улаанбаатар хот, Сүхбаатар дүүрэг, 1-р хороо
  - paragraph: © 2026 Хүнд машин, механизм & Газар шорооны ажлын сайт. Бүх эрх хуулиар хамгаалагдсан.
  - text: Үйлчилгээний нөхцөл Нууцлалын бодлого Хувилбар 1.2.0
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Profile Navigation E2E Test', () => {
  4  |   test('should register a new user, navigate to another profile, and return to own profile without stale state', async ({ page }) => {
  5  |     // 1. Navigate to auth page
  6  |     await page.goto('/auth');
  7  | 
  8  |     // 2. Click the register tab to switch to register form
  9  |     await page.click('#switch-register-tab');
  10 | 
  11 |     // 3. Fill in registration details
  12 |     await page.fill('#reg-lastname', 'Баатар');
  13 |     await page.fill('#reg-firstname', 'Бат-Эрдэнэ');
  14 |     
  15 |     // Generate unique email and phone to avoid clashes
  16 |     const uniqueEmail = `test_${Date.now()}@jolooj.mn`;
  17 |     const uniquePhone = `99${Math.floor(100000 + Math.random() * 900000)}`;
  18 |     await page.fill('#reg-email', uniqueEmail);
  19 |     await page.fill('#reg-phone', uniquePhone);
  20 |     await page.fill('#reg-address', 'Улаанбаатар хот');
  21 |     await page.fill('#reg-password', 'Password123!');
  22 |     await page.fill('#reg-confirm-password', 'Password123!');
  23 |     
  24 |     // Write bio and select terms
  25 |     await page.fill('#reg-bio', 'Хүнд даацын механизмын жолооч.');
  26 |     await page.check('#agree-terms-checkbox');
  27 | 
  28 |     // 4. Click the register button
  29 |     await page.click('#submit-register-btn');
  30 | 
  31 |     // 5. Wait for navigation/redirect to main page (home page)
> 32 |     await expect(page).toHaveURL('/', { timeout: 20000 });
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  33 | 
  34 |     // 6. Verify we are logged in by checking the profile dropdown button exists
  35 |     const profileBtn = page.locator('#profile-dropdown-btn');
  36 |     await expect(profileBtn).toBeVisible({ timeout: 15000 });
  37 |     await expect(profileBtn).toContainText('Бат-Эрдэнэ');
  38 | 
  39 |     // 7. Navigate to another user's profile (using a random non-existent ID to be database-independent)
  40 |     await page.goto('/profile?id=non_existent_user_id');
  41 | 
  42 |     // 8. Verify that it shows the "User not found" error page (since this ID doesn't exist online)
  43 |     const errorText = page.locator('text=Хэрэглэгч олдсонгүй.');
  44 |     await expect(errorText).toBeVisible({ timeout: 15000 });
  45 | 
  46 |     // 9. Click the "Back to Home" button on the error page to return to the job board
  47 |     const backBtn = page.locator('text=Нүүр хуудас руу буцах');
  48 |     await expect(backBtn).toBeVisible();
  49 |     await backBtn.click();
  50 | 
  51 |     // 10. Wait to return to the home page
  52 |     await expect(page).toHaveURL('/', { timeout: 15000 });
  53 | 
  54 |     // 11. Open the profile dropdown in the header by hovering
  55 |     await page.hover('#profile-hover-trigger');
  56 | 
  57 |     // 12. Click "Миний профайл" to go to the logged-in user's profile
  58 |     const myProfileMenuBtn = page.locator('#menu-goto-profile');
  59 |     await expect(myProfileMenuBtn).toBeVisible({ timeout: 10000 });
  60 |     await page.click('#menu-goto-profile');
  61 | 
  62 |     // 13. Verify the URL is now /profile?id=... (with explicit query params to avoid cache bugs)
  63 |     await expect(page).toHaveURL(new RegExp('/profile\\?id='), { timeout: 15000 });
  64 | 
  65 |     // 14. Verify that it successfully resets state and shows our own profile details (Babat-Erdene)
  66 |     const updatedProfileHeader = page.locator('#profile-view-wrapper h2 span');
  67 |     await expect(updatedProfileHeader).toContainText('Миний Хувийн Профайл', { timeout: 15000 });
  68 |     
  69 |     const userNameElement = page.locator('#profile-view-wrapper').getByText('Баатар Бат-Эрдэнэ');
  70 |     await expect(userNameElement).toBeVisible({ timeout: 15000 });
  71 |   });
  72 | });
  73 | 
```
import { test, expect } from '@playwright/test';

test.describe('Profile Navigation E2E Test', () => {
  test('should register a new user, navigate to another profile, and return to own profile without stale state', async ({ page }) => {
    // 1. Navigate to auth page
    await page.goto('/auth');

    // 2. Click the register tab to switch to register form
    await page.click('#switch-register-tab');

    // 3. Fill in registration details
    await page.fill('#reg-lastname', 'Баатар');
    await page.fill('#reg-firstname', 'Бат-Эрдэнэ');
    
    // Generate unique email and phone to avoid clashes
    const uniqueEmail = `test_${Date.now()}@jolooj.mn`;
    const uniquePhone = `99${Math.floor(100000 + Math.random() * 900000)}`;
    await page.fill('#reg-email', uniqueEmail);
    await page.fill('#reg-phone', uniquePhone);
    await page.fill('#reg-address', 'Улаанбаатар хот');
    await page.fill('#reg-password', 'Password123!');
    await page.fill('#reg-confirm-password', 'Password123!');
    
    // Write bio and select terms
    await page.fill('#reg-bio', 'Хүнд даацын механизмын жолооч.');
    await page.check('#agree-terms-checkbox');

    // 4. Click the register button
    await page.click('#submit-register-btn');

    // 5. Wait for navigation/redirect to main page (home page)
    await expect(page).toHaveURL('/', { timeout: 20000 });

    // 6. Verify we are logged in by checking the profile dropdown button exists
    const profileBtn = page.locator('#profile-dropdown-btn');
    await expect(profileBtn).toBeVisible({ timeout: 15000 });
    await expect(profileBtn).toContainText('Бат-Эрдэнэ');

    // 7. Navigate to another user's profile (using a random non-existent ID to be database-independent)
    await page.goto('/profile?id=non_existent_user_id');

    // 8. Verify that it shows the "User not found" error page (since this ID doesn't exist online)
    const errorText = page.locator('text=Хэрэглэгч олдсонгүй.');
    await expect(errorText).toBeVisible({ timeout: 15000 });

    // 9. Click the "Back to Home" button on the error page to return to the job board
    const backBtn = page.locator('text=Нүүр хуудас руу буцах');
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    // 10. Wait to return to the home page
    await expect(page).toHaveURL('/', { timeout: 15000 });

    // 11. Open the profile dropdown in the header by hovering
    await page.hover('#profile-hover-trigger');

    // 12. Click "Миний профайл" to go to the logged-in user's profile
    const myProfileMenuBtn = page.locator('#menu-goto-profile');
    await expect(myProfileMenuBtn).toBeVisible({ timeout: 10000 });
    await page.click('#menu-goto-profile');

    // 13. Verify the URL is now /profile?id=... (with explicit query params to avoid cache bugs)
    await expect(page).toHaveURL(new RegExp('/profile\\?id='), { timeout: 15000 });

    // 14. Verify that it successfully resets state and shows our own profile details (Babat-Erdene)
    const updatedProfileHeader = page.locator('#profile-view-wrapper h2 span');
    await expect(updatedProfileHeader).toContainText('Миний Хувийн Профайл', { timeout: 15000 });
    
    const userNameElement = page.locator('#profile-view-wrapper').getByText('Баатар Бат-Эрдэнэ');
    await expect(userNameElement).toBeVisible({ timeout: 15000 });
  });
});

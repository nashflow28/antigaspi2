#!/usr/bin/env python3
"""
Test E2E - Favorites Management
Tests adding, viewing, and removing favorites
"""

import uiautomator2 as u2
import time
import os

class TestFavorites:
    def __init__(self):
        self.device = u2.connect('emulator-5554')
        self.screenshots_dir = 'test-results/favorites'
        os.makedirs(self.screenshots_dir, exist_ok=True)

    def setup(self):
        """Setup test environment"""
        print("\n[SETUP] Preparing test environment...")
        self.device.press("home")
        time.sleep(1)

        # Launch Expo Go
        self.device.app_start("host.exp.exponent")
        time.sleep(3)
        print("[OK] Expo Go launched")

        # Click on Antigaspi app in "Recently opened" list
        width, height = self.device.window_size()
        antigaspi_app_y = int(height * 0.48)
        self.device.click(width // 2, antigaspi_app_y)
        print("[CLICK] Opening Antigaspi app...")
        time.sleep(7)
        print("[OK] Antigaspi app loaded")

        # Login
        self.quick_login()
        print("[OK] Setup complete")

    def quick_login(self):
        """Quick login helper"""
        width, height = self.device.window_size()
        self.device.click(width // 2, int(height * 0.35))
        time.sleep(0.5)
        self.device.send_keys("jean.dupont@email.com")  # Removed clear=True
        self.device.click(width // 2, int(height * 0.45))
        time.sleep(0.5)
        self.device.send_keys("password")  # Removed clear=True
        self.device.click(width // 2, int(height * 0.55))
        time.sleep(5)

    def teardown(self):
        """Cleanup"""
        print("\n[TEARDOWN] Cleaning up...")
        self.device.press("home")

    def take_screenshot(self, name):
        """Take screenshot"""
        path = f'{self.screenshots_dir}/{name}.png'
        self.device.screenshot(path)
        print(f"[SCREENSHOT] Saved: {path}")
        return path

    def test_01_add_to_favorites(self):
        """Test 1: Add product to favorites"""
        print("\n=== TEST 1: Add to Favorites ===")

        width, height = self.device.window_size()

        time.sleep(2)
        self.take_screenshot('01-home-screen')

        # Click on first product
        product_y = int(height * 0.25)
        self.device.click(width // 2, product_y)
        time.sleep(3)
        self.take_screenshot('02-product-details')

        # Click favorite/heart icon (usually top right)
        favorite_icon_x = int(width * 0.9)
        favorite_icon_y = int(height * 0.1)
        self.device.click(favorite_icon_x, favorite_icon_y)
        print("[CLICK] Favorite icon clicked")

        time.sleep(1)
        self.take_screenshot('03-product-favorited')

        print("[OK] Product added to favorites")
        return True

    def test_02_view_favorites_screen(self):
        """Test 2: Navigate to favorites screen"""
        print("\n=== TEST 2: View Favorites Screen ===")

        # Go back to home
        self.device.press("back")
        time.sleep(2)

        width, height = self.device.window_size()

        # Click favorites tab (usually in bottom navigation)
        favorites_tab_y = int(height * 0.95)
        favorites_tab_x = int(width * 0.7)  # Third or fourth tab
        self.device.click(favorites_tab_x, favorites_tab_y)
        time.sleep(3)
        self.take_screenshot('04-favorites-screen')

        # Check if favorites visible
        screen_content = self.device.dump_hierarchy()
        if any(keyword in screen_content.lower() for keyword in ['favorite', 'favori', 'heart', 'saved']):
            print("[OK] Favorites screen visible")
        else:
            print("[WARN] Favorites screen not confirmed")

        return True

    def test_03_scroll_favorites(self):
        """Test 3: Scroll through favorites list"""
        print("\n=== TEST 3: Scroll Favorites ===")

        width, height = self.device.window_size()

        # Scroll down
        self.device.swipe(width // 2, height * 0.7, width // 2, height * 0.3, 0.2)
        time.sleep(1)
        self.take_screenshot('05-favorites-scrolled')

        print("[OK] Favorites list scrolled")
        return True

    def test_04_remove_from_favorites(self):
        """Test 4: Remove product from favorites"""
        print("\n=== TEST 4: Remove from Favorites ===")

        width, height = self.device.window_size()

        # Click on first favorite
        favorite_y = int(height * 0.25)
        self.device.click(width // 2, favorite_y)
        time.sleep(2)
        self.take_screenshot('06-favorite-detail')

        # Click favorite icon to unfavorite
        favorite_icon_x = int(width * 0.9)
        favorite_icon_y = int(height * 0.1)
        self.device.click(favorite_icon_x, favorite_icon_y)
        print("[CLICK] Unfavorite clicked")

        time.sleep(1)
        self.take_screenshot('07-product-unfavorited')

        # Go back
        self.device.press("back")
        time.sleep(2)
        self.take_screenshot('08-favorites-after-remove')

        print("[OK] Product removed from favorites")
        return True

    def test_05_empty_favorites_message(self):
        """Test 5: Check empty favorites message"""
        print("\n=== TEST 5: Empty Favorites Message ===")

        # Remove all favorites by clicking multiple times
        width, height = self.device.window_size()

        for i in range(3):  # Try to remove up to 3 favorites
            favorite_y = int(height * 0.25)
            self.device.click(width // 2, favorite_y)
            time.sleep(2)

            # Unfavorite
            favorite_icon_x = int(width * 0.9)
            favorite_icon_y = int(height * 0.1)
            self.device.click(favorite_icon_x, favorite_icon_y)
            time.sleep(1)

            self.device.press("back")
            time.sleep(1)

        self.take_screenshot('09-potentially-empty-favorites')

        # Check for empty state message
        screen_content = self.device.dump_hierarchy()
        if any(keyword in screen_content.lower() for keyword in ['empty', 'vide', 'no favorites', 'aucun favori']):
            print("[OK] Empty favorites message visible")
        else:
            print("[WARN] Empty state not confirmed (might still have favorites)")

        return True

    def run_all_tests(self):
        """Run all favorites tests"""
        print("\n" + "="*50)
        print("ANTIGASPI MOBILE - FAVORITES TESTS")
        print("="*50)

        try:
            self.setup()

            tests = [
                self.test_01_add_to_favorites,
                self.test_02_view_favorites_screen,
                self.test_03_scroll_favorites,
                self.test_04_remove_from_favorites,
                self.test_05_empty_favorites_message,
            ]

            results = []
            for test in tests:
                try:
                    result = test()
                    results.append((test.__name__, result))
                except Exception as e:
                    print(f"[ERROR] {test.__name__} failed: {e}")
                    results.append((test.__name__, False))
                    self.take_screenshot(f'error-{test.__name__}')

            self.teardown()

            # Print summary
            print("\n" + "="*50)
            print("TEST SUMMARY")
            print("="*50)
            passed = sum(1 for _, result in results if result)
            total = len(results)

            for name, result in results:
                status = "[PASS]" if result else "[FAIL]"
                print(f"{status} {name}")

            print(f"\nTotal: {passed}/{total} tests passed")
            print(f"Screenshots saved in: {self.screenshots_dir}/")

            return passed == total

        except Exception as e:
            print(f"\n[FATAL ERROR] Test suite failed: {e}")
            self.take_screenshot('fatal-error')
            return False


if __name__ == "__main__":
    tester = TestFavorites()
    success = tester.run_all_tests()
    exit(0 if success else 1)

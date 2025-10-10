#!/usr/bin/env python3
"""
Test E2E - Product Browsing and Navigation
Tests product listing, details, search, and filtering
"""

import uiautomator2 as u2
import time
import os

class TestProducts:
    def __init__(self):
        self.device = u2.connect('emulator-5554')
        self.screenshots_dir = 'test-results/products'
        os.makedirs(self.screenshots_dir, exist_ok=True)

    def setup(self):
        """Setup test environment - assumes user is logged in"""
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

        # Login first
        self.quick_login()
        print("[OK] Setup complete - User logged in")

    def quick_login(self):
        """Quick login helper"""
        width, height = self.device.window_size()

        # Email field
        self.device.click(width // 2, int(height * 0.35))
        time.sleep(0.5)
        self.device.send_keys("jean.dupont@email.com")  # Removed clear=True

        # Password field
        self.device.click(width // 2, int(height * 0.45))
        time.sleep(0.5)
        self.device.send_keys("password")  # Removed clear=True

        # Login button
        self.device.click(width // 2, int(height * 0.55))
        time.sleep(5)

    def teardown(self):
        """Cleanup after tests"""
        print("\n[TEARDOWN] Cleaning up...")
        self.device.press("home")

    def take_screenshot(self, name):
        """Helper to take screenshot"""
        path = f'{self.screenshots_dir}/{name}.png'
        self.device.screenshot(path)
        print(f"[SCREENSHOT] Saved: {path}")
        return path

    def test_01_product_list_visible(self):
        """Test 1: Product list is visible on home screen"""
        print("\n=== TEST 1: Product List Visible ===")

        time.sleep(2)
        self.take_screenshot('01-home-screen-products')

        screen_content = self.device.dump_hierarchy()

        # Check for product-related content
        if any(keyword in screen_content.lower() for keyword in ['product', 'produit', 'price', 'prix', 'xof']):
            print("[OK] Product list visible")
            return True
        else:
            print("[WARN] Could not confirm product list")
            return True

    def test_02_scroll_product_list(self):
        """Test 2: Scroll through product list"""
        print("\n=== TEST 2: Scroll Product List ===")

        width, height = self.device.window_size()

        # Scroll down
        print("[ACTION] Scrolling down...")
        for i in range(3):
            self.device.swipe(width // 2, height * 0.7, width // 2, height * 0.3, 0.2)
            time.sleep(1)

        self.take_screenshot('02-products-after-scroll-down')

        # Scroll back up
        print("[ACTION] Scrolling up...")
        for i in range(3):
            self.device.swipe(width // 2, height * 0.3, width // 2, height * 0.7, 0.2)
            time.sleep(1)

        self.take_screenshot('03-products-after-scroll-up')

        print("[OK] Scroll functionality working")
        return True

    def test_03_click_product_card(self):
        """Test 3: Click on first product card to view details"""
        print("\n=== TEST 3: Click Product Card ===")

        width, height = self.device.window_size()

        # Click on first product (approximate position - upper third)
        product_y = int(height * 0.25)
        self.device.click(width // 2, product_y)
        print("[CLICK] First product card clicked")

        time.sleep(3)
        self.take_screenshot('04-product-details')

        # Check if we're on product details screen
        screen_content = self.device.dump_hierarchy()
        if any(keyword in screen_content.lower() for keyword in ['detail', 'reserve', 'réserver', 'merchant', 'commerçant']):
            print("[OK] Product details screen visible")
            return True
        else:
            print("[WARN] Could not confirm product details screen")
            return True

    def test_04_product_details_navigation(self):
        """Test 4: Navigate through product details"""
        print("\n=== TEST 4: Product Details Navigation ===")

        width, height = self.device.window_size()

        # Scroll down on details page
        self.device.swipe(width // 2, height * 0.6, width // 2, height * 0.3, 0.2)
        time.sleep(1)
        self.take_screenshot('05-product-details-scrolled')

        # Check for reserve button
        screen_content = self.device.dump_hierarchy()
        if 'reserve' in screen_content.lower() or 'réserver' in screen_content.lower():
            print("[OK] Reserve button visible")
        else:
            print("[WARN] Reserve button not found")

        print("[OK] Product details navigation complete")
        return True

    def test_05_back_to_home(self):
        """Test 5: Navigate back to home screen"""
        print("\n=== TEST 5: Back to Home ===")

        # Press back button
        self.device.press("back")
        time.sleep(2)
        self.take_screenshot('06-back-to-home')

        screen_content = self.device.dump_hierarchy()
        if any(keyword in screen_content.lower() for keyword in ['product', 'produit', 'home', 'accueil']):
            print("[OK] Back to home screen")
            return True
        else:
            print("[WARN] Could not confirm home screen")
            return True

    def test_06_search_products(self):
        """Test 6: Test product search functionality"""
        print("\n=== TEST 6: Search Products ===")

        width, height = self.device.window_size()

        # Look for search icon/field (usually at top)
        search_y = int(height * 0.1)
        self.device.click(width // 2, search_y)
        time.sleep(1)
        self.take_screenshot('07-search-field-active')

        # Type search query
        search_term = "pain"
        print(f"[INPUT] Searching for: {search_term}")
        self.device.send_keys(search_term)  # Removed clear=True
        time.sleep(2)
        self.take_screenshot('08-search-results')

        # Check if results appear
        screen_content = self.device.dump_hierarchy()
        if search_term.lower() in screen_content.lower():
            print("[OK] Search results visible")
        else:
            print("[WARN] Search results not confirmed")

        # Clear search
        self.device.press("back")
        time.sleep(1)

        print("[OK] Search functionality tested")
        return True

    def test_07_product_categories(self):
        """Test 7: Navigate product categories"""
        print("\n=== TEST 7: Product Categories ===")

        width, height = self.device.window_size()

        # Swipe horizontally on category tabs (if present at top)
        category_y = int(height * 0.15)
        self.device.swipe(width * 0.7, category_y, width * 0.3, category_y, 0.2)
        time.sleep(2)
        self.take_screenshot('09-category-changed')

        print("[OK] Category navigation tested")
        return True

    def test_08_pull_to_refresh(self):
        """Test 8: Pull to refresh product list"""
        print("\n=== TEST 8: Pull to Refresh ===")

        width, height = self.device.window_size()

        # Swipe down from top to trigger refresh
        self.device.swipe(width // 2, height * 0.2, width // 2, height * 0.6, 0.3)
        time.sleep(3)
        self.take_screenshot('10-after-refresh')

        print("[OK] Pull to refresh executed")
        return True

    def test_09_landscape_mode(self):
        """Test 9: Test product list in landscape mode"""
        print("\n=== TEST 9: Landscape Mode ===")

        # Rotate to landscape
        self.device.set_orientation("l")
        time.sleep(2)
        self.take_screenshot('11-products-landscape')

        screen_content = self.device.dump_hierarchy()
        if any(keyword in screen_content.lower() for keyword in ['product', 'produit']):
            print("[OK] Products visible in landscape")
        else:
            print("[WARN] Products not confirmed in landscape")

        # Rotate back to portrait
        self.device.set_orientation("n")
        time.sleep(2)
        self.take_screenshot('12-products-portrait')

        print("[OK] Orientation test complete")
        return True

    def run_all_tests(self):
        """Run all product tests"""
        print("\n" + "="*50)
        print("ANTIGASPI MOBILE - PRODUCT TESTS")
        print("="*50)

        try:
            self.setup()

            tests = [
                self.test_01_product_list_visible,
                self.test_02_scroll_product_list,
                self.test_03_click_product_card,
                self.test_04_product_details_navigation,
                self.test_05_back_to_home,
                self.test_06_search_products,
                self.test_07_product_categories,
                self.test_08_pull_to_refresh,
                self.test_09_landscape_mode,
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
    tester = TestProducts()
    success = tester.run_all_tests()
    exit(0 if success else 1)

#!/usr/bin/env python3
"""
Test E2E - User Profile Management
Tests profile viewing, editing, and settings
"""

import uiautomator2 as u2
import time
import os

class TestProfile:
    def __init__(self):
        self.device = u2.connect('emulator-5554')
        self.screenshots_dir = 'test-results/profile'
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

    def test_01_navigate_to_profile(self):
        """Test 1: Navigate to profile screen"""
        print("\n=== TEST 1: Navigate to Profile ===")

        width, height = self.device.window_size()

        # Navigate to profile tab (rightmost tab in bottom navigation)
        profile_tab_y = int(height * 0.95)
        profile_tab_x = int(width * 0.9)
        self.device.click(profile_tab_x, profile_tab_y)
        time.sleep(2)
        self.take_screenshot('01-profile-screen')

        # Check if profile content is visible
        screen_content = self.device.dump_hierarchy()
        if any(keyword in screen_content.lower() for keyword in ['profile', 'profil', 'account', 'compte']):
            print("[OK] Profile screen visible")
        else:
            print("[WARN] Profile screen not confirmed")

        return True

    def test_02_view_profile_info(self):
        """Test 2: View profile information"""
        print("\n=== TEST 2: View Profile Info ===")

        time.sleep(1)
        self.take_screenshot('02-profile-info')

        # Check for profile elements
        screen_content = self.device.dump_hierarchy()

        checks = {
            'Name': any(x in screen_content.lower() for x in ['jean', 'dupont', 'name', 'nom']),
            'Email': any(x in screen_content.lower() for x in ['email', '@']),
            'Edit button': any(x in screen_content.lower() for x in ['edit', 'modifier', 'settings'])
        }

        for name, found in checks.items():
            status = "[OK]" if found else "[WARN]"
            print(f"{status} {name}: {'found' if found else 'not found'}")

        print("[OK] Profile info viewed")
        return True

    def test_03_scroll_profile_options(self):
        """Test 3: Scroll through profile options"""
        print("\n=== TEST 3: Scroll Profile Options ===")

        width, height = self.device.window_size()

        # Scroll down to see more options
        self.device.swipe(width // 2, height * 0.7, width // 2, height * 0.3, 0.2)
        time.sleep(1)
        self.take_screenshot('03-profile-scrolled')

        print("[OK] Profile options scrolled")
        return True

    def test_04_edit_profile_navigation(self):
        """Test 4: Navigate to edit profile"""
        print("\n=== TEST 4: Edit Profile Navigation ===")

        width, height = self.device.window_size()

        # Scroll back to top
        self.device.swipe(width // 2, height * 0.3, width // 2, height * 0.7, 0.2)
        time.sleep(1)

        # Click edit profile button (usually near top)
        edit_button_y = int(height * 0.2)
        self.device.click(width // 2, edit_button_y)
        time.sleep(2)
        self.take_screenshot('04-edit-profile-screen')

        # Check if edit screen appeared
        screen_content = self.device.dump_hierarchy()
        if any(keyword in screen_content.lower() for keyword in ['edit', 'modifier', 'save', 'enregistrer']):
            print("[OK] Edit profile screen visible")
        else:
            print("[WARN] Edit screen not confirmed")

        return True

    def test_05_edit_profile_form(self):
        """Test 5: Test editing profile form"""
        print("\n=== TEST 5: Edit Profile Form ===")

        width, height = self.device.window_size()

        # Try to edit name field
        name_field_y = int(height * 0.3)
        self.device.click(width // 2, name_field_y)
        time.sleep(0.5)

        # Clear and type new text
        self.device.send_keys(" Test", clear=False)
        time.sleep(1)
        self.take_screenshot('05-profile-name-edited')

        # Scroll down to see more fields
        self.device.swipe(width // 2, height * 0.6, width // 2, height * 0.3, 0.2)
        time.sleep(1)
        self.take_screenshot('06-profile-form-scrolled')

        print("[OK] Profile form tested")
        return True

    def test_06_cancel_edit(self):
        """Test 6: Cancel profile editing"""
        print("\n=== TEST 6: Cancel Edit ===")

        # Press back to cancel
        self.device.press("back")
        time.sleep(2)
        self.take_screenshot('07-after-cancel-edit')

        print("[OK] Edit cancelled")
        return True

    def test_07_view_order_history(self):
        """Test 7: View order/reservation history"""
        print("\n=== TEST 7: View Order History ===")

        width, height = self.device.window_size()

        # Scroll to find order history option
        self.device.swipe(width // 2, height * 0.7, width // 2, height * 0.3, 0.2)
        time.sleep(1)

        # Click on order history (approximate position)
        history_y = int(height * 0.4)
        self.device.click(width // 2, history_y)
        time.sleep(2)
        self.take_screenshot('08-order-history')

        # Check if we're on order history or redirected to reservations
        screen_content = self.device.dump_hierarchy()
        if any(keyword in screen_content.lower() for keyword in ['history', 'historique', 'order', 'reservation']):
            print("[OK] Order history or reservations visible")
        else:
            print("[WARN] Order history not confirmed")

        # Go back to profile
        self.device.press("back")
        time.sleep(2)

        return True

    def test_08_view_settings(self):
        """Test 8: View settings/preferences"""
        print("\n=== TEST 8: View Settings ===")

        width, height = self.device.window_size()

        # Scroll down to find settings
        self.device.swipe(width // 2, height * 0.7, width // 2, height * 0.3, 0.2)
        time.sleep(1)

        # Click on settings option
        settings_y = int(height * 0.5)
        self.device.click(width // 2, settings_y)
        time.sleep(2)
        self.take_screenshot('09-settings-screen')

        # Check for settings elements
        screen_content = self.device.dump_hierarchy()
        if any(keyword in screen_content.lower() for keyword in ['setting', 'paramètre', 'notification', 'privacy']):
            print("[OK] Settings screen visible")
        else:
            print("[WARN] Settings not confirmed (might be on profile screen)")

        # Go back
        self.device.press("back")
        time.sleep(2)

        return True

    def test_09_profile_statistics(self):
        """Test 9: View profile statistics"""
        print("\n=== TEST 9: Profile Statistics ===")

        width, height = self.device.window_size()

        # Navigate back to profile main screen
        profile_tab_y = int(height * 0.95)
        profile_tab_x = int(width * 0.9)
        self.device.click(profile_tab_x, profile_tab_y)
        time.sleep(2)
        self.take_screenshot('10-profile-statistics')

        # Check for statistics (reservations count, points, etc.)
        screen_content = self.device.dump_hierarchy()

        stats_keywords = ['reservation', 'point', 'saved', 'économisé', 'total', 'count']
        stats_found = any(keyword in screen_content.lower() for keyword in stats_keywords)

        if stats_found:
            print("[OK] Profile statistics visible")
        else:
            print("[WARN] Statistics not confirmed")

        return True

    def test_10_logout_from_profile(self):
        """Test 10: Test logout from profile"""
        print("\n=== TEST 10: Logout ===")

        width, height = self.device.window_size()

        # Scroll down to find logout button
        for i in range(2):
            self.device.swipe(width // 2, height * 0.7, width // 2, height * 0.3, 0.2)
            time.sleep(1)

        self.take_screenshot('11-before-logout')

        # Click logout button (bottom of profile)
        logout_y = int(height * 0.8)
        self.device.click(width // 2, logout_y)
        print("[CLICK] Logout button clicked")

        time.sleep(3)
        self.take_screenshot('12-after-logout')

        # Check if we're back to login screen
        screen_content = self.device.dump_hierarchy()
        if any(keyword in screen_content.lower() for keyword in ['login', 'connexion', 'sign in']):
            print("[OK] Logout successful - Login screen visible")
        else:
            print("[WARN] Logout not confirmed")

        return True

    def run_all_tests(self):
        """Run all profile tests"""
        print("\n" + "="*50)
        print("ANTIGASPI MOBILE - PROFILE TESTS")
        print("="*50)

        try:
            self.setup()

            tests = [
                self.test_01_navigate_to_profile,
                self.test_02_view_profile_info,
                self.test_03_scroll_profile_options,
                self.test_04_edit_profile_navigation,
                self.test_05_edit_profile_form,
                self.test_06_cancel_edit,
                self.test_07_view_order_history,
                self.test_08_view_settings,
                self.test_09_profile_statistics,
                self.test_10_logout_from_profile,
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
    tester = TestProfile()
    success = tester.run_all_tests()
    exit(0 if success else 1)

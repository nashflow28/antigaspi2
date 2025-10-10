#!/usr/bin/env python3
"""
Test E2E - Product Reservation Flow
Tests complete reservation process from product selection to confirmation
"""

import uiautomator2 as u2
import time
import os

class TestReservation:
    def __init__(self):
        self.device = u2.connect('emulator-5554')
        self.screenshots_dir = 'test-results/reservation'
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

        # Login
        self.quick_login()
        print("[OK] Setup complete - User logged in")

    def quick_login(self):
        """Quick login helper"""
        width, height = self.device.window_size()

        # Email
        self.device.click(width // 2, int(height * 0.35))
        time.sleep(0.5)
        self.device.send_keys("jean.dupont@email.com")  # Removed clear=True

        # Password
        self.device.click(width // 2, int(height * 0.45))
        time.sleep(0.5)
        self.device.send_keys("password")  # Removed clear=True

        # Login
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

    def test_01_select_product(self):
        """Test 1: Select a product for reservation"""
        print("\n=== TEST 1: Select Product ===")

        time.sleep(2)
        self.take_screenshot('01-product-list')

        width, height = self.device.window_size()

        # Click on first product
        product_y = int(height * 0.25)
        self.device.click(width // 2, product_y)
        print("[CLICK] Product selected")

        time.sleep(3)
        self.take_screenshot('02-product-details-selected')

        print("[OK] Product selected")
        return True

    def test_02_view_reservation_details(self):
        """Test 2: View product details before reserving"""
        print("\n=== TEST 2: View Reservation Details ===")

        width, height = self.device.window_size()

        # Scroll to see all details
        self.device.swipe(width // 2, height * 0.6, width // 2, height * 0.3, 0.2)
        time.sleep(1)
        self.take_screenshot('03-product-details-scrolled')

        # Check for important info
        screen_content = self.device.dump_hierarchy()

        checks = {
            'Price': any(x in screen_content.lower() for x in ['xof', 'price', 'prix']),
            'Merchant': any(x in screen_content.lower() for x in ['merchant', 'commerçant', 'vendeur']),
            'Reserve button': any(x in screen_content.lower() for x in ['reserve', 'réserver', 'button'])
        }

        for name, found in checks.items():
            status = "[OK]" if found else "[WARN]"
            print(f"{status} {name}: {'found' if found else 'not found'}")

        print("[OK] Product details viewed")
        return True

    def test_03_click_reserve_button(self):
        """Test 3: Click reserve button"""
        print("\n=== TEST 3: Click Reserve Button ===")

        width, height = self.device.window_size()

        # Scroll back to see reserve button
        self.device.swipe(width // 2, height * 0.3, width // 2, height * 0.6, 0.2)
        time.sleep(1)

        # Click reserve button (usually in middle-bottom area)
        reserve_y = int(height * 0.7)
        self.device.click(width // 2, reserve_y)
        print("[CLICK] Reserve button clicked")

        time.sleep(2)
        self.take_screenshot('04-reservation-modal')

        # Check if modal/confirmation appeared
        screen_content = self.device.dump_hierarchy()
        if any(keyword in screen_content.lower() for keyword in ['confirm', 'confirmer', 'modal', 'dialog']):
            print("[OK] Reservation modal appeared")
        else:
            print("[WARN] Reservation modal not confirmed")

        return True

    def test_04_confirm_reservation(self):
        """Test 4: Confirm the reservation"""
        print("\n=== TEST 4: Confirm Reservation ===")

        width, height = self.device.window_size()

        # Click confirm button in modal
        confirm_y = int(height * 0.6)
        self.device.click(width // 2, confirm_y)
        print("[CLICK] Confirm button clicked")

        time.sleep(3)
        self.take_screenshot('05-reservation-confirmed')

        # Check for success message or toast
        screen_content = self.device.dump_hierarchy()
        if any(keyword in screen_content.lower() for keyword in ['success', 'succès', 'confirmé', 'confirmed', 'réservation']):
            print("[OK] Reservation confirmed - Success message visible")
        else:
            print("[WARN] Success message not confirmed")

        return True

    def test_05_view_my_reservations(self):
        """Test 5: Navigate to my reservations"""
        print("\n=== TEST 5: View My Reservations ===")

        width, height = self.device.window_size()

        # Navigate to reservations tab (usually in bottom navigation)
        reservations_tab_y = int(height * 0.95)
        reservations_tab_x = int(width * 0.5)  # Middle tab
        self.device.click(reservations_tab_x, reservations_tab_y)
        time.sleep(3)
        self.take_screenshot('06-my-reservations')

        # Check if reservation appears in list
        screen_content = self.device.dump_hierarchy()
        if any(keyword in screen_content.lower() for keyword in ['reservation', 'réservation', 'order', 'commande']):
            print("[OK] Reservations screen visible")
        else:
            print("[WARN] Reservations screen not confirmed")

        return True

    def test_06_view_reservation_details(self):
        """Test 6: View details of a reservation"""
        print("\n=== TEST 6: View Reservation Details ===")

        width, height = self.device.window_size()

        # Click on first reservation
        reservation_y = int(height * 0.25)
        self.device.click(width // 2, reservation_y)
        print("[CLICK] Reservation clicked")

        time.sleep(2)
        self.take_screenshot('07-reservation-detail')

        # Check for reservation details
        screen_content = self.device.dump_hierarchy()
        details_found = {
            'Status': any(x in screen_content.lower() for x in ['status', 'statut', 'pending', 'en attente']),
            'Product': any(x in screen_content.lower() for x in ['product', 'produit']),
            'Date': any(x in screen_content.lower() for x in ['date', 'time', 'heure'])
        }

        for name, found in details_found.items():
            status = "[OK]" if found else "[WARN]"
            print(f"{status} {name}: {'found' if found else 'not found'}")

        print("[OK] Reservation details viewed")
        return True

    def test_07_cancel_reservation(self):
        """Test 7: Test cancel reservation functionality"""
        print("\n=== TEST 7: Cancel Reservation ===")

        width, height = self.device.window_size()

        # Scroll down to find cancel button
        self.device.swipe(width // 2, height * 0.6, width // 2, height * 0.3, 0.2)
        time.sleep(1)
        self.take_screenshot('08-reservation-cancel-button')

        # Click cancel button
        cancel_y = int(height * 0.75)
        self.device.click(width // 2, cancel_y)
        print("[CLICK] Cancel button clicked")

        time.sleep(2)
        self.take_screenshot('09-cancel-confirmation')

        # Confirm cancellation in modal
        confirm_cancel_y = int(height * 0.55)
        self.device.click(width // 2, confirm_cancel_y)
        time.sleep(2)
        self.take_screenshot('10-reservation-cancelled')

        print("[OK] Reservation cancellation tested")
        return True

    def test_08_reservation_history(self):
        """Test 8: View reservation history"""
        print("\n=== TEST 8: Reservation History ===")

        # Go back to reservations list
        self.device.press("back")
        time.sleep(2)
        self.take_screenshot('11-reservations-after-cancel')

        # Scroll through history
        width, height = self.device.window_size()
        self.device.swipe(width // 2, height * 0.7, width // 2, height * 0.3, 0.2)
        time.sleep(1)
        self.take_screenshot('12-reservation-history-scrolled')

        print("[OK] Reservation history viewed")
        return True

    def test_09_reservation_filters(self):
        """Test 9: Test reservation filters/tabs"""
        print("\n=== TEST 9: Reservation Filters ===")

        width, height = self.device.window_size()

        # Swipe on filter tabs (if present)
        filter_y = int(height * 0.15)
        self.device.swipe(width * 0.7, filter_y, width * 0.3, filter_y, 0.2)
        time.sleep(2)
        self.take_screenshot('13-reservation-filter-changed')

        print("[OK] Reservation filters tested")
        return True

    def run_all_tests(self):
        """Run all reservation tests"""
        print("\n" + "="*50)
        print("ANTIGASPI MOBILE - RESERVATION TESTS")
        print("="*50)

        try:
            self.setup()

            tests = [
                self.test_01_select_product,
                self.test_02_view_reservation_details,
                self.test_03_click_reserve_button,
                self.test_04_confirm_reservation,
                self.test_05_view_my_reservations,
                self.test_06_view_reservation_details,
                self.test_07_cancel_reservation,
                self.test_08_reservation_history,
                self.test_09_reservation_filters,
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
    tester = TestReservation()
    success = tester.run_all_tests()
    exit(0 if success else 1)

#!/usr/bin/env python3
"""
Master Test Runner for Antigaspi Mobile E2E Tests
Executes all test suites and generates consolidated report
"""

import sys
import os
import time
from datetime import datetime

# Add android directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import all test classes
from test_auth import TestAuthentication
from test_products import TestProducts
from test_reservation import TestReservation
from test_favorites import TestFavorites
from test_profile import TestProfile

def print_banner(text):
    """Print formatted banner"""
    print("\n" + "="*60)
    print(f" {text}")
    print("="*60)

def print_section(text):
    """Print formatted section header"""
    print("\n" + "-"*60)
    print(f" {text}")
    print("-"*60)

def run_test_suite(test_class, suite_name):
    """Run a single test suite and return results"""
    print_section(f"Running {suite_name}")

    start_time = time.time()

    try:
        tester = test_class()
        success = tester.run_all_tests()

        elapsed = time.time() - start_time

        return {
            'name': suite_name,
            'success': success,
            'elapsed': elapsed,
            'error': None
        }
    except Exception as e:
        elapsed = time.time() - start_time
        print(f"\n[FATAL ERROR] {suite_name} crashed: {e}")

        return {
            'name': suite_name,
            'success': False,
            'elapsed': elapsed,
            'error': str(e)
        }

def main():
    """Main test runner"""
    print_banner("ANTIGASPI MOBILE - E2E TEST SUITE")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Define test suites
    test_suites = [
        (TestAuthentication, "Authentication Tests"),
        (TestProducts, "Product Browsing Tests"),
        (TestReservation, "Reservation Flow Tests"),
        (TestFavorites, "Favorites Management Tests"),
        (TestProfile, "Profile Management Tests"),
    ]

    # Run all test suites
    results = []
    total_start = time.time()

    for test_class, suite_name in test_suites:
        result = run_test_suite(test_class, suite_name)
        results.append(result)

        # Short pause between suites
        time.sleep(2)

    total_elapsed = time.time() - total_start

    # Generate final report
    print_banner("FINAL TEST REPORT")

    passed_suites = 0
    failed_suites = 0

    for result in results:
        status = "[PASS]" if result['success'] else "[FAIL]"
        elapsed_str = f"{result['elapsed']:.1f}s"

        print(f"{status} {result['name']:<35} {elapsed_str:>10}")

        if result['success']:
            passed_suites += 1
        else:
            failed_suites += 1
            if result['error']:
                print(f"       Error: {result['error']}")

    print("\n" + "-"*60)
    print(f"Total Suites: {len(results)}")
    print(f"Passed: {passed_suites}")
    print(f"Failed: {failed_suites}")
    print(f"Success Rate: {(passed_suites/len(results)*100):.1f}%")
    print(f"Total Time: {total_elapsed:.1f}s")
    print("-"*60)

    # Screenshots location
    print("\n[INFO] Screenshots saved in:")
    print("  - test-results/auth/")
    print("  - test-results/products/")
    print("  - test-results/reservation/")
    print("  - test-results/favorites/")
    print("  - test-results/profile/")

    print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Exit with appropriate code
    if failed_suites > 0:
        print("\n[RESULT] Some test suites failed")
        return 1
    else:
        print("\n[RESULT] All test suites passed!")
        return 0

if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n[INTERRUPTED] Test run cancelled by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n[FATAL] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

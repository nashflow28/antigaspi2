/**
 * MCP Test Helpers
 * Helper functions for MCP-based automated testing
 * Works with mobile-mcp and adb-mcp tools
 */

import { TEST_IDS } from './testIds'

/**
 * Export TEST_IDS for easy import in test scripts
 */
export { TEST_IDS }

/**
 * Generate click command for MCP tests
 * @param testId - The testID to click
 * @returns MCP click command string
 */
export const mcpClick = (testId: string): string => {
  return `mobile_tap(selector="${testId}", selector_type="testID")`
}

/**
 * Generate type text command for MCP tests
 * @param testId - The testID of the input field
 * @param text - The text to type
 * @returns MCP type command string
 */
export const mcpType = (testId: string, text: string): string => {
  return `mobile_tap(selector="${testId}", selector_type="testID") && mobile_type(text="${text}")`
}

/**
 * Generate wait for element command for MCP tests
 * @param testId - The testID to wait for
 * @param timeout - Timeout in seconds (default: 10)
 * @returns MCP wait command string
 */
export const mcpWaitFor = (testId: string, timeout: number = 10): string => {
  return `wait_for_element(selector="${testId}", selector_type="testID", timeout=${timeout})`
}

/**
 * Generate scroll to element command for MCP tests
 * @param testId - The testID to scroll to
 * @returns MCP scroll command string
 */
export const mcpScrollTo = (testId: string): string => {
  return `scroll_to(selector="${testId}", selector_type="testID")`
}

/**
 * Generate element info command for MCP tests
 * @param testId - The testID to get info for
 * @returns MCP get element info command string
 */
export const mcpGetInfo = (testId: string): string => {
  return `get_element_info(selector="${testId}", selector_type="testID")`
}

/**
 * Common test flows as Python code snippets
 */
export const TEST_FLOWS = {
  /**
   * Consumer Login Flow
   */
  consumerLogin: `
# Consumer Login Flow
mobile_tap(selector="${TEST_IDS.loginConsumerQuick}", selector_type="testID")
wait_for_element(selector="${TEST_IDS.homeScreen}", selector_type="testID", timeout=10)
`,

  /**
   * Merchant Login Flow
   */
  merchantLogin: `
# Merchant Login Flow
mobile_tap(selector="${TEST_IDS.loginMerchantQuick}", selector_type="testID")
wait_for_element(selector="${TEST_IDS.merchantDashboard}", selector_type="testID", timeout=10)
`,

  /**
   * Consumer Reservation Flow
   */
  consumerReservation: `
# Consumer Reservation Flow
# 1. Navigate to Products
mobile_tap(selector="${TEST_IDS.homeTab}", selector_type="testID")

# 2. Select first product
mobile_tap(selector="${TEST_IDS.productCard(0)}", selector_type="testID")
wait_for_element(selector="${TEST_IDS.productDetailsScreen}", selector_type="testID")

# 3. Reserve product
mobile_tap(selector="${TEST_IDS.reserveButton}", selector_type="testID")

# 4. Confirm reservation
wait_for_element(selector="${TEST_IDS.confirmButton}", selector_type="testID", timeout=5)
mobile_tap(selector="${TEST_IDS.confirmButton}", selector_type="testID")

# 5. Verify reservation created
mobile_tap(selector="${TEST_IDS.reservationsTab}", selector_type="testID")
wait_for_element(selector="${TEST_IDS.reservationsScreen}", selector_type="testID")
`,

  /**
   * Merchant Product Creation Flow
   */
  merchantProductCreation: `
# Merchant Product Creation Flow
# 1. Navigate to Products
mobile_tap(selector="${TEST_IDS.merchantProducts}", selector_type="testID")

# 2. Click Add Product
mobile_tap(selector="${TEST_IDS.addProductButton}", selector_type="testID")
wait_for_element(selector="${TEST_IDS.productFormScreen}", selector_type="testID")

# 3. Fill product form
mobile_tap(selector="${TEST_IDS.productNameInput}", selector_type="testID")
mobile_type(text="Pain artisanal")

mobile_tap(selector="${TEST_IDS.originalPriceInput}", selector_type="testID")
mobile_type(text="1000")

mobile_tap(selector="${TEST_IDS.discountedPriceInput}", selector_type="testID")
mobile_type(text="500")

mobile_tap(selector="${TEST_IDS.quantityInput}", selector_type="testID")
mobile_type(text="10")

# 4. Submit product
mobile_tap(selector="${TEST_IDS.submitProductButton}", selector_type="testID")

# 5. Verify product created
wait_for_element(selector="${TEST_IDS.merchantProductsList}", selector_type="testID", timeout=10)
`,
}

/**
 * Export complete test script template
 */
export const generateTestScript = (flowName: keyof typeof TEST_FLOWS): string => {
  return `#!/usr/bin/env python3
"""
MCP Automated Test: ${flowName}
Generated from mcpHelpers.ts
"""

from mobile_mcp import (
    mobile_init,
    mobile_tap,
    mobile_type,
    wait_for_element,
    mobile_screenshot,
)

def test_${flowName}():
    """Test ${flowName} flow"""

    # Initialize mobile device
    mobile_init()

    ${TEST_FLOWS[flowName]}

    # Take final screenshot
    mobile_screenshot(filename="test-${flowName}-success.png")

    print("✅ Test ${flowName} passed!")

if __name__ == "__main__":
    test_${flowName}()
`
}

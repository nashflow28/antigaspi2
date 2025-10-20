import { describe, it, expect } from '@jest/globals'
import { launchApp, waitForElementByTestId, tapByTestId, typeText, takeScreenshot, clearAppData } from '../helpers/mobile-android'
import { TEST_IDS } from '../../src/utils/testIds'

describe('Android Auth Flow (MCP-friendly)', () => {
  it('logs in as Consumer via testIDs', async () => {
    await clearAppData()
    await launchApp()

    // Wait for login screen
    expect(await waitForElementByTestId(TEST_IDS.loginScreen, 8000)).toBe(true)

    // Focus email and type
    await tapByTestId(TEST_IDS.loginEmail)
    await typeText('jean.dupont@email.com')

    // Focus password and type
    await tapByTestId(TEST_IDS.loginPassword)
    await typeText('password')

    // Submit
    await tapByTestId(TEST_IDS.loginSubmit)

    // Wait for home screen to appear
    expect(await waitForElementByTestId(TEST_IDS.homeScreen, 10000)).toBe(true)
    await takeScreenshot('auth-consumer-success')
  }, 60000)
})


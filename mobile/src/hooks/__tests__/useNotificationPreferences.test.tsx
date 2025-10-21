// @ts-nocheck
import React from 'react'
import { render, act, waitFor } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'

const mockNotificationService = {
  loadContactPreferences: jest.fn(),
  saveContactPreferences: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
}

jest.mock('../../services/notificationService', () => ({
  __esModule: true,
  default: mockNotificationService,
}))

const mockApiService = {
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  getProfile: jest.fn(),
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  setStoredUser: jest.fn(),
}

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: mockApiService,
}))

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native')
  return {
    ...actual,
    useFocusEffect: (callback: () => void | (() => void)) => {
      const React = require('react')
      React.useEffect(() => {
        const cleanup = callback()
        return cleanup
      }, [])
    },
  }
})

const { useNotificationPreferences } = require('../useNotificationPreferences')
const authReducer = require('../../store/slices/authSlice').default

const baseUser = {
  id: 42,
  email: 'merchant@example.com',
  first_name: 'Merchant',
  last_name: 'Test',
  role: 'merchant',
  prefers_email_notifications: true,
  prefers_sms_notifications: false,
  prefers_push_notifications: true,
}

const makeStore = () =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: baseUser,
        token: 'token',
        isAuthenticated: true,
        loading: false,
        error: null,
      },
    },
  })

let hookValueRef: any = null

const TestHarness = () => {
  hookValueRef = useNotificationPreferences()
  return null
}

describe('useNotificationPreferences', () => {
  let store: ReturnType<typeof makeStore>

  beforeEach(() => {
    jest.clearAllMocks()
    store = makeStore()
    hookValueRef = null
    mockNotificationService.loadContactPreferences.mockReset()
    mockNotificationService.saveContactPreferences.mockReset()
    mockNotificationService.on.mockReset()
    mockNotificationService.off.mockReset()
    mockNotificationService.loadContactPreferences.mockImplementation(async () => ({
      email: true,
      sms: false,
      push: true,
    }))
    mockNotificationService.saveContactPreferences.mockImplementation(async (prefs) => ({
      email: prefs.email,
      sms: prefs.sms,
      push: prefs.push,
    }))
    mockApiService.getProfile.mockReset()
    mockApiService.setStoredUser.mockReset()
    mockApiService.getProfile.mockResolvedValue({ success: true, data: baseUser })
    mockApiService.setStoredUser.mockResolvedValue(undefined)
  })

  const renderHook = async () => {
    render(
      <Provider store={store}>
        <TestHarness />
      </Provider>
    )

    await waitFor(() => expect(hookValueRef).toBeDefined())
    return hookValueRef
  }

  it('charge les préférences distantes et synchronise le store', async () => {
    const remotePreferences = { email: false, sms: true, push: true }
    mockNotificationService.loadContactPreferences.mockResolvedValueOnce(remotePreferences)

    await renderHook()

    await waitFor(() => expect(hookValueRef.loading).toBe(false))

    expect(mockNotificationService.loadContactPreferences).toHaveBeenCalledTimes(1)
    expect(hookValueRef.preferences).toEqual(remotePreferences)
    expect(mockNotificationService.on).toHaveBeenCalledWith(
      'contactPreferencesChanged',
      expect.any(Function)
    )
    expect(mockApiService.getProfile).toHaveBeenCalled()
    expect(mockApiService.setStoredUser).toHaveBeenCalledWith(baseUser)
  })

  it('permet de basculer une préférence localement', async () => {
    await renderHook()

    await waitFor(() => expect(hookValueRef.loading).toBe(false))

    expect(hookValueRef.preferences.sms).toBe(false)

    act(() => {
      hookValueRef.togglePreference('sms')
    })

    await waitFor(() => expect(hookValueRef.preferences.sms).toBe(true))
    expect(hookValueRef.hasChanges).toBe(true)
  })

  it('sauvegarde les préférences et réinitialise le flag de changements', async () => {
    const updatedProfile = {
      ...baseUser,
      prefers_email_notifications: false,
      prefers_sms_notifications: true,
    }
    mockApiService.getProfile.mockResolvedValueOnce({ success: true, data: baseUser })
    mockApiService.getProfile.mockResolvedValueOnce({ success: true, data: updatedProfile })
    mockNotificationService.saveContactPreferences.mockResolvedValueOnce({
      email: false,
      sms: true,
      push: true,
    })

    await renderHook()

    await waitFor(() => expect(hookValueRef.loading).toBe(false))

    await act(async () => {
      hookValueRef.togglePreference('email')
    })

    expect(hookValueRef.preferences.email).toBe(false)

    await act(async () => {
      await hookValueRef.save()
    })

    expect(mockNotificationService.saveContactPreferences).toHaveBeenCalledWith({
      email: false,
      sms: false,
      push: true,
    })
    expect(mockApiService.getProfile).toHaveBeenCalled()
    expect(mockApiService.setStoredUser).toHaveBeenCalledWith(updatedProfile)
    expect(hookValueRef.preferences).toEqual({ email: false, sms: true, push: true })
    expect(hookValueRef.hasChanges).toBe(false)
  })
})

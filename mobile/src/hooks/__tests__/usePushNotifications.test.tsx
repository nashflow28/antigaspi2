import React from 'react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { render, act } from '@testing-library/react-native'
import usePushNotifications from '../usePushNotifications'
import { authInitialState } from '../../store/slices/authSlice'
import notificationService from '../../services/notificationService'
import * as NavigationRef from '../../navigation/NavigationRef'

const mockShowInfo = jest.fn()
const mockShowError = jest.fn()

jest.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    showToast: jest.fn(),
    showSuccess: jest.fn(),
    showError: mockShowError,
    showWarning: jest.fn(),
    showInfo: mockShowInfo,
    hideToast: jest.fn(),
  }),
}))

const listeners = new Map<string, Set<Function>>()

const addListener = (event: string, callback: Function) => {
  if (!listeners.has(event)) {
    listeners.set(event, new Set())
  }

  listeners.get(event)!.add(callback)
}

const removeListener = (event: string, callback: Function) => {
  listeners.get(event)?.delete(callback)
}

const trigger = (event: string, payload: any) => {
  listeners.get(event)?.forEach((callback) => {
    callback(payload)
  })
}

jest.mock('../../services/notificationService', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(() => Promise.resolve()),
    syncPushTokenOwnership: jest.fn(() => Promise.resolve()),
    on: jest.fn((event: string, callback: Function) => addListener(event, callback)),
    off: jest.fn((event: string, callback: Function) => removeListener(event, callback)),
  },
}))

jest.mock('../../navigation/NavigationRef', () => ({
  navigate: jest.fn(),
}))

const flushPromises = () => act(async () => { await Promise.resolve() })

const createStoreWithAuth = (authState: typeof authInitialState) =>
  configureStore({
    reducer: {
      auth: (state = authState) => state,
    },
  })

const TestComponent = () => {
  usePushNotifications()
  return null
}

describe('usePushNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    listeners.clear()
  })

  it('initializes push notifications when user is authenticated', async () => {
    const store = createStoreWithAuth({
      ...authInitialState,
      isAuthenticated: true,
      user: { id: 42 } as any,
    })

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    )

    await flushPromises()

    expect(notificationService.initialize).toHaveBeenCalledTimes(1)
    expect(notificationService.syncPushTokenOwnership).toHaveBeenCalledTimes(1)
  })

  it('does not initialize when user is not authenticated', async () => {
    const store = createStoreWithAuth({ ...authInitialState })

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    )

    await flushPromises()

    expect(notificationService.initialize).not.toHaveBeenCalled()
    expect(notificationService.syncPushTokenOwnership).not.toHaveBeenCalled()
  })

  it('shows a toast when a foreground notification is received', async () => {
    const store = createStoreWithAuth({
      ...authInitialState,
      isAuthenticated: true,
      user: { id: 7 } as any,
    })

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    )

    await flushPromises()

    trigger('notificationReceived', {
      title: 'Titre',
      body: 'Message important',
    })

    expect(mockShowInfo).toHaveBeenCalledWith('Message important', 4000)
  })

  it('navigates when a navigation payload is received', async () => {
    const store = createStoreWithAuth({
      ...authInitialState,
      isAuthenticated: true,
      user: { id: 13 } as any,
    })

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    )

    await flushPromises()

    trigger('navigate', {
      screen: 'Notifications',
      params: { fromPush: true },
    })

    expect(NavigationRef.navigate).toHaveBeenCalledWith('Notifications', {
      fromPush: true,
    })
  })

  it('reports an error when initialization fails', async () => {
    ;(notificationService.initialize as jest.Mock).mockRejectedValueOnce(
      new Error('network-error')
    )

    const store = createStoreWithAuth({
      ...authInitialState,
      isAuthenticated: true,
      user: { id: 21 } as any,
    })

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    )

    await flushPromises()

    expect(mockShowError).toHaveBeenCalledWith(
      "Impossible d'activer les notifications push pour le moment. Réessayez plus tard.",
      5000
    )
  })
})

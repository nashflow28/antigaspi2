/**
 * Tests d'intégration du slice d'authentification
 * Couvre: login, logout (succès/échec), restauration persistée
 */

import { configureStore } from '@reduxjs/toolkit'
import authReducer, {
  loginUser,
  logoutUser,
  loadStoredAuth,
} from './authSlice'

// Mock du service API utilisé par les thunks
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getStoredToken: jest.fn(),
    getStoredUser: jest.fn(),
  },
}))

// AsyncStorage est déjà mocké dans jest.setup.js
import AsyncStorage from '@react-native-async-storage/async-storage'
const apiService = require('../../services/api').default as jest.Mocked<any>

const makeStore = (preloaded?: any) =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: preloaded,
  })

describe('authSlice thunks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('loginUser fulfilled met user/token et isAuthenticated', async () => {
    apiService.login.mockResolvedValue({
      success: true,
      data: {
        token: 'test-token',
        user: {
          id: 1,
          role: 'consumer',
          email: 'jean.dupont@email.com',
          first_name: 'Jean',
          last_name: 'Dupont',
        },
      },
    })

    const store = makeStore()
    await store.dispatch(
      // @ts-ignore
      loginUser({ email: 'jean.dupont@email.com', password: 'password' })
    )

    const state = (store.getState() as any).auth
    expect(state.isAuthenticated).toBe(true)
    expect(state.token).toBe('test-token')
    expect(state.user?.email).toBe('jean.dupont@email.com')
    expect(AsyncStorage.setItem).toHaveBeenCalled()
  })

  it('logoutUser fulfilled nettoie l’état', async () => {
    apiService.logout.mockResolvedValue(undefined)
    const store = makeStore({
      auth: {
        user: { id: 1, email: 'x@y.z', role: 'consumer' },
        token: 't',
        isAuthenticated: true,
        loading: false,
        error: null,
      },
    })

    await store.dispatch(
      // @ts-ignore
      logoutUser()
    )

    const state = (store.getState() as any).auth
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
  })

  it('logoutUser rejected nettoie quand même l’état (offline)', async () => {
    apiService.logout.mockRejectedValue(new Error('network'))
    const store = makeStore({
      auth: {
        user: { id: 2, email: 'a@b.c', role: 'consumer' },
        token: 't2',
        isAuthenticated: true,
        loading: false,
        error: null,
      },
    })

    await store.dispatch(
      // @ts-ignore
      logoutUser()
    )

    const state = (store.getState() as any).auth
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
  })

  it('loadStoredAuth hydrate depuis AsyncStorage si présent', async () => {
    apiService.getStoredToken.mockResolvedValue('persisted-token')
    apiService.getStoredUser.mockResolvedValue({
      id: 3,
      role: 'consumer',
      email: 'persisted@user.com',
      first_name: 'Persisted',
      last_name: 'User',
    })

    const store = makeStore()
    await store.dispatch(
      // @ts-ignore
      loadStoredAuth()
    )

    const state = (store.getState() as any).auth
    expect(state.isAuthenticated).toBe(true)
    expect(state.token).toBe('persisted-token')
    expect(state.user?.email).toBe('persisted@user.com')
  })

  it("loadStoredAuth n'altère pas l'auth si rien en stockage", async () => {
    apiService.getStoredToken.mockResolvedValue(null)
    apiService.getStoredUser.mockResolvedValue(null)

    const store = makeStore({
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: true,
        error: null,
      },
    })

    await store.dispatch(
      // @ts-ignore
      loadStoredAuth()
    )

    const state = (store.getState() as any).auth
    expect(state.isAuthenticated).toBe(false)
    expect(state.loading).toBe(false)
  })
})


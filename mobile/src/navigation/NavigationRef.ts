import {
  CommonActions,
  NavigationAction,
  StackActions,
  createNavigationContainerRef,
} from '@react-navigation/native'

/**
 * Central navigation reference used outside of React components.
 * Some services (e.g. API interceptors) need to trigger navigation
 * without direct access to the navigation prop.
 */
export type RootNavigationParams = Record<string, object | undefined>

export const navigationRef = createNavigationContainerRef<RootNavigationParams>()

const pendingActions: NavigationAction[] = []

const dispatchOrQueue = (action: NavigationAction) => {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(action)
  } else {
    pendingActions.push(action)
  }
}

export const flushPendingActions = () => {
  if (!navigationRef.isReady()) return

  while (pendingActions.length) {
    const action = pendingActions.shift()
    if (action) {
      navigationRef.dispatch(action)
    }
  }
}

export function navigate<RouteName extends keyof RootNavigationParams>(
  name: RouteName,
  params?: RootNavigationParams[RouteName]
) {
  dispatchOrQueue(CommonActions.navigate({
    name: name as string,
    params,
  }))
}

export function reset(state: Parameters<typeof CommonActions.reset>[0]) {
  dispatchOrQueue(CommonActions.reset(state))
}

export function goBack() {
  if (navigationRef.canGoBack()) {
    navigationRef.goBack()
  } else {
    dispatchOrQueue(CommonActions.goBack())
  }
}

export function replace<RouteName extends keyof RootNavigationParams>(
  name: RouteName,
  params?: RootNavigationParams[RouteName]
) {
  dispatchOrQueue(StackActions.replace(name as string, params))
}



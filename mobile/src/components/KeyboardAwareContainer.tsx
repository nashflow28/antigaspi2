/**
 * KeyboardAwareContainer - Composant wrapper pour gérer le clavier
 * Évite que le clavier cache les champs de saisie
 * Utilise react-native-keyboard-aware-scroll-view pour une meilleure UX
 */

import React, { forwardRef } from 'react'
import { StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useTheme } from '../theme'

interface Props {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
  /** Extra scroll height when keyboard is open (default: 40) */
  extraScrollHeight?: number
  /** Enable automatic scroll to focused input (default: true) */
  enableAutomaticScroll?: boolean
  /** Enable on Android (default: true) */
  enableOnAndroid?: boolean
  /** Reset scroll position when keyboard hides (default: false) */
  resetScrollToCoords?: { x: number; y: number } | false
  /** Keyboard should persist taps (default: 'handled') */
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled'
  /** Show vertical scroll indicator (default: false) */
  showsVerticalScrollIndicator?: boolean
  /** Bounce effect (default: true on iOS) */
  bounces?: boolean
}

const KeyboardAwareContainer = forwardRef<KeyboardAwareScrollView, Props>(({
  children,
  style,
  contentContainerStyle,
  extraScrollHeight = 40,
  enableAutomaticScroll = true,
  enableOnAndroid = true,
  resetScrollToCoords = false,
  keyboardShouldPersistTaps = 'handled',
  showsVerticalScrollIndicator = false,
  bounces = Platform.OS === 'ios',
}, ref) => {
  const theme = useTheme()

  return (
    <KeyboardAwareScrollView
      ref={ref}
      style={[styles.container, { backgroundColor: theme.colors.background }, style]}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      extraScrollHeight={extraScrollHeight}
      enableAutomaticScroll={enableAutomaticScroll}
      enableOnAndroid={enableOnAndroid}
      resetScrollToCoords={resetScrollToCoords ? resetScrollToCoords : undefined}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      bounces={bounces}
      enableResetScrollToCoords={!!resetScrollToCoords}
      keyboardOpeningTime={250}
    >
      {children}
    </KeyboardAwareScrollView>
  )
})

KeyboardAwareContainer.displayName = 'KeyboardAwareContainer'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
})

export default KeyboardAwareContainer

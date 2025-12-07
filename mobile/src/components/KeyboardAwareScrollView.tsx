import React, { ReactNode } from 'react'
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  ViewStyle,
  ScrollViewProps,
} from 'react-native'

interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  children: ReactNode
  containerStyle?: ViewStyle
  scrollViewStyle?: ViewStyle
  contentContainerStyle?: ViewStyle
}

/**
 * A reusable component that handles keyboard avoidance for forms.
 * Wraps content in KeyboardAvoidingView + ScrollView for proper keyboard handling.
 *
 * Usage:
 * <KeyboardAwareScrollView containerStyle={{ flex: 1 }}>
 *   <TextInput ... />
 *   <TextInput ... />
 * </KeyboardAwareScrollView>
 */
const KeyboardAwareScrollView: React.FC<KeyboardAwareScrollViewProps> = ({
  children,
  containerStyle,
  scrollViewStyle,
  contentContainerStyle,
  ...scrollViewProps
}) => {
  return (
    <KeyboardAvoidingView
      style={[styles.container, containerStyle]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        style={[styles.scrollView, scrollViewStyle]}
        contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
})

export default KeyboardAwareScrollView

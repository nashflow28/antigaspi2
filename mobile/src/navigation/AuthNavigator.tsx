import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

// Screens
import LoginScreen from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'
import PhoneAuthScreen from '../screens/auth/PhoneAuthScreen'
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen'
import SmsOtpScreen from '../screens/auth/SmsOtpScreen'
import CompleteProfileScreen from '../screens/auth/CompleteProfileScreen'

const Stack = createNativeStackNavigator()

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="SmsOtp" component={SmsOtpScreen} />
      <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
    </Stack.Navigator>
  )
}

export default AuthNavigator
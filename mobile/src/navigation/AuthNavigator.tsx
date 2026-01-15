import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

// Screens
import LoginScreen from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'
import PhoneAuthScreen from '../screens/auth/PhoneAuthScreen'
import PhoneRegisterScreen from '../screens/auth/PhoneRegisterScreen'
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen'
import SmsOtpScreen from '../screens/auth/SmsOtpScreen'
import CompleteProfilePhoneScreen from '../screens/auth/CompleteProfilePhoneScreen'
import PinSetupScreen from '../screens/auth/PinSetupScreen'
import PinEntryScreen from '../screens/auth/PinEntryScreen'

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
      <Stack.Screen name="PhoneRegister" component={PhoneRegisterScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="SmsOtp" component={SmsOtpScreen} />
      <Stack.Screen name="CompleteProfilePhone" component={CompleteProfilePhoneScreen} />
      <Stack.Screen name="PinSetup" component={PinSetupScreen} />
      <Stack.Screen name="PinEntry" component={PinEntryScreen} />
    </Stack.Navigator>
  )
}

export default AuthNavigator
/**
 * React Native Config
 * Workaround for Expo 54 + @react-native-firebase/app Android build issue
 * See: https://github.com/invertase/react-native-firebase/issues/8761
 */
module.exports = {
  dependencies: {
    '@react-native-firebase/app': {
      platforms: {
        android: {
          packageImportPath: 'import io.invertase.firebase.app.ReactNativeFirebaseAppPackage;',
        },
      },
    },
    '@react-native-firebase/auth': {
      platforms: {
        android: {
          packageImportPath: 'import io.invertase.firebase.auth.ReactNativeFirebaseAuthPackage;',
        },
      },
    },
  },
};

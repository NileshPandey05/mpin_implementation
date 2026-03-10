import * as LocalAuthentication from "expo-local-authentication"

export async function authenticateBiometric() {

  const hasHardware = await LocalAuthentication.hasHardwareAsync()

  if (!hasHardware) {
    console.log("No biometric hardware")
    return false
  }

  const isEnrolled = await LocalAuthentication.isEnrolledAsync()

  if (!isEnrolled) {
    console.log("No biometric enrolled")
    return false
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Authenticate to continue",
    fallbackLabel: "Use MPIN",
    disableDeviceFallback: false
  })

  return result.success
}
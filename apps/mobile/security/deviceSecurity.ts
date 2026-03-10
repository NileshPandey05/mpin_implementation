// import * as Device from "expo-device"

// export async function runDeviceSecurityCheck() {

//   const issues: string[] = []

//   // 1️⃣ Check emulator
//   if (!Device.isDevice) {
//     issues.push("App cannot run on emulator")
//   }

//   // 2️⃣ Development mode
//   if (__DEV__) {
//     issues.push("App running in debug mode")
//   }

//   return {
//     safe: issues.length === 0,
//     issues
//   }
// }

import * as Device from "expo-device"

export async function runDeviceSecurityCheck() {

  const issues: string[] = []

  // Emulator check
  if (!Device.isDevice) {
    issues.push("App cannot run on emulator")
  }

  // Only block debug mode in production
  if (!__DEV__) {
    const isDebugMode = false // placeholder if you add native check later
    if (isDebugMode) {
      issues.push("Debugger detected")
    }
  }

  return {
    safe: issues.length === 0,
    issues
  }
}
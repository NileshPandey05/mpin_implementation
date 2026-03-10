import { Stack, router } from "expo-router"
import "../global.css"
import { useEffect } from "react"

import { enableScreenProtection } from "@/security/screenSecurity"
import { initAppLock } from "@/security/appLock"

export default function RootLayout() {

  useEffect(() => {

    enableScreenProtection()

    const cleanup = initAppLock(() => {
      router.replace("/(auth)/enter-mpin")
    })

    return cleanup

  }, [])

  return (
    <Stack
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(root)" />
    </Stack>
  )
}
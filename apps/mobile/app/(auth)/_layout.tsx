import { Stack } from "expo-router"

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="signup" options={{
        headerShown: false
      }}/>
      <Stack.Screen name="otp" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register-device" />
      <Stack.Screen name="create-mpin" />
      <Stack.Screen name="enter-mpin" />
    </Stack>
  )
}
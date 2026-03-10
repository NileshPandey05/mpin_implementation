import { Redirect } from "expo-router"
import { useEffect, useState } from "react"
import { View, ActivityIndicator } from "react-native"
import * as SecureStore from "expo-secure-store"
import { getAccessToken } from "@/storage/secureStore"

export default function Index() {

  const [state, setState] = useState<
    "loading" | "signup" | "create-mpin" | "enter-mpin"
  >("loading")

  useEffect(() => {

    const checkAuth = async () => {

      const token = await getAccessToken()
      const encryptedKey = await SecureStore.getItemAsync("encrypted_private_key")
       console.log("TOKEN:", token)
  console.log("ENCRYPTED KEY:", encryptedKey)


      if (!token) {
        setState("signup")
        return
      }

      if (token && !encryptedKey) {
        setState("create-mpin")
        return
      }

      setState("enter-mpin")
    }

    checkAuth()

  }, [])

  if (state === "loading") {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    )
  }

  if (state === "signup") {
    return <Redirect href="/(auth)/signup" />
  }

  if (state === "create-mpin") {
    return <Redirect href="/(auth)/create-mpin" />
  }

  return <Redirect href="/(auth)/enter-mpin" />
}
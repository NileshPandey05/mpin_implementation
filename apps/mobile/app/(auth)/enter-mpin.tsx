import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native"
import { useState } from "react"
import { router } from "expo-router"
import * as SecureStore from "expo-secure-store"

import { api } from "@/lib/api"
import { decryptPrivateKey } from "@/security/mpinCrypto"
import { signNonce } from "@/security/signNounce"
import { authenticateBiometric } from "@/security/biometric"
import { saveAccessToken, saveRefreshToken } from "@/storage/secureStore"

export default function EnterMpinScreen() {

  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)

  /* ---------------- AUTHENTICATION FLOW ---------------- */

  const authenticate = async (mpin: string) => {

    try {

      setLoading(true)

      const deviceId = await SecureStore.getItemAsync("device_id")

      if (!deviceId) {
        throw new Error("Device ID missing")
      }

      /* -------- DECRYPT PRIVATE KEY -------- */

      const privateKey = await decryptPrivateKey(mpin)

      if (!privateKey) {
        throw new Error("Invalid MPIN")
      }

      /* -------- REQUEST CHALLENGE -------- */

      const challengeRes = await api.post("/auth/challenge", {
        deviceId
      })

      const nonce = challengeRes.data.nonce

      /* -------- SIGN NONCE -------- */

      const signature = signNonce(nonce, privateKey)

      /* -------- VERIFY SIGNATURE -------- */

      const verifyRes = await api.post("/auth/verify-signature", {
        deviceId,
        nonce,
        signature
      })

      const { accessToken, refreshToken } = verifyRes.data

      /* -------- STORE TOKENS -------- */
      console.table([accessToken, refreshToken])
      await saveAccessToken(accessToken)
      await saveRefreshToken(refreshToken)

      console.log("Login successful")

      router.replace("/(root)/Home")

    } catch (error: any) {

      console.log("MPIN authentication failed:", error?.response?.data)

      setPin("")

      Alert.alert(
        "Authentication Failed",
        "Invalid MPIN or session expired."
      )

    } finally {

      setLoading(false)

    }

  }

  /* ---------------- HANDLE NUMBER PRESS ---------------- */

  const handlePress = async (num: string) => {

    if (loading) return
    if (pin.length >= 4) return

    const newPin = pin + num
    setPin(newPin)

    if (newPin.length === 4) {

      console.log("Entered MPIN:", newPin)

      await authenticate(newPin)

    }
  }

  const handleDelete = () => {

    if (loading) return

    setPin(pin.slice(0, -1))

  }

  /* ---------------- BIOMETRIC LOGIN ---------------- */

  const loginWithBiometric = async () => {

    const success = await authenticateBiometric()

    if (!success) return

    Alert.alert(
      "Biometric Login",
      "Biometric unlock successful. Please enter MPIN."
    )

  }

  /* ---------------- NUMBER PAD COMPONENT ---------------- */

  const Key = ({ value }: { value: string }) => (

    <TouchableOpacity
      onPress={() => handlePress(value)}
      className="w-20 h-20 items-center justify-center"
      disabled={loading}
    >
      <Text className="text-3xl font-semibold">{value}</Text>
    </TouchableOpacity>

  )

  return (

    <View className="flex-1 bg-white justify-center px-8">

      <Text className="text-3xl font-bold text-center mb-4">
        Enter MPIN
      </Text>

      <Text className="text-gray-500 text-center mb-10">
        Enter your 4 digit MPIN
      </Text>

      {/* PIN INDICATOR */}

      <View className="flex-row justify-center gap-4 mb-16">
        {[0,1,2,3].map((i) => (
          <View
            key={i}
            className={`w-5 h-5 rounded-full ${
              pin.length > i ? "bg-black" : "bg-gray-300"
            }`}
          />
        ))}
      </View>

      {/* NUMBER PAD */}

      <View className="gap-6">

        <View className="flex-row justify-between">
          <Key value="1"/>
          <Key value="2"/>
          <Key value="3"/>
        </View>

        <View className="flex-row justify-between">
          <Key value="4"/>
          <Key value="5"/>
          <Key value="6"/>
        </View>

        <View className="flex-row justify-between">
          <Key value="7"/>
          <Key value="8"/>
          <Key value="9"/>
        </View>

        <View className="flex-row justify-between items-center">

          <View className="w-20"/>

          <Key value="0"/>

          <TouchableOpacity
            onPress={handleDelete}
            className="w-20 h-20 items-center justify-center"
            disabled={loading}
          >
            <Text className="text-2xl">⌫</Text>
          </TouchableOpacity>

        </View>

      </View>

      {/* BIOMETRIC LOGIN */}

      <TouchableOpacity
        onPress={loginWithBiometric}
        disabled={loading}
        className="mt-10 items-center"
      >
        <Text className="text-blue-600 text-lg font-semibold">
          Login with Face ID / Fingerprint
        </Text>
      </TouchableOpacity>

      {/* LOADING */}

      {loading && (
        <View className="mt-10 items-center">
          <ActivityIndicator size="small"/>
          <Text className="text-gray-500 mt-2">
            Authenticating...
          </Text>
        </View>
      )}

    </View>
  )
}
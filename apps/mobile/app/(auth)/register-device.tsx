import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native"
import { useState } from "react"
import { router } from "expo-router"
import * as Device from "expo-device"
import * as Application from "expo-application"
import axios from "axios"
import { getAccessToken } from "@/storage/secureStore"
import * as SecureStore from "expo-secure-store"

export default function RegisterDeviceScreen() {

  const [loading, setLoading] = useState(false)

  const handleRegisterDevice = async () => {

    try {

      setLoading(true)

      const token = await getAccessToken()

      const deviceId =
        Application.getAndroidId() ||
        Application.getIosIdForVendorAsync()

      const payload = {
        deviceId: deviceId,
        deviceModel: Device.modelName,
        osVersion: Device.osVersion
      }

      console.log(payload)

      const response = await axios.post(
        "http://10.0.0.103:3000/api/v1/auth/register-device",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      console.log("Device Registered:", response.data)

      await SecureStore.setItemAsync("device_id", payload.deviceId as string)
      router.replace("/create-mpin")

    } catch (error: any) {

      console.log("Register device error:", error.response?.data)

    } finally {

      setLoading(false)

    }
  }

  return (
    <View className="flex-1 justify-center px-6 bg-white">

      <Text className="text-3xl font-bold mb-6">
        Register Device
      </Text>

      <Text className="text-gray-500 mb-10">
        This device will be linked to your account for secure authentication.
      </Text>

      <TouchableOpacity
        className="bg-indigo-600 py-4 rounded-xl items-center"
        onPress={handleRegisterDevice}
        disabled={loading}
      >

        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-lg">
            Register This Device
          </Text>
        )}

      </TouchableOpacity>

    </View>
  )
}
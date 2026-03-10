import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native"
import { useState } from "react"
import { router } from "expo-router"

import { SigninSchema, SigninType } from "@repo/types/types"
import { api } from "@/lib/api"
import { saveAccessToken } from "@/storage/secureStore"

export default function LoginScreen() {

  const [form, setForm] = useState<SigninType>({
    email: "",
    password: ""
  })

  const [errors, setErrors] = useState<{
    email?: string
    password?: string
  }>({})

  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {

    const result = SigninSchema.safeParse(form)

    if (!result.success) {

      const fieldErrors = result.error.flatten().fieldErrors

      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0]
      })

      return
    }

    try {

      setLoading(true)
      setErrors({})

      const response = await api.post("/auth/signin", form)
      console.log(response.data)
      const token = response.data.token

      await saveAccessToken(token)

      console.log("Login success")

      router.replace("/enter-mpin")

    } catch (error: any) {

      console.log("Login error:", error?.response?.data)

      setErrors({
        email: "Invalid email or password"
      })

    } finally {

      setLoading(false)

    }
  }

  return (
    <View className="flex-1 justify-center px-6 bg-white">

      <Text className="text-3xl font-bold mb-8">
        Login
      </Text>

      <TextInput
        placeholder="Email"
        className="border border-gray-300 rounded-xl p-4 mb-2"
        value={form.email}
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={(text) =>
          setForm({ ...form, email: text })
        }
      />

      {errors.email && (
        <Text className="text-red-500 mb-3">
          {errors.email}
        </Text>
      )}

      <TextInput
        placeholder="Password"
        secureTextEntry
        className="border border-gray-300 rounded-xl p-4 mb-2"
        value={form.password}
        onChangeText={(text) =>
          setForm({ ...form, password: text })
        }
      />

      {errors.password && (
        <Text className="text-red-500 mb-3">
          {errors.password}
        </Text>
      )}

      <TouchableOpacity
        className="bg-indigo-600 p-4 rounded-xl mt-2 items-center"
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-lg">
            Login
          </Text>
        )}
      </TouchableOpacity>

      <Text className="text-gray-500 mt-6 text-center">
        Don't have an account?{" "}
        <Text
          className="text-indigo-600 font-semibold"
          onPress={() => router.push("/signup")}
        >
          Signup
        </Text>
      </Text>

    </View>
  )
}
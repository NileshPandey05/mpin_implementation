import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { SignupSchema, SignupType } from "@repo/types/types";
import axios from "axios"

export default function SignupScreen() {
  const [form, setForm] = useState<SignupType>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const handleSignup = async () => {

  const result = SignupSchema.safeParse(form);

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;

    setErrors({
      email: fieldErrors.email?.[0],
      password: fieldErrors.password?.[0],
    });

    return;
  }

  setErrors({});

  try {

    const response = await axios.post(
      "http://10.0.0.103:3000/api/v1/auth/signup",
      form
    );

    console.log("Signup response:", response.data);

    router.push({
      pathname: "/otp",
      params: { email: form.email },
    });

  } catch (error: any) {

    console.log("Signup error:", error.response?.data);

  }
};
  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold mb-8">Create Account</Text>

      <TextInput
        placeholder="Email"
        className="border border-gray-300 rounded-xl p-4 mb-2"
        value={form.email}
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={(text) => setForm({ ...form, email: text })}
      />

      {errors.email && (
        <Text className="text-red-500 mb-3">{errors.email}</Text>
      )}

      <TextInput
        placeholder="Password"
        secureTextEntry
        className="border border-gray-300 rounded-xl p-4 mb-2"
        value={form.password}
        onChangeText={(text) => setForm({ ...form, password: text })}
      />

      {errors.password && (
        <Text className="text-red-500 mb-3">{errors.password}</Text>
      )}

      <TouchableOpacity
        className="bg-indigo-600 p-4 rounded-xl mt-2 items-center"
        onPress={handleSignup}
      >
        <Text className="text-white font-semibold text-lg">Sign Up</Text>
      </TouchableOpacity>

      <Text className="text-gray-500 mt-6 text-center">
        Already have an account?{" "}
        <Text
          className="text-indigo-600 font-semibold"
          onPress={() => router.push("/login")}
        >
          Login
        </Text>
      </Text>
    </View>
  );
}

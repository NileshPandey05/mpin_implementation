import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as Device from "expo-device";
import { router } from "expo-router";
import axios from "axios";

export default function Home() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const id = await SecureStore.getItemAsync("device_id");
      const access = await SecureStore.getItemAsync("access_token");
      const refresh = await SecureStore.getItemAsync("refresh_token");

      setDeviceId(id);
      setAccessToken(access);
      setRefreshToken(refresh);

      setLoading(false);
    };

    loadData();
  }, []);

  const logout = async () => {
    try {
      if (refreshToken) {
        await axios.post("http://10.0.0.103:3000/api/v1/auth/logout", {
          refreshToken,
        });
      }

      await SecureStore.deleteItemAsync("access_token");
      await SecureStore.deleteItemAsync("refresh_token");

      router.replace("/login");
    } catch (error) {
      console.log("Logout error", error);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100 justify-center px-6">
      {/* DEVICE CARD */}

      <View className="bg-white rounded-2xl p-6 shadow-lg">
        <Text className="text-2xl font-bold mb-4">Device Information</Text>

        <View className="space-y-2">
          <Text className="text-gray-700">
            📱 Device Model: {Device.modelName}
          </Text>

          <Text className="text-gray-700">
            💻 OS Version: {Device.osVersion}
          </Text>

          <Text className="text-gray-700">🆔 Device ID:</Text>

          <Text className="text-gray-500 text-xs break-all">{deviceId}</Text>

          <Text className="text-gray-700 mt-2">🔑 Access Token:</Text>

          <Text className="text-gray-500 text-xs break-all">
            {accessToken?.slice(0, 40)}...
          </Text>
        </View>
      </View>

      {/* LOGOUT BUTTON */}

      <TouchableOpacity
        onPress={logout}
        className="bg-red-500 mt-8 py-4 rounded-xl items-center"
      >
        <Text className="text-white text-lg font-semibold">Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

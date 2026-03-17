import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

import { api } from "@/lib/api";
import { generateKeyPair } from "@/security/keypair";
import { encryptPrivateKey } from "@/security/mpinCrypto";
import { saveSecureMpin } from "@/storage/secureStore";

export default function CreateMpinScreen() {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------------- COMPLETE MPIN SETUP ---------------- */

  const completeMpinSetup = async (mpin: string) => {
    try {
      setLoading(true);

      /* Prevent duplicate MPIN */

      const existingKey = await SecureStore.getItemAsync(
        "encrypted_private_key",
      );

      if (existingKey) {
        throw new Error("MPIN already configured on this device");
      }

      /* Generate Keypair */

      const { publicKey, privateKey } = generateKeyPair();

      /* Encrypt private key with MPIN */

      await encryptPrivateKey(privateKey, mpin);

      /* Store MPIN behind biometrics */
      await saveSecureMpin(mpin);

      /* Get device id */

      const deviceId = await SecureStore.getItemAsync("device_id");

      if (!deviceId) {
        throw new Error("Device ID not found");
      }

      /* Register public key */

      await api.post("/auth/register-public-key", {
        deviceId,
        publicKey,
      });

      console.log("Public key registered successfully");

      router.replace("/enter-mpin");
    } catch (error: any) {
      console.error("MPIN setup failed:", error);

      Alert.alert(
        "MPIN Setup Failed",
        error?.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- HANDLE NUMBER PRESS ---------------- */

  const handlePress = async (num: string) => {
    if (loading) return;
    if (pin.length >= 4) return;

    const newPin = pin + num;
    setPin(newPin);

    if (newPin.length === 4) {
      console.log("MPIN Created:", newPin);

      await completeMpinSetup(newPin);
    }
  };

  const handleDelete = () => {
    if (loading) return;

    setPin(pin.slice(0, -1));
  };

  /* ---------------- PIN INDICATOR ---------------- */

  const renderCircle = (index: number) => (
    <View
      key={index}
      className={`w-4 h-4 rounded-full ${
        pin.length > index ? "bg-black" : "bg-gray-300"
      }`}
    />
  );

  const numbers = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
  ];

  return (
    <View className="flex-1 justify-center bg-white px-6">
      <Text className="text-3xl font-bold text-center mb-10">Create MPIN</Text>

      {/* PIN INDICATOR */}

      <View className="flex-row justify-center space-x-4 mb-12">
        {[0, 1, 2, 3].map(renderCircle)}
      </View>

      {/* NUMBER PAD */}

      {numbers.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row justify-center mb-6">
          {row.map((num) => (
            <TouchableOpacity
              key={num}
              className="w-20 h-20 items-center justify-center"
              onPress={() => handlePress(num)}
              disabled={loading}
            >
              <Text className="text-2xl font-semibold">{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {/* LAST ROW */}

      <View className="flex-row justify-center">
        <View className="w-20" />

        <TouchableOpacity
          className="w-20 h-20 items-center justify-center"
          onPress={() => handlePress("0")}
          disabled={loading}
        >
          <Text className="text-2xl font-semibold">0</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="w-20 h-20 items-center justify-center"
          onPress={handleDelete}
          disabled={loading}
        >
          <Text className="text-xl">⌫</Text>
        </TouchableOpacity>
      </View>

      {/* LOADING */}

      {loading && (
        <View className="mt-6 items-center">
          <ActivityIndicator size="small" />
          <Text className="mt-2 text-gray-500">Setting up secure keys...</Text>
        </View>
      )}
    </View>
  );
}

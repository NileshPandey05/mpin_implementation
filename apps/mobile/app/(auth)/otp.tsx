import { View, Text, TextInput } from "react-native";
import { useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { VerifyOtpSchema } from "@repo/types/types";
import axios from "axios";
import { saveAccessToken } from "@/storage/secureStore";

export default function OtpScreen() {
  const { email } = useLocalSearchParams();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const inputs = useRef<Array<TextInput | null>>([]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;

    setOtp(newOtp);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (index: number) => {
    if (index > 0 && !otp[index]) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpValue = otp.join("");

    const result = VerifyOtpSchema.safeParse({
      email,
      otp: otpValue,
    });

    if (!result.success) {
      console.log(result.error);
      return;
    }

    try {
      const response = await axios.post(
        "http://10.0.0.103:3000/api/v1/auth/verify-otp",
        result.data,
      );

      await saveAccessToken(response.data.token);
      console.log(response.data.token);

      console.log(response.data);

      router.push("/security-check");
    } catch (error: any) {
      console.log(error.response?.data);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold mb-4">Verify OTP</Text>

      <Text className="text-gray-500 mb-8">
        Enter the 6 digit code sent to your email
      </Text>

      {/* OTP BOXES */}

      <View className="flex-row justify-between mb-10">
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputs.current[index] = ref;
            }}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === "Backspace") {
                handleBackspace(index);
              }
            }}
            keyboardType="number-pad"
            maxLength={1}
            className="w-12 h-14 border border-gray-300 rounded-xl text-center text-lg"
          />
        ))}
      </View>

      <Text
        className="bg-indigo-600 text-white text-center py-4 rounded-xl font-semibold"
        onPress={handleVerifyOtp}
      >
        Verify OTP
      </Text>
    </View>
  );
}

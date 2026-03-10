import z from "zod";
import { Buffer } from "buffer";

export const SignupSchema = z.object({
  email: z.string().email("Invalid email").trim().toLowerCase(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password too long")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[a-z]/, "Must contain lowercase letter")
    .regex(/[0-9]/, "Must contain number")
    .regex(/[^A-Za-z0-9]/, "Must contain special character"),
});

export const SigninSchema = z.object({
  email: z.string().email("Invalid email").trim().toLowerCase(),

  password: z.string().min(8).max(50),
});

export const VerifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

export const RegisterDeviceSchema = z.object({
  deviceId: z.string().min(5),
  // publicKey: z.string(),
  deviceModel: z.string().optional(),
  osVersion: z.string().optional(),
});

export const ChallengeSchema = z.object({
  deviceId: z.string().min(5),
});

export const VerifySignatureSchema = z.object({
  deviceId: z.string(),
  nonce: z.string(),
  signature: z.string(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const RegisterPublicKeySchema = z.object({
  deviceId: z.string().min(5),
  publicKey: z.string().refine(
    (key) => {
      const buffer = Buffer.from(key, "base64");
      return buffer.length === 32;
    },
    {
      message: "Public key must be a valid 32-byte base64 key",
    },
  ),
});

export type SignupType = z.infer<typeof SignupSchema>;
export type SigninType = z.infer<typeof SigninSchema>;
export type VerifyOtpType = z.infer<typeof VerifyOtpSchema>;
export type RegisterDeviceType = z.infer<typeof RegisterDeviceSchema>;
export type ChallengeType = z.infer<typeof ChallengeSchema>;
export type RefreshTokenType = z.infer<typeof RefreshTokenSchema>;
export type VerifySignatureType = z.infer<typeof VerifySignatureSchema>;

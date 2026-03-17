import nacl from "tweetnacl";
import { prisma } from "@repo/db/prisma";
import { Router } from "express";
import { parse, z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";

import { generateOTP } from "../lib/otp-generator";
import { transporter } from "../lib/email-setup";
import { generateNonce } from "../lib/nonce-generator";
import crypto from "crypto";
import {
  ChallengeSchema,
  RefreshTokenSchema,
  RegisterDeviceSchema,
  SigninSchema,
  SignupSchema,
  VerifyOtpSchema,
  VerifySignatureSchema,
  RegisterPublicKeySchema,
} from "@repo/types/types";

export const authRoute = Router();

/* ---------------- RATE LIMITER ---------------- */

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many requests. Please try again later.",
});

authRoute.use(authLimiter);

/* ---------------- VALIDATION ---------------- */

// export const SignupSchema = z.object({
//   email: z.string().email("Invalid email").trim().toLowerCase(),

//   password: z
//     .string()
//     .min(8, "Password must be at least 8 characters")
//     .max(50, "Password too long")
//     .regex(/[A-Z]/, "Must contain uppercase letter")
//     .regex(/[a-z]/, "Must contain lowercase letter")
//     .regex(/[0-9]/, "Must contain number")
//     .regex(/[^A-Za-z0-9]/, "Must contain special character"),
// });

// export const SigninSchema = z.object({
//   email: z.string().email("Invalid email").trim().toLowerCase(),

//   password: z.string().min(8).max(50),
// });

// export const VerifyOtpSchema = z.object({
//   email: z.string().email(),
//   otp: z
//     .string()
//     .length(6, "OTP must be 6 digits")
//     .regex(/^\d+$/, "OTP must contain only numbers"),
// });

// export const RegisterDeviceSchema = z.object({
//   deviceId: z.string().min(5),
//   publicKey: z.string(),
//   deviceModel: z.string().optional(),
//   osVersion: z.string().optional(),
// });

// export const ChallengeSchema = z.object({
//   deviceId: z.string().min(5),
// });

// export const VerifySignatureSchema = z.object({
//   deviceId: z.string(),
//   nonce: z.string(),
//   signature: z.string(),
// });

// export const RefreshTokenSchema = z.object({
//   refreshToken: z.string(),
// });

/* ---------------- SIGNUP ---------------- */

authRoute.post("/signup", async (req, res) => {
  try {
    const parsed = SignupSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input",
        error: parsed.error.flatten(),
      });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const password = parsed.data.password;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await prisma.emailVerification.upsert({
      where: { userId: user.id },
      update: {
        otp: hashedOtp,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000),
      },
      create: {
        userId: user.id,
        otp: hashedOtp,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000),
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your email",
      html: `<h2>Your OTP is ${otp}</h2>`,
    });

    return res.status(200).json({
      message: "User created. Please verify your email.",
    });
  } catch (error) {
    console.error("Signup Error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

/* ---------------- SIGNIN ---------------- */

authRoute.post("/signin", async (req, res) => {
  try {
    const parsed = SigninSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input",
      });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const password = parsed.data.password;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email first",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET not defined");

    const token = jwt.sign({ id: user.id, email: user.email }, secret, {
      expiresIn: "15m",
    });

    return res.status(200).json({
      message: "User signed in successfully",
      token,
    });
  } catch (error) {
    console.error("Signin Error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

/* ---------------- VERIFY OTP ---------------- */

authRoute.post("/verify-otp", async (req, res) => {
  try {
    const parsed = VerifyOtpSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input",
      });
    }

    const { email, otp } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const record = await prisma.emailVerification.findUnique({
      where: { userId: user.id },
    });

    if (!record) {
      return res.status(400).json({
        message: "OTP not found",
      });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    const isOtpValid = await bcrypt.compare(otp, record.otp);

    if (!isOtpValid) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    await prisma.emailVerification.delete({
      where: { userId: user.id },
    });

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET not defined");

    const token = jwt.sign({ id: user.id, email: user.email }, secret, {
      expiresIn: "15m",
    });

    return res.status(200).json({
      message: "Email verified successfully",
      token,
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

authRoute.post("/register-device", async (req, res) => {
  try {
    const parsed = RegisterDeviceSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input",
      });
    }

    const { deviceId, deviceModel, osVersion } = parsed.data;

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const secret = process.env.JWT_SECRET!;
    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch {
      return res.status(401).json({ message: "Token expired" });
    }

    const userId = decoded.id;

    const device = await prisma.device.upsert({
      where: {
        userId_deviceId: {
          userId,
          deviceId,
        },
      },
      update: {
        deviceModel,
        osVersion,
      },
      create: {
        userId,
        deviceId,
        deviceModel,
        osVersion,
      },
    });

    return res.status(200).json({
      message: "Device registered successfully",
      device,
    });
  } catch (error) {
    console.error("Register Device Error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

authRoute.post("/challenge", async (req, res) => {
  try {
    const parsed = ChallengeSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input",
      });
    }

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const secret = process.env.JWT_SECRET!;
    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch {
      return res.status(401).json({ message: "Token expired" });
    }

    const userId = decoded.id;

    const { deviceId } = parsed.data;

    const device = await prisma.device.findUnique({
      where: {
        userId_deviceId: {
          userId,
          deviceId,
        },
      },
    });

    if (!device) {
      return res.status(403).json({
        message: "Device not registered",
      });
    }

    await prisma.nonce.deleteMany({
      where: {
        expiredAt: {
          lt: new Date(),
        },
      },
    });

    const nonce = generateNonce();

    await prisma.nonce.create({
      data: {
        value: nonce,
        userId,
        deviceId,
        expiredAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    return res.status(200).json({
      nonce,
    });
  } catch (error) {
    console.error("Challenge Error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

authRoute.post("/verify-signature", async (req, res) => {
  try {
    const parsed = VerifySignatureSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input",
      });
    }

    const { deviceId, nonce, signature } = parsed.data;

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    const userId = decoded.id;

    /* ---------------- VERIFY DEVICE ---------------- */

    const device = await prisma.device.findUnique({
      where: {
        userId_deviceId: {
          userId,
          deviceId,
        },
      },
    });

    if (!device) {
      return res.status(403).json({
        message: "Device not registered",
      });
    }

    /* ---------------- VERIFY NONCE ---------------- */

    const nonceRecord = await prisma.nonce.findUnique({
      where: {
        value: nonce,
      },
    });

    if (!nonceRecord) {
      return res.status(400).json({
        message: "Invalid nonce",
      });
    }

    if (nonceRecord.userId !== userId || nonceRecord.deviceId !== deviceId) {
      return res.status(400).json({
        message: "Nonce does not belong to this device",
      });
    }

    if (nonceRecord.expiredAt < new Date()) {
      return res.status(400).json({
        message: "Nonce expired",
      });
    }

    /* ---------------- VERIFY SIGNATURE ---------------- */

    if (!device.publicKey) {
      return res.status(400).json({
        message: "Public key not registered for this device",
      });
    }

    if (!signature) {
      return res.status(400).json({
        message: "Signature missing",
      });
    }

    const message = new TextEncoder().encode(nonce);

    const isValid = nacl.sign.detached.verify(
      message,
      Buffer.from(signature, "base64"),
      Buffer.from(device.publicKey, "base64"),
    );

    if (!isValid) {
      return res.status(401).json({
        message: "Invalid signature",
      });
    }

    /* ---------------- DELETE NONCE (prevent replay) ---------------- */

    await prisma.nonce.delete({
      where: {
        value: nonce,
      },
    });

    /* ---------------- GENERATE TOKENS ---------------- */

    const accessToken = jwt.sign(
      {
        id: userId,
        deviceId,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" },
    );

    const refreshToken = crypto.randomBytes(64).toString("hex");

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await prisma.session.create({
      data: {
        userId,
        deviceDbId: device.id,
        refreshToken: hashedRefreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    return res.status(200).json({
      message: "Authentication successful",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Verify Signature Error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

authRoute.post("/refresh-token", async (req, res) => {
  try {
    const parsed = RefreshTokenSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input",
      });
    }

    const { refreshToken } = parsed.data;

    const sessions = await prisma.session.findMany({
      include: {
        device: true,
      },
    });

    let session = null;

    for (const s of sessions) {
      const isMatch = await bcrypt.compare(refreshToken, s.refreshToken);
      if (isMatch) {
        session = s;
        break;
      }
    }

    if (!session) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    if (session.expiresAt < new Date()) {
      return res.status(401).json({
        message: "Refresh token expired",
      });
    }

    const accessToken = jwt.sign(
      {
        id: session.userId,
        deviceId: session.device.deviceId,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" },
    );

    return res.json({
      accessToken,
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

authRoute.post("/logout", async (req, res) => {
  const parsed = RefreshTokenSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid input",
    });
  }

  const { refreshToken } = parsed.data;

  const sessions = await prisma.session.findMany();

  let session = null;

  for (const s of sessions) {
    const isMatch = await bcrypt.compare(refreshToken, s.refreshToken);
    if (isMatch) {
      session = s;
      break;
    }
  }

  if (!session) {
    return res.status(401).json({
      message: "Invalid refresh token",
    });
  }

  await prisma.session.delete({
    where: { id: session.id },
  });

  return res.json({
    message: "Logged out successfully",
  });
});

authRoute.post("/register-public-key", async (req, res) => {
  try {
    const parsed = RegisterPublicKeySchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input",
      });
    }

    console.log(parsed.data);

    const { deviceId, publicKey } = parsed.data;

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return res.status(401).json({ message: "Token expired" });
    }

    const userId = decoded.id;

    const device = await prisma.device.findUnique({
      where: {
        userId_deviceId: {
          userId,
          deviceId,
        },
      },
    });

    if (!device) {
      return res.status(404).json({
        message: "Device not found",
      });
    }

    if (device.publicKey) {
      return res.status(400).json({
        message: "Public key already registered for this device",
      });
    }

    const updatedDevice = await prisma.device.update({
      where: { id: device.id },
      data: { publicKey },
    });
    return res.status(200).json({
      message: "Public key registered successfully",
      device: updatedDevice,
    });
  } catch (error) {
    console.error("Register Public Key Error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

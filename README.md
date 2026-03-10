# 🔐 Secure MPIN Authentication System

A **mobile authentication system** built with **React Native (Expo) and Node.js**, implementing secure login using **device binding, MPIN encryption, and cryptographic challenge–response authentication**.

---

## 🚀 Features

- 🔑 Ed25519 Public/Private Key Authentication
- 📱 Device Binding
- 🔒 Encrypted Private Key using MPIN
- 🔁 Nonce-based Challenge Response
- 🛡 Replay Attack Protection
- 🔐 Secure Token Storage (Expo SecureStore)
- 👆 Biometric Authentication
- 🚫 Screenshot Protection
- ⏱ Automatic App Lock when backgrounded
- 📧 Email OTP Verification

---

## 🧠 Authentication Flow

1. **User Signup**
2. **OTP Verification**
3. **Device Registration**
4. **Create MPIN**
5. **Generate Public/Private Key**
6. **Encrypt Private Key using MPIN**
7. **Register Public Key with Backend**
8. **Login using MPIN**
9. **Backend sends nonce challenge**
10. **Client signs nonce using private key**
11. **Backend verifies signature**
12. **Access + Refresh tokens issued**

---

## 🔄 Authentication Flow Diagram

![Authentication Flow](/auth-flow.png)

---

## 🏗 Tech Stack

### Mobile
- React Native (Expo)
- Expo Router
- Expo SecureStore
- Expo Local Authentication
- Expo Screen Capture

### Backend
- Node.js
- Express
- Prisma
- PostgreSQL
- JWT Authentication
- TweetNaCl (Ed25519)

---

## 🔐 Security Architecture

- Device-bound authentication
- Private keys never leave the device
- Private key encrypted with MPIN
- Nonce challenge prevents replay attacks
- Tokens stored securely using OS keystore

---

## 📦 Project Structure
```
📦backend
 ┣ 📂lib
 ┃ ┣ 📜email-setup.ts
 ┃ ┣ 📜nonce-generator.ts
 ┃ ┗ 📜otp-generator.ts
 ┣ 📂routes
 ┃ ┗ 📜auth.route.ts

📦mobile
 ┣ 📂app
 ┃ ┣ 📂(auth)
 ┃ ┃ ┣ 📜_layout.tsx
 ┃ ┃ ┣ 📜create-mpin.tsx
 ┃ ┃ ┣ 📜enter-mpin.tsx
 ┃ ┃ ┣ 📜login.tsx
 ┃ ┃ ┣ 📜otp.tsx
 ┃ ┃ ┣ 📜register-device.tsx
 ┃ ┃ ┣ 📜security-check.tsx
 ┃ ┃ ┗ 📜signup.tsx
 ┃ ┣ 📂(root)
 ┃ ┃ ┣ 📜Home.tsx
 ┃ ┃ ┗ 📜_layout.tsx
 ┃ ┣ 📜_layout.tsx
 ┃ ┗ 📜index.tsx
 ┣ 📂lib
 ┃ ┗ 📜api.ts
 ┣ 📂security
 ┃ ┣ 📜appLock.ts
 ┃ ┣ 📜biometric.ts
 ┃ ┣ 📜deviceSecurity.ts
 ┃ ┣ 📜keypair.ts
 ┃ ┣ 📜mpinCrypto.ts
 ┃ ┣ 📜screenSecurity.ts
 ┃ ┗ 📜signNonce.ts
 ┣ 📂storage
   ┗ 📜secureStore.ts

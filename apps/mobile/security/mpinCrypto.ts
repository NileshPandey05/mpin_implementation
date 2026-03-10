import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import CryptoJS from "crypto-js";

const ENCRYPTED_KEY = "encrypted_private_key";
const KEY_IV = "key_iv";
const KEY_SALT = "key_salt";

/* Convert bytes → hex string */
function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function encryptPrivateKey(privateKey: string, mpin: string) {
  const saltBytes = Crypto.getRandomBytes(16);
  const ivBytes = Crypto.getRandomBytes(16);

  const saltHex = bytesToHex(saltBytes);
  const ivHex = bytesToHex(ivBytes);

  const salt = CryptoJS.enc.Hex.parse(saltHex);
  const iv = CryptoJS.enc.Hex.parse(ivHex);

  const derivedKey = CryptoJS.PBKDF2(mpin, salt, {
    keySize: 256 / 32,
    iterations: 10000,
  });

  const encrypted = CryptoJS.AES.encrypt(privateKey, derivedKey, {
    iv: iv,
  }).toString();

  await SecureStore.setItemAsync(ENCRYPTED_KEY, encrypted);
  await SecureStore.setItemAsync(KEY_IV, ivHex);
  await SecureStore.setItemAsync(KEY_SALT, saltHex);
}

export async function decryptPrivateKey(mpin: string) {
  const encrypted = await SecureStore.getItemAsync(ENCRYPTED_KEY);
  const ivHex = await SecureStore.getItemAsync(KEY_IV);
  const saltHex = await SecureStore.getItemAsync(KEY_SALT);

  if (!encrypted || !ivHex || !saltHex) {
    throw new Error("Key not found");
  }

  const derivedKey = CryptoJS.PBKDF2(mpin, CryptoJS.enc.Hex.parse(saltHex), {
    keySize: 256 / 32,
    iterations: 10000,
  });

  const decrypted = CryptoJS.AES.decrypt(encrypted, derivedKey, {
    iv: CryptoJS.enc.Hex.parse(ivHex),
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
}

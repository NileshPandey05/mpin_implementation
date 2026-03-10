import nacl from "tweetnacl"
import { decodeBase64, encodeBase64 } from "tweetnacl-util"

export function signNonce(nonce: string, privateKey: string) {

  if (!nonce) {
    throw new Error("Nonce is missing")
  }

  if (!privateKey) {
    throw new Error("Private key missing")
  }

  const message = new TextEncoder().encode(nonce)

  const secretKey = decodeBase64(privateKey)

  if (secretKey.length !== 64) {
    throw new Error("Invalid private key")
  }

  const signature = nacl.sign.detached(message, secretKey)

  return encodeBase64(signature)
}
// import * as SecureStore from "expo-secure-store"
// import * as Crypto from "expo-crypto"

// export async function generateKeyPair(){

//   const privateKey = await Crypto.digestStringAsync(
//     Crypto.CryptoDigestAlgorithm.SHA256,
//     Math.random().toString()
//   )

//   const publicKey = await Crypto.digestStringAsync(
//     Crypto.CryptoDigestAlgorithm.SHA256,
//     privateKey
//   )

//   await SecureStore.setItemAsync("private_key",privateKey)

//   return publicKey
// }

// import "react-native-get-random-values"
// import nacl from "tweetnacl"
// import * as SecureStore from "expo-secure-store"
// import { encodeBase64 } from "tweetnacl-util"

// export async function generateKeyPair() {

//   const keypair = nacl.sign.keyPair()

//   const publicKey = encodeBase64(keypair.publicKey)
//   const privateKey = encodeBase64(keypair.secretKey)

//   await SecureStore.setItemAsync("private_key", privateKey)

//   return publicKey
// }

import "react-native-get-random-values"
import nacl from "tweetnacl"
import { encodeBase64 } from "tweetnacl-util"

export interface KeyPair {
  publicKey: string
  privateKey: string
}

export function generateKeyPair(): KeyPair {

  const keypair = nacl.sign.keyPair()

  return {
    publicKey: encodeBase64(keypair.publicKey),
    privateKey: encodeBase64(keypair.secretKey)
  }
}
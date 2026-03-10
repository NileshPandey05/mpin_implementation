import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN = "access_token";
const REFRESH_TOKEN = "refresh_token";

const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

export const saveAccessToken = async (token: string) => {
  await SecureStore.setItemAsync(ACCESS_TOKEN, token, options);
};

export const getAccessToken = async () => {
  return await SecureStore.getItemAsync(ACCESS_TOKEN, options);
};

export const saveRefreshToken = async (token: string) => {
  await SecureStore.setItemAsync(REFRESH_TOKEN, token, options);
};

export const getRefreshToken = async () => {
  return await SecureStore.getItemAsync(REFRESH_TOKEN, options);
};

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN);
};
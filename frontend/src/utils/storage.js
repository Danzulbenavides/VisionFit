import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "visionfit_token";
const USER_KEY = "visionfit_user";

export const saveToken = async (token) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async () => {
  return SecureStore.getItemAsync(TOKEN_KEY);
};

export const removeToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

export const saveUser = async (user) => {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
};

export const getUser = async () => {
  const value = await SecureStore.getItemAsync(USER_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    await SecureStore.deleteItemAsync(USER_KEY);

    return null;
  }
};

export const removeUser = async () => {
  await SecureStore.deleteItemAsync(USER_KEY);
};

export const saveAuth = async (token, user) => {
  await Promise.all([saveToken(token), saveUser(user)]);
};

export const clearAuth = async () => {
  await Promise.all([removeToken(), removeUser()]);
};

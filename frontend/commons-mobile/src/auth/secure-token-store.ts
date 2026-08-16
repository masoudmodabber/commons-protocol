import * as SecureStore from "expo-secure-store";

const refreshTokenKey = "commons-market.refresh-token";
const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export interface RefreshTokenStore {
  get(): Promise<string | null>;
  set(refreshToken: string): Promise<void>;
  delete(): Promise<void>;
}

export const secureRefreshTokenStore: RefreshTokenStore = {
  get() {
    return SecureStore.getItemAsync(refreshTokenKey, secureStoreOptions);
  },

  set(refreshToken) {
    return SecureStore.setItemAsync(
      refreshTokenKey,
      refreshToken,
      secureStoreOptions,
    );
  },

  delete() {
    return SecureStore.deleteItemAsync(refreshTokenKey, secureStoreOptions);
  },
};

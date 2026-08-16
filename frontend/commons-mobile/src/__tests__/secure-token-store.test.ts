import * as SecureStore from "expo-secure-store";
import { secureRefreshTokenStore } from "../auth/secure-token-store";

describe("secure refresh token storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("stores, reads, and deletes the refresh token with device-only secure storage", async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue("refresh-token");

    await secureRefreshTokenStore.set("refresh-token");
    await expect(secureRefreshTokenStore.get()).resolves.toBe("refresh-token");
    await secureRefreshTokenStore.delete();

    const options = {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    };
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "commons-market.refresh-token",
      "refresh-token",
      options,
    );
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith(
      "commons-market.refresh-token",
      options,
    );
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      "commons-market.refresh-token",
      options,
    );
  });
});

import Constants from "expo-constants";
import {
  validateApiBaseUrl,
  type AppVariant,
} from "../../config/api-url";

export { validateApiBaseUrl, type AppVariant };

export function getApiBaseUrl(): string {
  const variant = Constants.expoConfig?.extra?.appVariant;

  if (variant !== "development" && variant !== "preview" && variant !== "production") {
    throw new Error("The mobile application variant is not configured.");
  }

  return validateApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL, variant);
}

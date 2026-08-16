import type { ConfigContext, ExpoConfig } from "expo/config";
import { validateApiBaseUrl, type AppVariant } from "./config/api-url";

const developmentIdentifier = "com.example.commonsmarket.dev";

function readVariant(): AppVariant {
  const variant = process.env.APP_VARIANT;

  if (variant === "development" || variant === "preview" || variant === "production") {
    return variant;
  }

  throw new Error(
    "APP_VARIANT must be explicitly set to development, preview, or production.",
  );
}

function readIdentifier(variableName: string, variant: AppVariant): string {
  if (variant === "development") {
    return developmentIdentifier;
  }

  const identifier = process.env[variableName]?.trim();

  if (!identifier) {
    throw new Error(`${variableName} must be supplied for ${variant} builds.`);
  }

  return identifier;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = readVariant();
  const isDevelopment = variant === "development";
  const apiBaseUrl = validateApiBaseUrl(
    process.env.EXPO_PUBLIC_API_BASE_URL,
    variant,
  );

  return {
    ...config,
    name: isDevelopment ? "Commons Market (Dev)" : "Commons Market",
    slug: "commons-market-mobile",
    version: "0.1.0",
    platforms: ["ios", "android"],
    orientation: "portrait",
    scheme: isDevelopment ? "commonsmarket-dev" : "commonsmarket",
    userInterfaceStyle: "automatic",
    plugins: [
      "expo-router",
      "expo-status-bar",
      [
        "expo-build-properties",
        {
          android: {
            usesCleartextTraffic: isDevelopment,
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      appVariant: variant,
      apiBaseUrl,
    },
    android: {
      package: readIdentifier("COMMONS_ANDROID_APPLICATION_ID", variant),
    },
    ios: {
      bundleIdentifier: readIdentifier("COMMONS_IOS_BUNDLE_IDENTIFIER", variant),
      supportsTablet: true,
      infoPlist: isDevelopment
        ? {
            NSAppTransportSecurity: {
              NSAllowsLocalNetworking: true,
            },
            NSLocalNetworkUsageDescription:
              "Commons Market connects to a backend running on your local development network.",
          }
        : undefined,
    },
  };
};

export type AppVariant = "development" | "preview" | "production";

export function validateApiBaseUrl(
  value: string | undefined,
  variant: AppVariant,
): string;

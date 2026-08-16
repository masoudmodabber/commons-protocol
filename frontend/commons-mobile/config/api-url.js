function validateApiBaseUrl(value, variant) {
  const candidate = value?.trim();

  if (!candidate) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL must be configured.");
  }

  let url;

  try {
    url = new URL(candidate);
  } catch {
    throw new Error("EXPO_PUBLIC_API_BASE_URL must be an absolute HTTP or HTTPS URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("EXPO_PUBLIC_API_BASE_URL must use HTTP or HTTPS.");
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      "EXPO_PUBLIC_API_BASE_URL must not contain credentials, a query, or a fragment.",
    );
  }

  if (variant !== "development" && url.protocol !== "https:") {
    throw new Error(`${variant} API communication must use HTTPS.`);
  }

  if (
    variant === "development" &&
    url.protocol === "http:" &&
    !isLocalDevelopmentHost(url.hostname)
  ) {
    throw new Error("Development HTTP API addresses must refer to a local host.");
  }

  return candidate.replace(/\/+$/, "");
}

function isLocalDevelopmentHost(hostname) {
  const normalizedHostname = hostname.toLowerCase();

  if (
    normalizedHostname === "localhost" ||
    normalizedHostname === "127.0.0.1" ||
    normalizedHostname === "10.0.2.2" ||
    normalizedHostname === "[::1]" ||
    normalizedHostname.endsWith(".local")
  ) {
    return true;
  }

  const octets = normalizedHostname.split(".").map(Number);

  if (
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return false;
  }

  return (
    octets[0] === 10 ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168)
  );
}

module.exports = { validateApiBaseUrl };

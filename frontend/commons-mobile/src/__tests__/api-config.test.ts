import { validateApiBaseUrl } from "../config/api";

describe("mobile API configuration", () => {
  it.each([
    "http://10.0.2.2:8080",
    "http://192.168.1.20:8080",
    "http://development-machine.local:8080",
    "https://development.example.com",
  ])("allows %s for a development build", (url) => {
    expect(validateApiBaseUrl(url, "development")).toBe(url);
  });

  it("rejects cleartext access to a non-local host in development", () => {
    expect(() => validateApiBaseUrl("http://example.com", "development")).toThrow(
      "Development HTTP API addresses must refer to a local host.",
    );
  });

  it.each(["preview", "production"] as const)(
    "requires HTTPS for %s builds",
    (variant) => {
      expect(() => validateApiBaseUrl("http://192.168.1.20:8080", variant)).toThrow(
        `${variant} API communication must use HTTPS.`,
      );
    },
  );

  it("normalizes a trailing slash", () => {
    expect(validateApiBaseUrl("https://api.example.com/", "production")).toBe(
      "https://api.example.com",
    );
  });
});

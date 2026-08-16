import { getApiBaseUrl } from "../config/api";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export interface HttpClient {
  request<T>(path: string, options?: RequestInit): Promise<T>;
}

export function createHttpClient(apiBaseUrl = getApiBaseUrl()): HttpClient {
  return {
    async request<T>(path: string, options: RequestInit = {}): Promise<T> {
      const headers = new Headers(options.headers);
      headers.set("Accept", "application/json");

      if (options.body) {
        headers.set("Content-Type", "application/json");
      }

      const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });

      if (!response.ok) {
        throw new ApiError(response.status, "The request could not be completed.");
      }

      if (response.status === 204 || response.headers.get("content-length") === "0") {
        return undefined as T;
      }

      return (await response.json()) as T;
    },
  };
}

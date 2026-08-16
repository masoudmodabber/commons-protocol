import { getApiBaseUrl } from "../config/api";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface HttpClient {
  request<T>(path: string, options?: RequestInit, accessToken?: string): Promise<T>;
}

interface ProblemDetails {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

export function createHttpClient(apiBaseUrl = getApiBaseUrl()): HttpClient {
  return {
    async request<T>(
      path: string,
      options: RequestInit = {},
      accessToken?: string,
    ): Promise<T> {
      const headers = new Headers(options.headers);
      headers.set("Accept", "application/json");

      if (options.body) {
        headers.set("Content-Type", "application/json");
      }

      if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
      }

      const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });

      if (!response.ok) {
        let message = "The request could not be completed.";

        try {
          const problem = (await response.json()) as ProblemDetails;
          const validationMessage = Object.values(problem.errors ?? {})
            .flat()
            .join(" ");
          message = validationMessage || problem.detail || problem.title || message;
        } catch {
          // Responses without a JSON problem body use the safe fallback message.
        }

        throw new ApiError(response.status, message);
      }

      if (response.status === 204 || response.headers.get("content-length") === "0") {
        return undefined as T;
      }

      return (await response.json()) as T;
    },
  };
}

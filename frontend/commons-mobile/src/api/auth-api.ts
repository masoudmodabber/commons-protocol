import type { AccessTokenResponse } from "./contracts";
import { createHttpClient, type HttpClient } from "./http-client";

export interface Credentials {
  email: string;
  password: string;
}

export interface AuthApi {
  register(credentials: Credentials): Promise<void>;
  login(credentials: Credentials): Promise<AccessTokenResponse>;
  refresh(refreshToken: string): Promise<AccessTokenResponse>;
}

export function createAuthApi(httpClient: HttpClient = createHttpClient()): AuthApi {
  return {
    register(credentials) {
      return httpClient.request<void>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
    },

    login(credentials) {
      return httpClient.request<AccessTokenResponse>(
        "/api/auth/login?useCookies=false",
        {
          method: "POST",
          body: JSON.stringify(credentials),
        },
      );
    },

    refresh(refreshToken) {
      return httpClient.request<AccessTokenResponse>("/api/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
    },
  };
}

import { createAuthApi } from "../api/auth-api";
import { createHttpClient, ApiError, type HttpClient } from "../api/http-client";
import { createParticipantsApi } from "../api/participants-api";

describe("mobile API clients", () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn();
  });

  it("requests token authentication explicitly and refreshes with only the refresh token", async () => {
    const request = jest.fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ accessToken: "access", refreshToken: "refresh" })
      .mockResolvedValueOnce({ accessToken: "next-access", refreshToken: "next-refresh" });
    const authApi = createAuthApi({ request } as HttpClient);

    await authApi.register({ email: "person@example.com", password: "secret" });
    await authApi.login({ email: "person@example.com", password: "secret" });
    await authApi.refresh("refresh");

    expect(request).toHaveBeenNthCalledWith(
      1,
      "/api/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ email: "person@example.com", password: "secret" }),
      },
    );
    expect(request).toHaveBeenNthCalledWith(
      2,
      "/api/auth/login?useCookies=false",
      {
        method: "POST",
        body: JSON.stringify({ email: "person@example.com", password: "secret" }),
      },
    );
    expect(request).toHaveBeenNthCalledWith(3, "/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: "refresh" }),
    });
  });

  it("sends only the documented participant join values", async () => {
    const request = jest.fn().mockResolvedValue(undefined);
    const participantsApi = createParticipantsApi(request);
    const input = {
      homeCommonsId: "commons-1",
      displayName: "Alice",
      bio: null,
    };

    await participantsApi.joinCommons(input);

    expect(request).toHaveBeenCalledWith("/api/participants/me", {
      method: "POST",
      body: JSON.stringify(input),
    });
    expect(request.mock.calls[0][1].body).not.toContain("participantId");
    expect(request.mock.calls[0][1].body).not.toContain("userId");
  });

  it("adds the bearer token and surfaces backend problem details", async () => {
    const fetchMock = jest.mocked(fetch);
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: { get: () => null },
      json: async () => ({ title: "A Participant requires a display name." }),
    } as unknown as Response);
    const httpClient = createHttpClient("https://api.example.com");

    await expect(
      httpClient.request("/api/participants/me", {}, "access-token"),
    ).rejects.toEqual(
      new ApiError(400, "A Participant requires a display name."),
    );

    const request = fetchMock.mock.calls[0][1];
    expect(new Headers(request?.headers).get("Authorization")).toBe(
      "Bearer access-token",
    );
  });
});

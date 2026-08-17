import { createAuthApi } from "../api/auth-api";
import { createHttpClient, ApiError, type HttpClient } from "../api/http-client";
import { createParticipantsApi } from "../api/participants-api";
import { createRequestsApi } from "../api/requests-api";

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

  it("uses current-participant Capability endpoints without client identity values", async () => {
    const request = jest.fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ id: "capability-1", text: "Carpentry" })
      .mockResolvedValueOnce(undefined);
    const participantsApi = createParticipantsApi(request);

    await participantsApi.getMyCapabilities();
    await participantsApi.addCapability("  Carpentry  ");
    await participantsApi.removeCapability("capability-1");

    expect(request).toHaveBeenNthCalledWith(
      1,
      "/api/participants/me/capabilities",
    );
    expect(request).toHaveBeenNthCalledWith(
      2,
      "/api/participants/me/capabilities",
      {
        method: "POST",
        body: JSON.stringify({ text: "  Carpentry  " }),
      },
    );
    expect(request).toHaveBeenNthCalledWith(
      3,
      "/api/participants/me/capabilities/capability-1",
      { method: "DELETE" },
    );
    expect(request.mock.calls.flat().join(" ")).not.toContain("participantId");
    expect(request.mock.calls.flat().join(" ")).not.toContain("userId");
  });

  it("creates and reads a Request without submitting ownership values", async () => {
    const request = jest.fn()
      .mockResolvedValueOnce({ id: "request-1", status: "Open" })
      .mockResolvedValueOnce({ id: "request-1", status: "Open" });
    const requestsApi = createRequestsApi(request);
    const input = {
      title: "  Help repairing a fence  ",
      description: "  One garden fence panel needs replacing.  ",
    };

    await requestsApi.createRequest(input);
    await requestsApi.getRequest("request-1");

    expect(request).toHaveBeenNthCalledWith(1, "/api/requests", {
      method: "POST",
      body: JSON.stringify(input),
    });
    expect(request).toHaveBeenNthCalledWith(2, "/api/requests/request-1");
    expect(JSON.parse(request.mock.calls[0][1].body)).toEqual(input);
  });

  it("browses Requests without submitting scope or search values", async () => {
    const request = jest.fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ id: "request-2", status: "Open" });
    const requestsApi = createRequestsApi(request);

    await requestsApi.browseRequests();
    await requestsApi.getBrowseRequest("request-2");

    expect(request).toHaveBeenNthCalledWith(1, "/api/requests/browse");
    expect(request).toHaveBeenNthCalledWith(
      2,
      "/api/requests/browse/request-2",
    );
    expect(request.mock.calls.flat().join(" ")).not.toMatch(
      /commonsId|participantId|userId|creatorId|ownership|search/i,
    );
  });

  it("edits only Request title and description", async () => {
    const request = jest.fn().mockResolvedValue({
      id: "request-1",
      title: "Corrected title",
      description: "Corrected description",
      status: "Open",
    });
    const requestsApi = createRequestsApi(request);
    const input = {
      title: "  Corrected title  ",
      description: "  Corrected description  ",
    };

    await requestsApi.editRequest("request-1", input);

    expect(request).toHaveBeenCalledWith("/api/requests/request-1", {
      method: "PUT",
      body: JSON.stringify(input),
    });
    expect(JSON.parse(request.mock.calls[0][1].body)).toEqual(input);
  });

  it("cancels a Request with a bodyless lifecycle command", async () => {
    const request = jest.fn().mockResolvedValue({
      id: "request-1",
      status: "Cancelled",
    });
    const requestsApi = createRequestsApi(request);

    await requestsApi.cancelRequest("request-1");

    expect(request).toHaveBeenCalledWith(
      "/api/requests/request-1/cancel",
      { method: "POST" },
    );
    expect(request.mock.calls[0][1].body).toBeUndefined();
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

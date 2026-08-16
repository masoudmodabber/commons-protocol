import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Text, Pressable } from "react-native";
import type { AuthApi } from "../api/auth-api";
import { ApiError, type HttpClient } from "../api/http-client";
import {
  availableCommonsQueryKey,
  participantCapabilitiesQueryKey,
  participantProfileQueryKey,
} from "../api/participants-api";
import { SessionProvider, useSession } from "../auth/session-context";
import type { RefreshTokenStore } from "../auth/secure-token-store";

const tokens = {
  tokenType: "Bearer",
  accessToken: "restored-access",
  expiresIn: 3600,
  refreshToken: "rotated-refresh",
};

function SessionProbe() {
  const session = useSession();

  return (
    <>
      <Text>{session.status}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => void session.signOut()}
      >
        <Text>Sign out</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => void session.request("/api/participants/me")}
      >
        <Text>Load profile</Text>
      </Pressable>
    </>
  );
}

function createDependencies() {
  const authApi: AuthApi = {
    register: jest.fn().mockResolvedValue(undefined),
    login: jest.fn().mockResolvedValue(tokens),
    refresh: jest.fn().mockResolvedValue(tokens),
  };
  const tokenStore: RefreshTokenStore = {
    get: jest.fn().mockResolvedValue("stored-refresh"),
    set: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
  };
  const httpClient: HttpClient = {
    request: jest.fn().mockResolvedValue({}),
  };

  return { authApi, tokenStore, httpClient };
}

describe("mobile session", () => {
  it("restores with a refresh token, keeps access in memory, and signs out locally", async () => {
    const dependencies = createDependencies();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    queryClient.setQueryData(participantProfileQueryKey, { id: "participant-1" });
    queryClient.setQueryData(participantCapabilitiesQueryKey, [
      { id: "capability-1", text: "Carpentry" },
    ]);
    queryClient.setQueryData(availableCommonsQueryKey, [{ id: "commons-1" }]);
    const view = await render(
      <QueryClientProvider client={queryClient}>
        <SessionProvider {...dependencies}>
          <SessionProbe />
        </SessionProvider>
      </QueryClientProvider>,
    );

    expect(await view.findByText("authenticated")).toBeOnTheScreen();
    expect(dependencies.authApi.refresh).toHaveBeenCalledWith("stored-refresh");
    expect(dependencies.tokenStore.set).toHaveBeenCalledWith("rotated-refresh");

    await fireEvent.press(view.getByRole("button", { name: "Load profile" }));
    await waitFor(() => {
      expect(dependencies.httpClient.request).toHaveBeenCalledWith(
        "/api/participants/me",
        {},
        "restored-access",
      );
    });

    await fireEvent.press(view.getByRole("button", { name: "Sign out" }));
    expect(await view.findByText("unauthenticated")).toBeOnTheScreen();
    expect(dependencies.tokenStore.delete).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(participantProfileQueryKey)).toBeUndefined();
    expect(
      queryClient.getQueryData(participantCapabilitiesQueryKey),
    ).toBeUndefined();
    expect(queryClient.getQueryData(availableCommonsQueryKey)).toBeUndefined();
  });

  it("deletes an invalid restored session", async () => {
    const dependencies = createDependencies();
    jest.mocked(dependencies.authApi.refresh).mockRejectedValue(new Error("invalid"));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    const view = await render(
      <QueryClientProvider client={queryClient}>
        <SessionProvider {...dependencies}>
          <SessionProbe />
        </SessionProvider>
      </QueryClientProvider>,
    );

    expect(await view.findByText("unauthenticated")).toBeOnTheScreen();
    expect(dependencies.tokenStore.delete).toHaveBeenCalledTimes(1);
    expect(dependencies.tokenStore.set).not.toHaveBeenCalled();
  });

  it("refreshes once after an unauthorized response and retries with the new access token", async () => {
    const dependencies = createDependencies();
    jest.mocked(dependencies.authApi.refresh)
      .mockResolvedValueOnce(tokens)
      .mockResolvedValueOnce({
        ...tokens,
        accessToken: "refreshed-access",
        refreshToken: "second-rotated-refresh",
      });
    jest.mocked(dependencies.tokenStore.get)
      .mockResolvedValueOnce("stored-refresh")
      .mockResolvedValueOnce("rotated-refresh");
    jest.mocked(dependencies.httpClient.request)
      .mockRejectedValueOnce(new ApiError(401, "Unauthorized"))
      .mockResolvedValueOnce({ id: "participant-1" });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    const view = await render(
      <QueryClientProvider client={queryClient}>
        <SessionProvider {...dependencies}>
          <SessionProbe />
        </SessionProvider>
      </QueryClientProvider>,
    );

    expect(await view.findByText("authenticated")).toBeOnTheScreen();
    await fireEvent.press(view.getByRole("button", { name: "Load profile" }));

    await waitFor(() => {
      expect(dependencies.httpClient.request).toHaveBeenNthCalledWith(
        2,
        "/api/participants/me",
        {},
        "refreshed-access",
      );
    });
    expect(dependencies.authApi.refresh).toHaveBeenCalledTimes(2);
    expect(dependencies.tokenStore.set).toHaveBeenLastCalledWith(
      "second-rotated-refresh",
    );
  });
});

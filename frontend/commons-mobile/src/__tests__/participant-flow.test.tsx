import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import type { AuthApi } from "../api/auth-api";
import { ApiError, type HttpClient } from "../api/http-client";
import { participantProfileQueryKey } from "../api/participants-api";
import type { ParticipantProfile } from "../api/contracts";
import { SessionProvider } from "../auth/session-context";
import type { RefreshTokenStore } from "../auth/secure-token-store";
import { JoinCommonsScreen } from "../screens/join-commons-screen";
import { ProfileScreen } from "../screens/profile-screen";

const mockRouterReplace = jest.fn();
const mockRouterPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
    push: mockRouterPush,
  }),
}));

const tokens = {
  tokenType: "Bearer",
  accessToken: "access-token",
  expiresIn: 3600,
  refreshToken: "rotated-refresh-token",
};

const profile: ParticipantProfile = {
  id: "participant-1",
  displayName: "Alice",
  bio: "Happy to help locally.",
  joinedAt: "2026-08-16T00:00:00Z",
  homeCommons: { id: "commons-1", name: "Home Commons" },
};

function createHarness(httpClient: HttpClient) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  const authApi: AuthApi = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn().mockResolvedValue(tokens),
  };
  const tokenStore: RefreshTokenStore = {
    get: jest.fn().mockResolvedValue("stored-refresh-token"),
    set: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <SessionProvider
          authApi={authApi}
          httpClient={httpClient}
          tokenStore={tokenStore}
        >
          {children}
        </SessionProvider>
      </QueryClientProvider>
    );
  }

  return { Wrapper, queryClient, tokenStore };
}

describe("US 001 participant flow", () => {
  beforeEach(() => {
    mockRouterReplace.mockClear();
    mockRouterPush.mockClear();
  });

  it("selects an existing Commons, joins with no client identity, and caches the server profile", async () => {
    const request = jest.fn(async (path: string, options: RequestInit = {}) => {
      if (path === "/api/commons") {
        return [{ id: "commons-1", name: "Home Commons" }];
      }

      if (path === "/api/participants/me" && options.method === "POST") {
        return undefined;
      }

      if (path === "/api/participants/me") {
        return profile;
      }

      throw new Error(`Unexpected request: ${path}`);
    });
    const harness = createHarness({ request } as HttpClient);
    const view = await render(<JoinCommonsScreen />, { wrapper: harness.Wrapper });

    await fireEvent.press(await view.findByRole("radio", { name: "Home Commons" }));
    await fireEvent.changeText(view.getByLabelText("Display name"), "  Alice  ");
    await fireEvent.changeText(view.getByLabelText("Short bio (optional)"), "   ");
    await fireEvent.press(view.getByRole("button", { name: "Join this Commons" }));

    await waitFor(() => {
      expect(harness.queryClient.getQueryData(participantProfileQueryKey)).toEqual(
        profile,
      );
    });
    expect(mockRouterReplace).not.toHaveBeenCalled();

    const joinCall = request.mock.calls.find(
      ([path, options]) =>
        path === "/api/participants/me" && options?.method === "POST",
    );
    expect(JSON.parse(joinCall?.[1]?.body as string)).toEqual({
      homeCommonsId: "commons-1",
      displayName: "Alice",
      bio: null,
    });
  });

  it("shows the participant profile, Home Commons, and Capability management", async () => {
    const request = jest.fn(async (path: string) => {
      if (path === "/api/participants/me") {
        return profile;
      }

      if (path === "/api/participants/me/capabilities") {
        return [{ id: "capability-1", text: "Carpentry" }];
      }

      throw new Error(`Unexpected request: ${path}`);
    });
    const harness = createHarness({ request } as HttpClient);
    const view = await render(<ProfileScreen />, { wrapper: harness.Wrapper });

    expect(await view.findByRole("header", { name: "Alice" })).toBeOnTheScreen();
    expect(view.getAllByText("Home Commons")).toHaveLength(2);
    expect(view.getByText("Happy to help locally.")).toBeOnTheScreen();
    expect(view.getByRole("header", { name: "Capabilities" })).toBeOnTheScreen();
    expect(await view.findByText("Carpentry")).toBeOnTheScreen();
    await fireEvent.press(
      view.getByRole("button", { name: "Browse Available Requests" }),
    );
    expect(mockRouterPush).toHaveBeenCalledWith("/available-requests");
    await fireEvent.press(view.getByRole("button", { name: "Create a Request" }));
    expect(mockRouterPush).toHaveBeenCalledWith("/requests/new");
    await fireEvent.press(view.getByRole("button", { name: "My Requests" }));
    expect(mockRouterPush).toHaveBeenCalledWith("/requests");
    await fireEvent.press(view.getByRole("button", { name: "My Offers" }));
    expect(mockRouterPush).toHaveBeenCalledWith("/offers");
    await fireEvent.press(view.getByRole("button", { name: "My Agreements" }));
    expect(mockRouterPush).toHaveBeenCalledWith("/agreements");
  });

  it("recovers a duplicate join by loading the server-owned profile", async () => {
    const request = jest.fn(async (path: string, options: RequestInit = {}) => {
      if (path === "/api/commons") {
        return [{ id: "commons-1", name: "Home Commons" }];
      }

      if (path === "/api/participants/me" && options.method === "POST") {
        throw new ApiError(409, "The authenticated user already has a Participant identity.");
      }

      if (path === "/api/participants/me") {
        return profile;
      }

      throw new Error(`Unexpected request: ${path}`);
    });
    const harness = createHarness({ request } as HttpClient);
    const view = await render(<JoinCommonsScreen />, { wrapper: harness.Wrapper });

    await fireEvent.press(await view.findByRole("radio", { name: "Home Commons" }));
    await fireEvent.changeText(view.getByLabelText("Display name"), "Alice");
    await fireEvent.press(view.getByRole("button", { name: "Join this Commons" }));

    await waitFor(() => {
      expect(harness.queryClient.getQueryData(participantProfileQueryKey)).toEqual(
        profile,
      );
    });
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });
});

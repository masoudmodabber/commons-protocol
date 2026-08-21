import * as SecureStore from "expo-secure-store";
import * as RouterTestingLibrary from "expo-router/testing-library";
import { screen } from "@testing-library/react-native";
import type { ParticipantProfile } from "../api/contracts";
import RootLayout from "../app/_layout";
import IndexRoute from "../app/index";
import { JoinCommonsScreen } from "../screens/join-commons-screen";
import { ProfileScreen } from "../screens/profile-screen";

jest.mock("../config/api", () => ({
  getApiBaseUrl: () => "http://10.0.2.2:8080",
}));

const profile: ParticipantProfile = {
  id: "participant-1",
  displayName: "Alice",
  bio: null,
  joinedAt: "2026-08-21T00:00:00Z",
  homeCommons: { id: "commons-1", name: "Gold Coast Commons" },
};

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("participant protected-route navigation", () => {
  beforeEach(() => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue("stored-refresh-token");
    jest.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);
    jest.mocked(SecureStore.deleteItemAsync).mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await RouterTestingLibrary.cleanup();
    jest.useRealTimers();
  });

  it("moves from join to the Participant profile when the authoritative profile is cached", async () => {
    let joined = false;
    globalThis.fetch = jest.fn(async (input, options = {}) => {
      const url = String(input);
      const path = new URL(url).pathname + new URL(url).search;

      if (path === "/api/auth/refresh" && options.method === "POST") {
        return jsonResponse(200, {
          tokenType: "Bearer",
          accessToken: "access-token",
          expiresIn: 3600,
          refreshToken: "rotated-refresh-token",
        });
      }

      if (path === "/api/participants/me" && options.method === "POST") {
        joined = true;
        return jsonResponse(204, undefined);
      }

      if (path === "/api/participants/me") {
        return joined
          ? jsonResponse(200, profile)
          : jsonResponse(404, { title: "Participant not found." });
      }

      if (path === "/api/commons") {
        return jsonResponse(200, [
          { id: "commons-1", name: "Gold Coast Commons" },
        ]);
      }

      if (path === "/api/participants/me/capabilities") {
        return jsonResponse(200, []);
      }

      throw new Error(`Unexpected request: ${path}`);
    }) as jest.Mock;

    const router = RouterTestingLibrary.renderRouter(
      {
        _layout: RootLayout,
        index: IndexRoute,
        join: JoinCommonsScreen,
        profile: ProfileScreen,
        "available-requests/index": () => null,
        "available-requests/[requestId]": () => null,
        "available-requests/[requestId]/offer": () => null,
        "offers/index": () => null,
        "offers/[offerId]": () => null,
        "agreements/index": () => null,
        "agreements/[agreementId]": () => null,
        "requests/index": () => null,
        "requests/new": () => null,
        "requests/[requestId]": () => null,
        "requests/[requestId]/offers": () => null,
        "sign-in": () => null,
        register: () => null,
      },
      { initialUrl: "/" },
    );
    await (router as unknown as Promise<unknown>);

    expect(
      await screen.findByRole("header", {
        name: "Join a Commons",
      }),
    ).toBeOnTheScreen();
    expect(router.getPathname()).toBe("/join");
    const joinNavigationState = router
      .getRouterState()
      ?.routes.find((route) => route.name === "__root")?.state;
    expect(joinNavigationState?.routeNames).toContain("join");

    await RouterTestingLibrary.fireEvent.press(
      await screen.findByRole("radio", {
        name: "Gold Coast Commons",
      }),
    );
    await RouterTestingLibrary.fireEvent.changeText(
      screen.getByLabelText("Display name"),
      "Alice",
    );
    await RouterTestingLibrary.fireEvent.press(
      screen.getByRole("button", {
        name: "Join this Commons",
      }),
    );

    expect(
      await screen.findByRole("header", { name: "Alice" }),
    ).toBeOnTheScreen();
    await RouterTestingLibrary.waitFor(() =>
      expect(router.getPathname()).toBe("/profile"),
    );

    const navigationState = router
      .getRouterState()
      ?.routes.find((route) => route.name === "__root")?.state;
    expect(navigationState?.routeNames).not.toContain("join");
    expect(navigationState?.routeNames).toContain("profile");
    expect(
      navigationState?.routes[navigationState.index ?? 0]?.name,
    ).toBe("profile");
    expect(
      screen.queryByRole("header", {
        name: "Join a Commons",
      }),
    ).toBeNull();
  });
});

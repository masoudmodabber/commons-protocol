import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("US 001 participant join flow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lets an authenticated person select a Commons and view the created profile", async () => {
    sessionStorage.setItem("commons-access-token", "access-token");
    let hasJoined = false;

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const path = input.toString();

      if (path.endsWith("/api/participants/me") && init?.method === "POST") {
        hasJoined = true;
        return jsonResponse({ id: "participant-1" }, 201);
      }

      if (path.endsWith("/api/participants/me")) {
        return hasJoined
          ? jsonResponse({
              id: "participant-1",
              displayName: "Alice",
              bio: "Neighbourhood gardener",
              joinedAt: "2026-08-14T00:00:00Z",
              homeCommons: { id: "commons-1", name: "Brisbane Commons" },
              capabilities: [],
            })
          : jsonResponse({ title: "Not found" }, 404);
      }

      if (path.endsWith("/api/commons")) {
        return jsonResponse([{ id: "commons-1", name: "Brisbane Commons" }]);
      }

      throw new Error(`Unexpected request: ${path}`);
    });

    renderApp();

    expect(await screen.findByRole("heading", { name: "Join a Commons" })).toBeInTheDocument();
    fireEvent.change(await screen.findByLabelText("Home Commons"), { target: { value: "commons-1" } });
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Alice" } });
    fireEvent.change(screen.getByLabelText("Short bio (optional)"), {
      target: { value: "Neighbourhood gardener" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Join this Commons" }));

    expect(await screen.findByRole("heading", { name: "Alice" })).toBeInTheDocument();
    expect(screen.getByText("Neighbourhood gardener")).toBeInTheDocument();
    expect(screen.getByText("Brisbane Commons")).toBeInTheDocument();

    await waitFor(() => {
      const joinRequest = vi.mocked(fetch).mock.calls.find(([, options]) => options?.method === "POST");
      expect(joinRequest?.[1]?.body).toBe(JSON.stringify({
        homeCommonsId: "commons-1",
        displayName: "Alice",
        bio: "Neighbourhood gardener",
      }));
    });
  });

  it("registers a new account and continues to Commons selection", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const path = input.toString();

      if (path.endsWith("/api/auth/register")) {
        return new Response(null, { status: 200, headers: { "Content-Length": "0" } });
      }

      if (path.endsWith("/api/auth/login")) {
        return jsonResponse({ accessToken: "new-access-token" });
      }

      if (path.endsWith("/api/participants/me")) {
        return jsonResponse({ title: "Not found" }, 404);
      }

      if (path.endsWith("/api/commons")) {
        return jsonResponse([{ id: "commons-1", name: "Brisbane Commons" }]);
      }

      throw new Error(`Unexpected request: ${path}`);
    });

    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "New here? Create an account" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "alice@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "ValidPassword1!" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("heading", { name: "Join a Commons" })).toBeInTheDocument();
    expect(sessionStorage.getItem("commons-access-token")).toBe("new-access-token");
    expect(vi.mocked(fetch).mock.calls[0][0].toString()).toContain("/api/auth/register");
    expect(vi.mocked(fetch).mock.calls[1][0].toString()).toContain("/api/auth/login");
  });
});

describe("US 002 Capability management", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lets a Participant add, view, and remove free-text Capabilities", async () => {
    sessionStorage.setItem("commons-access-token", "access-token");
    let capabilities: Array<{ id: string; text: string }> = [];

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const path = input.toString();

      if (path.endsWith("/api/participants/me/capabilities") && init?.method === "POST") {
        capabilities = [{ id: "capability-1", text: "Computer Hardware Repair" }];
        return jsonResponse(capabilities[0], 201);
      }

      if (path.endsWith("/api/participants/me/capabilities/capability-1")
          && init?.method === "DELETE") {
        capabilities = [];
        return new Response(null, { status: 204 });
      }

      if (path.endsWith("/api/participants/me")) {
        return jsonResponse({
          id: "participant-1",
          displayName: "Alice",
          bio: null,
          joinedAt: "2026-08-14T00:00:00Z",
          homeCommons: { id: "commons-1", name: "Brisbane Commons" },
          capabilities,
        });
      }

      throw new Error(`Unexpected request: ${path}`);
    });

    renderApp();

    expect(await screen.findByRole("heading", { name: "Capabilities" })).toBeInTheDocument();
    expect(screen.getByText(/do not indicate availability, price, quantity, or an obligation/i))
      .toBeInTheDocument();
    expect(screen.getByText("You have not listed any Capabilities yet.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Add a Capability"), {
      target: { value: "  Computer Hardware Repair  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Capability" }));

    expect(await screen.findByText("Computer Hardware Repair")).toBeInTheDocument();
    const addRequest = vi.mocked(fetch).mock.calls.find(([, options]) => options?.method === "POST");
    expect(addRequest?.[1]?.body).toBe(JSON.stringify({ text: "  Computer Hardware Repair  " }));

    fireEvent.click(screen.getByRole("button", { name: "Remove Computer Hardware Repair" }));

    expect(await screen.findByText("You have not listed any Capabilities yet.")).toBeInTheDocument();
    expect(screen.queryByText("Computer Hardware Repair")).not.toBeInTheDocument();
  });

  it("shows duplicate Capability rejection from the domain-backed API", async () => {
    sessionStorage.setItem("commons-access-token", "access-token");

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const path = input.toString();

      if (path.endsWith("/api/participants/me/capabilities") && init?.method === "POST") {
        return jsonResponse({
          title: "This Capability is already listed on the Participant's profile.",
        }, 409);
      }

      if (path.endsWith("/api/participants/me")) {
        return jsonResponse({
          id: "participant-1",
          displayName: "Alice",
          bio: null,
          joinedAt: "2026-08-14T00:00:00Z",
          homeCommons: { id: "commons-1", name: "Brisbane Commons" },
          capabilities: [{ id: "capability-1", text: "Carpentry" }],
        });
      }

      throw new Error(`Unexpected request: ${path}`);
    });

    renderApp();
    await screen.findByText("Carpentry");
    fireEvent.change(screen.getByLabelText("Add a Capability"), {
      target: { value: "  cArPeNtRy  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Capability" }));

    expect(await screen.findByRole("alert"))
      .toHaveTextContent("already listed on the Participant's profile");
  });
});

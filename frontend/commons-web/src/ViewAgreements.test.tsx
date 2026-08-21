import { fireEvent, render, screen } from "@testing-library/react";
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

const agreement = {
  id: "agreement-1",
  request: {
    id: "request-1",
    title: "Repair a garden gate",
    description: "The side gate no longer closes.",
    status: "Matched" as const,
    creator: { participantId: "participant-alice", displayName: "Alice" },
  },
  acceptedOffer: {
    id: "offer-1",
    status: "Accepted" as const,
    creator: { participantId: "participant-bob", displayName: "Bob" },
  },
  commonsAccountingUnits: 12,
  requestedContributions: [
    {
      capabilityId: "capability-1",
      capabilityTextSnapshot: "Fresh Eggs",
      description: "Two dozen eggs",
    },
  ],
};

function profile(participant: "alice" | "bob") {
  return {
    id: participant === "alice" ? "participant-alice" : "participant-bob",
    displayName: participant === "alice" ? "Alice" : "Bob",
    bio: null,
    joinedAt: "2026-08-21T00:00:00Z",
    homeCommons: { id: "commons-1", name: "Brisbane Commons" },
    capabilities: [],
  };
}

describe("US 013 View My Agreements", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    window.location.hash = "";
  });

  it("lists accepted return terms and opens the authoritative Agreement read only", async () => {
    sessionStorage.setItem("commons-access-token", "access-token");
    window.location.hash = "/agreements";

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = new URL(input.toString(), "http://localhost");

      if (url.pathname === "/api/participants/me") {
        return jsonResponse(profile("alice"));
      }

      if (url.pathname === "/api/agreements") {
        return jsonResponse([agreement]);
      }

      if (url.pathname === "/api/agreements/agreement-1") {
        return jsonResponse(agreement);
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    renderApp();

    expect(await screen.findByRole("heading", { name: "My Agreements" }))
      .toBeInTheDocument();
    expect(await screen.findByText("With Bob")).toBeInTheDocument();
    expect(screen.getByText("12 Commons accounting units")).toBeInTheDocument();
    expect(screen.getByText("Fresh Eggs:")).toBeInTheDocument();
    expect(screen.getByText("Two dozen eggs")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "Repair a garden gate" }));

    expect(await screen.findByRole("heading", {
      name: "Agreement for Repair a garden gate",
    })).toBeInTheDocument();
    expect(screen.getByText("The side gate no longer closes.")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Fresh Eggs")).toBeInTheDocument();
    expect(screen.getByText("Two dozen eggs")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to My Agreements" }))
      .toHaveAttribute("href", "#/agreements");
    expect(screen.queryByRole("button", {
      name: /edit|complete|cancel|fulfil|renegotiate|message|dispute/i,
    })).not.toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls.every(([, options]) => !options?.method))
      .toBe(true);
  });

  it("identifies the Request creator as the other Participant for the Offer creator", async () => {
    sessionStorage.setItem("commons-access-token", "access-token");
    window.location.hash = "/agreements";

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = new URL(input.toString(), "http://localhost");

      if (url.pathname === "/api/participants/me") {
        return jsonResponse(profile("bob"));
      }

      if (url.pathname === "/api/agreements") {
        return jsonResponse([agreement]);
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    renderApp();

    expect(await screen.findByText("With Alice")).toBeInTheDocument();
    expect(screen.queryByText("With Bob")).not.toBeInTheDocument();
  });

  it("shows the empty collection without adding future Agreement actions", async () => {
    sessionStorage.setItem("commons-access-token", "access-token");
    window.location.hash = "/agreements";

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = new URL(input.toString(), "http://localhost");

      if (url.pathname === "/api/participants/me") {
        return jsonResponse(profile("alice"));
      }

      if (url.pathname === "/api/agreements") {
        return jsonResponse([]);
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    renderApp();

    expect(await screen.findByText("You are not part of any Agreements yet."))
      .toBeInTheDocument();
  });
});

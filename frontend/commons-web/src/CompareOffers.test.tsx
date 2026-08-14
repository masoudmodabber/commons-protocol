import { fireEvent, render, screen, within } from "@testing-library/react";
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

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

const request = {
  id: "request-1",
  title: "Repair a garden gate",
  description: "The back gate no longer closes.",
  status: "Cancelled" as const,
  creator: { participantId: "participant-alice", displayName: "Alice" },
  homeCommons: { id: "commons-1", name: "Brisbane Commons" },
};

const comparison = {
  request,
  offers: [
    {
      id: "offer-units",
      status: "Active" as const,
      commonsAccountingUnits: 30,
      creator: { participantId: "participant-bob", displayName: "Bob" },
      request,
      requestedContributions: [],
    },
    {
      id: "offer-capability",
      status: "Active" as const,
      commonsAccountingUnits: null,
      creator: { participantId: "participant-carol", displayName: "Carol" },
      request,
      requestedContributions: [
        {
          capabilityId: "removed-capability",
          capabilityTextSnapshot: "Fresh Eggs",
          description: "Two dozen eggs",
        },
      ],
    },
    {
      id: "offer-mixed",
      status: "Active" as const,
      commonsAccountingUnits: 12,
      creator: { participantId: "participant-david", displayName: "David" },
      request,
      requestedContributions: [
        {
          capabilityId: "transport-capability",
          capabilityTextSnapshot: "Transport",
          description: "Saturday morning airport trip",
        },
      ],
    },
  ],
};

describe("US 011 View and Compare Offers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    window.location.hash = "";
  });

  it("opens a factual comparison from My Requests", async () => {
    sessionStorage.setItem("commons-access-token", "access-token");
    window.location.hash = "/requests";

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = new URL(input.toString(), "http://localhost");

      if (url.pathname === "/api/participants/me") {
        return jsonResponse({
          id: "participant-alice",
          displayName: "Alice",
          bio: null,
          joinedAt: "2026-08-14T00:00:00Z",
          homeCommons: request.homeCommons,
          capabilities: [{ id: "removed-capability", text: "Renamed Eggs" }],
        });
      }

      if (url.pathname === "/api/requests") {
        return jsonResponse([request]);
      }

      if (url.pathname === "/api/requests/request-1/offers") {
        return jsonResponse(comparison);
      }

      if (url.pathname === "/api/requests/request-1") {
        return jsonResponse(request);
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    renderApp();

    fireEvent.click(await screen.findByRole("link", { name: "Repair a garden gate" }));
    expect(await screen.findByRole("heading", { name: "Repair a garden gate" }))
      .toBeInTheDocument();
    const viewOffersLink = screen.getByRole("link", { name: "View Offers" });
    expect(viewOffersLink).toHaveAttribute("href", "#/requests/request-1/offers");

    fireEvent.click(viewOffersLink);

    expect(await screen.findByRole("heading", {
      name: "Offers for Repair a garden gate",
    })).toBeInTheDocument();
    const bobOffer = screen.getByRole("heading", { name: "Bob" }).closest("li")!;
    const carolOffer = screen.getByRole("heading", { name: "Carol" }).closest("li")!;
    const davidOffer = screen.getByRole("heading", { name: "David" }).closest("li")!;

    expect(bobOffer).toHaveTextContent("Active");
    expect(bobOffer).toHaveTextContent("Commons accounting units requested30");
    expect(carolOffer).toHaveTextContent("Fresh Eggs");
    expect(carolOffer).toHaveTextContent("Two dozen eggs");
    expect(davidOffer).toHaveTextContent("Commons accounting units requested12");
    expect(davidOffer).toHaveTextContent("Transport");
    expect(davidOffer).toHaveTextContent("Saturday morning airport trip");
    expect(screen.queryByText("Renamed Eggs")).not.toBeInTheDocument();
    expect(screen.getByText(/not ranked or reduced to a single score/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Request" }))
      .toHaveAttribute("href", "#/requests/request-1");
    expect(screen.getAllByRole("button", { name: "Accept Offer" })).toHaveLength(3);
    expect(screen.queryByRole("button", {
      name: /reject|withdraw|negotiate/i,
    })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(within(carolOffer).queryByRole("link")).not.toBeInTheDocument();

    for (const [, options] of vi.mocked(fetch).mock.calls) {
      expect(new Headers(options?.headers).get("Authorization")).toBe("Bearer access-token");
    }
  });

  it("shows the Active Offer empty state", async () => {
    sessionStorage.setItem("commons-access-token", "access-token");
    window.location.hash = "/requests/request-1/offers";

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = new URL(input.toString(), "http://localhost");

      if (url.pathname === "/api/participants/me") {
        return jsonResponse({
          id: "participant-alice",
          displayName: "Alice",
          bio: null,
          joinedAt: "2026-08-14T00:00:00Z",
          homeCommons: request.homeCommons,
          capabilities: [],
        });
      }

      if (url.pathname === "/api/requests/request-1/offers") {
        return jsonResponse({ request, offers: [] });
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    renderApp();

    expect(await screen.findByText("This Request has no Active Offers."))
      .toBeInTheDocument();
  });
});

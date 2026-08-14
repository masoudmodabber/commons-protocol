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

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

const profile = {
  id: "participant-bob",
  displayName: "Bob",
  bio: null,
  joinedAt: "2026-08-14T00:00:00Z",
  homeCommons: { id: "commons-1", name: "Brisbane Commons" },
  capabilities: [],
};

function offer(
  id: string,
  requestTitle: string,
  commonsAccountingUnits: number | null,
  requestedContributions: Array<{
    capabilityId: string;
    capabilityTextSnapshot: string;
    description: string;
  }>,
) {
  return {
    id,
    status: "Active" as const,
    commonsAccountingUnits,
    creator: { participantId: "participant-bob", displayName: "Bob" },
    request: {
      id: `request-${id}`,
      title: requestTitle,
      description: `Description for ${requestTitle}`,
      creator: { participantId: "participant-alice", displayName: "Alice" },
      homeCommons: { id: "commons-1", name: "Brisbane Commons" },
    },
    requestedContributions,
  };
}

const unitsOnly = offer("offer-units", "Repair a fence", 30, []);
const capabilityOnly = offer("offer-capability", "Build a garden bed", null, [
  {
    capabilityId: "removed-capability",
    capabilityTextSnapshot: "Fresh Eggs",
    description: "Two dozen eggs",
  },
]);
const mixed = offer("offer-mixed", "Drive to the airport", 12, [
  {
    capabilityId: "transport-capability",
    capabilityTextSnapshot: "Transport",
    description: "Saturday morning trip",
  },
]);

describe("US 009 View my Offers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows submitted Offer terms and opens the existing creator detail", async () => {
    sessionStorage.setItem("commons-access-token", "access-token");
    window.location.hash = "/offers";

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = new URL(input.toString(), "http://localhost");

      if (url.pathname === "/api/participants/me") {
        return jsonResponse(profile);
      }

      if (url.pathname === "/api/offers") {
        return jsonResponse([unitsOnly, capabilityOnly, mixed]);
      }

      if (url.pathname === "/api/offers/offer-capability") {
        return jsonResponse(capabilityOnly);
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    renderApp();

    expect(await screen.findByRole("heading", { name: "My Offers" })).toBeInTheDocument();
    const myOffersLink = screen.getByRole("link", { name: "My Offers" });
    expect(myOffersLink).toHaveAttribute("href", "#/offers");
    expect(myOffersLink).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Available Requests" }))
      .not.toHaveAttribute("aria-current");

    const unitsItem = (await screen.findByRole("link", { name: "Repair a fence" }))
      .closest("li")!;
    expect(unitsItem).toHaveTextContent("Commons accounting units requested: 30");

    const capabilityLink = screen.getByRole("link", { name: "Build a garden bed" });
    const capabilityItem = capabilityLink.closest("li")!;
    expect(capabilityItem).toHaveTextContent("Fresh Eggs: Two dozen eggs");

    const mixedItem = screen.getByRole("link", { name: "Drive to the airport" }).closest("li")!;
    expect(mixedItem).toHaveTextContent("Commons accounting units requested: 12");
    expect(mixedItem).toHaveTextContent("Transport: Saturday morning trip");
    expect(screen.getAllByText("Request created by Alice")).toHaveLength(3);

    fireEvent.click(capabilityLink);

    expect(await screen.findByRole("heading", { name: "Offer for Build a garden bed" }))
      .toBeInTheDocument();
    expect(screen.getByText("Fresh Eggs")).toBeInTheDocument();
    expect(screen.getByText("Two dozen eggs")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to My Offers" }))
      .toHaveAttribute("href", "#/offers");
    expect(screen.getByRole("button", { name: "Withdraw Offer" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /accept|reject|negotiate/i }))
      .not.toBeInTheDocument();

    for (const [, options] of vi.mocked(fetch).mock.calls) {
      expect(new Headers(options?.headers).get("Authorization")).toBe("Bearer access-token");
    }
  });

  it("shows an empty state when the Participant has submitted no Offers", async () => {
    sessionStorage.setItem("commons-access-token", "access-token");
    window.location.hash = "/offers";

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = new URL(input.toString(), "http://localhost");

      if (url.pathname === "/api/participants/me") {
        return jsonResponse(profile);
      }

      if (url.pathname === "/api/offers") {
        return jsonResponse([]);
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    renderApp();

    expect(await screen.findByText("You have not submitted any Offers yet."))
      .toBeInTheDocument();
  });
});

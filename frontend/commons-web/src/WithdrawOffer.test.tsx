import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { OfferDetails } from "./api";

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

describe("US 010 Withdraw an Offer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("withdraws an Active Offer and keeps its terms visible in My Offers", async () => {
    sessionStorage.setItem("commons-access-token", "access-token");
    window.location.hash = "/offers";
    let currentOffer: OfferDetails = {
      id: "offer-1",
      status: "Active",
      commonsAccountingUnits: 12,
      creator: { participantId: "participant-bob", displayName: "Bob" },
      request: {
        id: "request-1",
        title: "Repair a garden gate",
        description: "The hinge needs replacing.",
        creator: { participantId: "participant-alice", displayName: "Alice" },
        homeCommons: { id: "commons-1", name: "Brisbane Commons" },
      },
      requestedContributions: [
        {
          capabilityId: "removed-capability",
          capabilityTextSnapshot: "Fresh Eggs",
          description: "Two dozen eggs",
        },
      ],
    };

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, options) => {
      const url = new URL(input.toString(), "http://localhost");

      if (url.pathname === "/api/participants/me") {
        return jsonResponse(profile);
      }

      if (url.pathname === "/api/offers/offer-1/withdraw" && options?.method === "POST") {
        currentOffer = { ...currentOffer, status: "Withdrawn" };
        return jsonResponse(currentOffer);
      }

      if (url.pathname === "/api/offers/offer-1") {
        return jsonResponse(currentOffer);
      }

      if (url.pathname === "/api/offers") {
        return jsonResponse([currentOffer]);
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    renderApp();

    const offerLink = await screen.findByRole("link", { name: "Repair a garden gate" });
    expect(offerLink.closest("li")).toHaveTextContent("Active");
    fireEvent.click(offerLink);

    expect(await screen.findByRole("heading", { name: "Offer for Repair a garden gate" }))
      .toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Withdraw Offer" }));

    expect(await screen.findByText("Withdrawn")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Withdraw Offer" })).not.toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Fresh Eggs")).toBeInTheDocument();
    expect(screen.getByText("Two dozen eggs")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "Back to My Offers" }));

    expect(await screen.findByRole("heading", { name: "My Offers" })).toBeInTheDocument();
    const withdrawnOfferLink = await screen.findByRole("link", {
      name: "Repair a garden gate",
    });
    const withdrawnOffer = withdrawnOfferLink.closest("li")!;
    expect(withdrawnOffer).toHaveTextContent("Withdrawn");
    expect(withdrawnOffer).toHaveTextContent("Commons accounting units requested: 12");
    expect(withdrawnOffer).toHaveTextContent("Fresh Eggs: Two dozen eggs");

    await waitFor(() => {
      const withdrawCall = vi.mocked(fetch).mock.calls.find(([input, options]) =>
        new URL(input.toString(), "http://localhost").pathname
          === "/api/offers/offer-1/withdraw"
        && options?.method === "POST");
      expect(withdrawCall).toBeDefined();
      expect(withdrawCall?.[1]?.body).toBeUndefined();
      expect(new Headers(withdrawCall?.[1]?.headers).get("Authorization"))
        .toBe("Bearer access-token");
    });
  });
});

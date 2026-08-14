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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const request = {
  id: "request-1",
  title: "Repair a garden gate",
  description: "The back gate no longer closes.",
  creator: { participantId: "participant-alice", displayName: "Alice" },
  homeCommons: { id: "commons-1", name: "Brisbane Commons" },
};

const offer = {
  id: "offer-1",
  status: "Active" as const,
  commonsAccountingUnits: 12,
  creator: { participantId: "participant-bob", displayName: "Bob" },
  request,
  requestedContributions: [
    {
      capabilityId: "capability-1",
      capabilityTextSnapshot: "Fresh Eggs",
      description: "Two dozen eggs",
    },
  ],
  agreementId: null,
};

const agreement = {
  id: "agreement-1",
  request: {
    id: request.id,
    title: request.title,
    description: request.description,
    status: "Matched" as const,
    creator: request.creator,
  },
  acceptedOffer: {
    id: offer.id,
    status: "Accepted" as const,
    creator: offer.creator,
  },
  commonsAccountingUnits: 12,
  requestedContributions: offer.requestedContributions,
};

describe("US 012 Accept an Offer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    window.location.hash = "";
  });

  it("accepts an Active Offer and navigates directly to the resulting Agreement", async () => {
    sessionStorage.setItem("commons-access-token", "access-token");
    window.location.hash = "/requests/request-1/offers";

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, options) => {
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
        return jsonResponse({ request, offers: [offer] });
      }

      if (url.pathname === "/api/offers/offer-1/accept" && options?.method === "POST") {
        return jsonResponse(agreement, 201);
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    renderApp();

    const bobOffer = (await screen.findByRole("heading", { name: "Bob" })).closest("li")!;
    fireEvent.click(within(bobOffer).getByRole("button", { name: "Accept Offer" }));

    expect(await screen.findByRole("heading", {
      name: "Agreement for Repair a garden gate",
    })).toBeInTheDocument();
    expect(screen.getByText("Offer accepted successfully")).toBeInTheDocument();
    expect(screen.getByText(/selected Offer is Accepted/i)).toBeInTheDocument();
    expect(screen.getByText(/other Active Offers.*Closed/i)).toBeInTheDocument();
    expect(screen.getByText("Matched")).toBeInTheDocument();
    expect(screen.getByText("Accepted")).toBeInTheDocument();
    expect(screen.getByText("Fresh Eggs")).toBeInTheDocument();
    expect(screen.getByText("Two dozen eggs")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View matched Request" }))
      .toHaveAttribute("href", "#/requests/request-1");
    expect(screen.queryByRole("link", { name: "View accepted Offer" }))
      .not.toBeInTheDocument();

    const acceptanceCall = vi.mocked(fetch).mock.calls.find(([input]) =>
      new URL(input.toString(), "http://localhost").pathname
        === "/api/offers/offer-1/accept");
    expect(acceptanceCall).toBeDefined();
    expect(acceptanceCall![1]?.body).toBeUndefined();
    expect(new Headers(acceptanceCall![1]?.headers).get("Authorization"))
      .toBe("Bearer access-token");
  });

  it("shows Agreement links from a matched Request and accepted Offer", async () => {
    sessionStorage.setItem("commons-access-token", "access-token");
    window.location.hash = "/requests/request-1";
    const matchedRequest = {
      ...request,
      status: "Matched" as const,
      agreementId: agreement.id,
    };
    const acceptedOffer = {
      ...offer,
      status: "Accepted" as const,
      agreementId: agreement.id,
    };

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

      if (url.pathname === "/api/requests/request-1") {
        return jsonResponse(matchedRequest);
      }

      if (url.pathname === "/api/offers/offer-1") {
        return jsonResponse(acceptedOffer);
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    renderApp();

    const requestAgreementLink = await screen.findByRole("link", { name: "View Agreement" });
    expect(requestAgreementLink).toHaveAttribute("href", "#/agreements/agreement-1");
    expect(screen.queryByRole("link", { name: "View Offers" })).not.toBeInTheDocument();

    window.location.hash = "/offers/offer-1";

    expect(await screen.findByRole("heading", {
      name: "Offer for Repair a garden gate",
    })).toBeInTheDocument();
    const offerAgreementLink = await screen.findByRole("link", { name: "View Agreement" });
    expect(offerAgreementLink).toHaveAttribute("href", "#/agreements/agreement-1");
    expect(screen.queryByRole("button", { name: "Withdraw Offer" })).not.toBeInTheDocument();
  });
});

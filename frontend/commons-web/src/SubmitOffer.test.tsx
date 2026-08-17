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

const profile = {
  id: "participant-2",
  displayName: "Bob",
  bio: null,
  joinedAt: "2026-08-14T00:00:00Z",
  homeCommons: { id: "commons-1", name: "Brisbane Commons" },
  capabilities: [],
};

const request = {
  id: "request-1",
  title: "Help repairing a fence",
  description: "One garden fence panel needs replacing.",
  status: "Open",
  creator: { participantId: "participant-1", displayName: "Alice" },
  homeCommons: { id: "commons-1", name: "Brisbane Commons" },
};

const options = {
  request,
  capabilities: [
    { id: "capability-1", text: "Eggs" },
    { id: "capability-2", text: "Transport" },
  ],
};

describe("US 008 Submit an Offer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("submits whole units and distinct Capability terms then shows the Offer", async () => {
    sessionStorage.setItem("commons-access-token", "access-token");
    window.location.hash = "/available-requests/request-1";
    let submittedOffer: Record<string, unknown> | null = null;

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = new URL(input.toString(), "http://localhost");

      if (url.pathname === "/api/requests/request-1/offers" && init?.method === "POST") {
        submittedOffer = {
          id: "offer-1",
          status: "Active",
          commonsAccountingUnits: 9007199254740991,
          creator: { participantId: "participant-2", displayName: "Bob" },
          request,
          requestedContributions: [
            {
              capabilityId: "capability-1",
              capabilityTextSnapshot: "Eggs",
              description: "A dozen eggs",
            },
            {
              capabilityId: "capability-2",
              capabilityTextSnapshot: "Transport",
              description: "Airport trip on Saturday",
            },
          ],
        };
        return jsonResponse(submittedOffer, 201);
      }

      if (url.pathname === "/api/requests/browse/request-1/offer-options") {
        return jsonResponse(options);
      }

      if (url.pathname === "/api/requests/browse/request-1") {
        return jsonResponse(request);
      }

      if (url.pathname === "/api/offers/offer-1") {
        return jsonResponse(submittedOffer);
      }

      if (url.pathname === "/api/participants/me") {
        return jsonResponse(profile);
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    renderApp();

    expect(await screen.findByRole("heading", { name: "Help repairing a fence" }))
      .toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Submit an Offer" }));

    expect(await screen.findByRole("heading", { name: "Submit an Offer" }))
      .toBeInTheDocument();
    expect(screen.queryByLabelText(/what i will provide/i)).not.toBeInTheDocument();
    const units = screen.getByLabelText("Commons accounting units (optional)");
    const submit = screen.getByRole("button", { name: "Submit Offer" });
    expect(submit).toBeDisabled();

    for (const invalidValue of ["1.5", "-2", "0", "not-a-number"]) {
      fireEvent.change(units, { target: { value: invalidValue } });
      expect(units).toHaveValue("");
      expect(submit).toBeDisabled();
    }

    for (const validValue of ["1", "30", "9007199254740991"]) {
      fireEvent.change(units, { target: { value: validValue } });
      expect(units).toHaveValue(validValue);
      expect(submit).toBeEnabled();
      fireEvent.change(units, { target: { value: "" } });
      expect(submit).toBeDisabled();
    }

    fireEvent.change(units, { target: { value: "9007199254740992" } });
    expect(units).toHaveValue("9007199254740992");
    expect(submit).toBeDisabled();
    fireEvent.change(units, { target: { value: "" } });

    expect(screen.getByText(
      "Enter a positive whole number no greater than 9,007,199,254,740,991, or leave this empty.",
    )).toBeInTheDocument();

    fireEvent.change(units, { target: { value: "9007199254740991" } });
    expect(units).toHaveValue("9007199254740991");
    expect(submit).toBeEnabled();

    fireEvent.click(screen.getByRole("checkbox", { name: "Eggs" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Transport" }));
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText("What are you requesting from Eggs?"), {
      target: { value: "  A dozen eggs  " },
    });
    fireEvent.change(screen.getByLabelText("What are you requesting from Transport?"), {
      target: { value: "  Airport trip on Saturday  " },
    });
    expect(submit).toBeEnabled();
    fireEvent.click(submit);

    expect(await screen.findByRole("heading", {
      name: "Offer for Help repairing a fence",
    })).toBeInTheDocument();
    expect(screen.getByText("9007199254740991")).toBeInTheDocument();
    expect(screen.getByText("A dozen eggs")).toBeInTheDocument();
    expect(screen.getByText("Airport trip on Saturday")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Withdraw Offer" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /accept|reject|negotiate/i }))
      .not.toBeInTheDocument();

    await waitFor(() => {
      const submitCall = vi.mocked(fetch).mock.calls.find(([input, init]) =>
        new URL(input.toString(), "http://localhost").pathname
          === "/api/requests/request-1/offers"
        && init?.method === "POST");
      expect(submitCall?.[1]?.body).toBe(JSON.stringify({
        commonsAccountingUnits: 9007199254740991,
        requestedContributions: [
          { capabilityId: "capability-1", description: "  A dozen eggs  " },
          { capabilityId: "capability-2", description: "  Airport trip on Saturday  " },
        ],
      }));
    });
  });
});

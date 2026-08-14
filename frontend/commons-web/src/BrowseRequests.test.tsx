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

const profile = {
  id: "participant-1",
  displayName: "Alice",
  bio: null,
  joinedAt: "2026-08-14T00:00:00Z",
  homeCommons: { id: "commons-1", name: "Brisbane Commons" },
  capabilities: [],
};

const requests = [
  {
    id: "request-1",
    title: "Help repairing a fence",
    description: "One garden fence panel needs replacing.",
    status: "Open",
    creator: { participantId: "participant-1", displayName: "Alice" },
    homeCommons: { id: "commons-1", name: "Brisbane Commons" },
  },
  {
    id: "request-2",
    title: "Borrow a wheelbarrow",
    description: "Needed for a community garden working bee.",
    status: "Open",
    creator: { participantId: "participant-2", displayName: "Bob" },
    homeCommons: { id: "commons-1", name: "Brisbane Commons" },
  },
];

describe("US 006 Browse Requests", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lets a Participant browse Open Requests and view another Participant's Request", async () => {
    sessionStorage.setItem("commons-access-token", "access-token");

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const path = input.toString();

      if (path.endsWith("/api/requests/browse/request-2")) {
        return jsonResponse(requests[1]);
      }

      if (path.endsWith("/api/requests/browse")) {
        return jsonResponse(requests);
      }

      if (path.endsWith("/api/requests")) {
        return jsonResponse([requests[0]]);
      }

      if (path.endsWith("/api/participants/me")) {
        return jsonResponse(profile);
      }

      throw new Error(`Unexpected request: ${path}`);
    });

    renderApp();

    fireEvent.click(await screen.findByRole("link", { name: "Requests" }));
    expect(await screen.findByRole("heading", { name: "My Requests" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Browse Requests" }));

    expect(await screen.findByRole("heading", { name: "Browse Requests" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Help repairing a fence" }))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Borrow a wheelbarrow" })).toBeInTheDocument();
    expect(screen.getByText("One garden fence panel needs replacing.")).toBeInTheDocument();
    expect(screen.getByText("Needed for a community garden working bee.")).toBeInTheDocument();
    expect(screen.getByText("Requested by Alice")).toBeInTheDocument();
    expect(screen.getByText("Requested by Bob")).toBeInTheDocument();
    expect(screen.getAllByText("Open")).toHaveLength(2);

    fireEvent.click(screen.getByRole("link", { name: "Borrow a wheelbarrow" }));

    expect(await screen.findByRole("heading", { name: "Borrow a wheelbarrow" }))
      .toBeInTheDocument();
    expect(screen.getByText("Needed for a community garden working bee.")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Brisbane Commons")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit Request" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel Request" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Browse Requests" })).toBeInTheDocument();

    const browseCalls = vi.mocked(fetch).mock.calls.filter(([input]) =>
      input.toString().includes("/api/requests/browse"));
    expect(browseCalls).toHaveLength(2);
    for (const [, options] of browseCalls) {
      expect(new Headers(options?.headers).get("Authorization")).toBe("Bearer access-token");
    }
  });

  it("shows the empty state when the Home Commons has no Open Requests", async () => {
    sessionStorage.setItem("commons-access-token", "access-token");
    window.location.hash = "/requests/browse";

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const path = input.toString();

      if (path.endsWith("/api/requests/browse")) {
        return jsonResponse([]);
      }

      if (path.endsWith("/api/participants/me")) {
        return jsonResponse(profile);
      }

      throw new Error(`Unexpected request: ${path}`);
    });

    renderApp();

    expect(await screen.findByRole("heading", { name: "Browse Requests" })).toBeInTheDocument();
    expect(await screen.findByText("There are no Open Requests in your Home Commons."))
      .toBeInTheDocument();
  });
});

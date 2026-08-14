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
  id: "participant-1",
  displayName: "Alice",
  bio: null,
  joinedAt: "2026-08-14T00:00:00Z",
  homeCommons: { id: "commons-1", name: "Brisbane Commons" },
  capabilities: [],
};

const gardenRequest = {
  id: "request-1",
  title: "Community garden tools",
  description: "Tools needed for the working bee.",
  status: "Open",
  creator: { participantId: "participant-2", displayName: "Bob" },
  homeCommons: { id: "commons-1", name: "Brisbane Commons" },
};

const bicycleRequest = {
  id: "request-2",
  title: "Borrow a pump",
  description: "Needed for a bicycle tyre.",
  status: "Open",
  creator: { participantId: "participant-3", displayName: "Carol" },
  homeCommons: { id: "commons-1", name: "Brisbane Commons" },
};

describe("US 007 Search Requests", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("searches Available Requests and opens a result in the read-only detail flow", async () => {
    sessionStorage.setItem("commons-access-token", "access-token");
    window.location.hash = "/available-requests";

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = new URL(input.toString(), "http://localhost");

      if (url.pathname === "/api/requests/browse/request-1") {
        return jsonResponse(gardenRequest);
      }

      if (url.pathname === "/api/requests/browse") {
        const search = url.searchParams.get("search");

        if (search === null || search.trim() === "") {
          return jsonResponse([gardenRequest, bicycleRequest]);
        }

        return jsonResponse(search.trim().toLowerCase() === "garden" ? [gardenRequest] : []);
      }

      if (url.pathname === "/api/participants/me") {
        return jsonResponse(profile);
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    renderApp();

    expect(await screen.findByRole("link", { name: "Community garden tools" }))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Borrow a pump" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search Available Requests"), {
      target: { value: "  GaRdEn  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByRole("link", { name: "Community garden tools" }))
      .toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Borrow a pump" })).not.toBeInTheDocument();

    const searchCall = vi.mocked(fetch).mock.calls.find(([input]) => {
      const url = new URL(input.toString(), "http://localhost");
      return url.pathname === "/api/requests/browse" && url.searchParams.has("search");
    });
    expect(new URL(searchCall![0].toString(), "http://localhost").searchParams.get("search"))
      .toBe("  GaRdEn  ");

    fireEvent.click(screen.getByRole("link", { name: "Community garden tools" }));

    expect(await screen.findByRole("heading", { name: "Community garden tools" }))
      .toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit Request" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel Request" })).not.toBeInTheDocument();
  });

  it("returns normal Available Requests for a whitespace-only search", async () => {
    sessionStorage.setItem("commons-access-token", "access-token");
    window.location.hash = "/available-requests";

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = new URL(input.toString(), "http://localhost");

      if (url.pathname === "/api/requests/browse") {
        return jsonResponse([gardenRequest, bicycleRequest]);
      }

      if (url.pathname === "/api/participants/me") {
        return jsonResponse(profile);
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    renderApp();
    await screen.findByRole("link", { name: "Community garden tools" });
    fireEvent.change(screen.getByLabelText("Search Available Requests"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByRole("link", { name: "Community garden tools" }))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Borrow a pump" })).toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls.some(([input]) => {
      const url = new URL(input.toString(), "http://localhost");
      return url.searchParams.get("search") === "   ";
    })).toBe(true);
  });
});

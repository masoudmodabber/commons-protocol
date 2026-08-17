import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import type { RequestDetails } from "../api/contracts";
import { ApiError } from "../api/http-client";
import { BrowseRequestDetailScreen } from "../screens/browse-request-detail-screen";
import { BrowseRequestsScreen } from "../screens/browse-requests-screen";

const mockRequest = jest.fn();
const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();

const fenceRequest: RequestDetails = {
  id: "request-2",
  title: "Help repairing a fence",
  description: "One garden fence panel needs replacing.",
  status: "Open",
  creator: { participantId: "participant-2", displayName: "Bob" },
  homeCommons: { id: "commons-1", name: "Brisbane Commons" },
  agreementId: null,
};

const transportRequest: RequestDetails = {
  id: "request-3",
  title: "Transport to an appointment",
  description: "I need a lift on Tuesday morning.",
  status: "Open",
  creator: { participantId: "participant-3", displayName: "Carol" },
  homeCommons: { id: "commons-1", name: "Brisbane Commons" },
  agreementId: null,
};

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
  }),
}));

jest.mock("../auth/session-context", () => ({
  useSession: () => ({ status: "authenticated", request: mockRequest }),
}));

function createHarness() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return { Wrapper, queryClient };
}

describe("US 006 mobile Request browsing", () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockRouterPush.mockReset();
    mockRouterReplace.mockReset();
  });

  it("shows available Requests in backend order and opens the selected Request", async () => {
    mockRequest.mockResolvedValueOnce([transportRequest, fenceRequest]);
    const view = await render(<BrowseRequestsScreen />, {
      wrapper: createHarness().Wrapper,
    });

    expect(
      await view.findByRole("header", { name: "Available Requests" }),
    ).toBeOnTheScreen();
    expect(view.getByText("Transport to an appointment")).toBeOnTheScreen();
    expect(view.getByText("I need a lift on Tuesday morning.")).toBeOnTheScreen();
    expect(view.getByText("Requested by Carol")).toBeOnTheScreen();
    expect(view.getByText("Help repairing a fence")).toBeOnTheScreen();
    expect(view.getByText("One garden fence panel needs replacing.")).toBeOnTheScreen();
    expect(view.getByText("Requested by Bob")).toBeOnTheScreen();
    expect(view.getAllByText("Open")).toHaveLength(2);
    expect(mockRequest).toHaveBeenCalledWith("/api/requests/browse");
    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(view.queryByLabelText(/search/i)).not.toBeOnTheScreen();

    const requestButtons = view.getAllByRole("button").slice(0, 2);
    expect(requestButtons[0]).toHaveAccessibleName("View Transport to an appointment");
    expect(requestButtons[1]).toHaveAccessibleName("View Help repairing a fence");

    await fireEvent.press(
      view.getByRole("button", { name: "View Help repairing a fence" }),
    );
    expect(mockRouterPush).toHaveBeenCalledWith(
      "/available-requests/request-2",
    );
  });

  it("shows the empty state without introducing search or later actions", async () => {
    mockRequest.mockResolvedValueOnce([]);
    const view = await render(<BrowseRequestsScreen />, {
      wrapper: createHarness().Wrapper,
    });

    expect(
      await view.findByText(
        "There are no Open Requests from other Participants in your Home Commons.",
      ),
    ).toBeOnTheScreen();
    expect(view.queryByRole("button", { name: /Offer|Search/i })).not.toBeOnTheScreen();
  });

  it("shows loading and retries a failed browse request", async () => {
    let rejectBrowse!: (error: Error) => void;
    mockRequest
      .mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            rejectBrowse = reject;
          }),
      )
      .mockResolvedValueOnce([fenceRequest]);
    const view = await render(<BrowseRequestsScreen />, {
      wrapper: createHarness().Wrapper,
    });

    expect(view.getByText("Loading Available Requests…")).toBeOnTheScreen();
    await act(async () => rejectBrowse(new Error("Requests could not be loaded.")));
    expect(await view.findByRole("alert")).toHaveTextContent(
      "Requests could not be loaded.",
    );

    await fireEvent.press(view.getByRole("button", { name: "Try again" }));
    expect(await view.findByText("Help repairing a fence")).toBeOnTheScreen();
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });

  it("loads a browsed Request as read only using the browse-detail endpoint", async () => {
    mockRequest.mockResolvedValueOnce(fenceRequest);
    const view = await render(
      <BrowseRequestDetailScreen requestId="request-2" />,
      { wrapper: createHarness().Wrapper },
    );

    expect(
      await view.findByRole("header", { name: "Help repairing a fence" }),
    ).toBeOnTheScreen();
    expect(view.getByText("One garden fence panel needs replacing.")).toBeOnTheScreen();
    expect(view.getByText("Open")).toBeOnTheScreen();
    expect(view.getByText("Bob")).toBeOnTheScreen();
    expect(view.getByText("Brisbane Commons")).toBeOnTheScreen();
    expect(mockRequest).toHaveBeenCalledWith(
      "/api/requests/browse/request-2",
    );
    expect(view.queryByRole("button", { name: "Edit Request" })).not.toBeOnTheScreen();
    expect(view.queryByRole("button", { name: "Cancel Request" })).not.toBeOnTheScreen();
    expect(view.queryByRole("button", { name: /Offer/i })).not.toBeOnTheScreen();

    await fireEvent.press(
      view.getByRole("button", { name: "Back to Available Requests" }),
    );
    expect(mockRouterReplace).toHaveBeenCalledWith("/available-requests");
  });

  it("presents a direct browse-detail 404 without disclosing why", async () => {
    mockRequest.mockRejectedValueOnce(
      new ApiError(404, "A hidden server-specific explanation."),
    );
    const view = await render(
      <BrowseRequestDetailScreen requestId="untrusted-request-id" />,
      { wrapper: createHarness().Wrapper },
    );

    expect(
      await view.findByRole("header", { name: "Request unavailable" }),
    ).toBeOnTheScreen();
    expect(view.getByRole("alert")).toHaveTextContent(
      "This Request is not available.",
    );
    expect(view.queryByText(/hidden server-specific/i)).not.toBeOnTheScreen();
    expect(mockRequest).toHaveBeenCalledWith(
      "/api/requests/browse/untrusted-request-id",
    );
  });

  it("retries a general browse-detail failure", async () => {
    mockRequest
      .mockRejectedValueOnce(new Error("The Request could not be loaded."))
      .mockResolvedValueOnce(fenceRequest);
    const view = await render(
      <BrowseRequestDetailScreen requestId="request-2" />,
      { wrapper: createHarness().Wrapper },
    );

    expect(await view.findByRole("alert")).toHaveTextContent(
      "The Request could not be loaded.",
    );
    await fireEvent.press(view.getByRole("button", { name: "Try again" }));
    await waitFor(() => {
      expect(
        view.getByRole("header", { name: "Help repairing a fence" }),
      ).toBeOnTheScreen();
    });
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });
});

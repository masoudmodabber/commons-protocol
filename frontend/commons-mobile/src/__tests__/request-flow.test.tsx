import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import type { ParticipantProfile, RequestDetails } from "../api/contracts";
import { ApiError } from "../api/http-client";
import { requestDetailQueryKey } from "../api/requests-api";
import { CreateRequestScreen } from "../screens/create-request-screen";
import { RequestDetailScreen } from "../screens/request-detail-screen";

const mockRequest = jest.fn();
const mockRouterReplace = jest.fn();

const profile: ParticipantProfile = {
  id: "participant-1",
  displayName: "Alice",
  bio: null,
  joinedAt: "2026-08-17T00:00:00Z",
  homeCommons: { id: "commons-1", name: "Brisbane Commons" },
};

const createdRequest: RequestDetails = {
  id: "request-1",
  title: "Help repairing a fence",
  description: "One garden fence panel needs replacing.",
  status: "Open",
  creator: { participantId: "participant-1", displayName: "Alice" },
  homeCommons: { id: "commons-1", name: "Brisbane Commons" },
  agreementId: null,
};

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
}));

jest.mock("../auth/session-context", () => ({
  useSession: () => ({ status: "authenticated", request: mockRequest }),
}));

jest.mock("../participants/use-participant-profile", () => ({
  useParticipantProfile: () => ({ data: profile }),
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

describe("US 003 Request creation", () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockRouterReplace.mockReset();
  });

  it("requires a title and description without asking for ownership values", async () => {
    const view = await render(<CreateRequestScreen />, {
      wrapper: createHarness().Wrapper,
    });
    const submit = view.getByRole("button", { name: "Create Request" });

    expect(submit).toBeDisabled();
    expect(view.getByText(/Describe what you need from Brisbane Commons/)).toBeOnTheScreen();
    expect(
      view.getByText(/You do not need to say what you will provide in return/),
    ).toBeOnTheScreen();
    expect(view.queryByLabelText(/Commons/i)).not.toBeOnTheScreen();
    expect(view.queryByLabelText(/Participant|user|creator|status/i)).not.toBeOnTheScreen();

    await fireEvent.changeText(view.getByLabelText("Request title"), "   ");
    await fireEvent.changeText(view.getByLabelText("Description"), "Description");
    expect(submit).toBeDisabled();
    await fireEvent.changeText(view.getByLabelText("Request title"), "Title");
    await fireEvent.changeText(view.getByLabelText("Description"), "   ");
    expect(submit).toBeDisabled();
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("submits raw text only, caches the response, and opens its read-only detail", async () => {
    mockRequest.mockResolvedValueOnce(createdRequest);
    const harness = createHarness();
    const view = await render(<CreateRequestScreen />, {
      wrapper: harness.Wrapper,
    });

    await fireEvent.changeText(
      view.getByLabelText("Request title"),
      "  Help repairing a fence  ",
    );
    await fireEvent.changeText(
      view.getByLabelText("Description"),
      "  One garden fence panel needs replacing.  ",
    );
    await fireEvent.press(view.getByRole("button", { name: "Create Request" }));

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith("/requests/request-1");
    });
    await waitFor(() => {
      expect(view.getByRole("button", { name: "Create Request" })).toBeEnabled();
    });
    expect(mockRequest).toHaveBeenCalledWith("/api/requests", {
      method: "POST",
      body: JSON.stringify({
        title: "  Help repairing a fence  ",
        description: "  One garden fence panel needs replacing.  ",
      }),
    });
    expect(harness.queryClient.getQueryData(requestDetailQueryKey("request-1")))
      .toEqual(createdRequest);

    const body = mockRequest.mock.calls[0][1].body as string;
    expect(body).not.toContain("participantId");
    expect(body).not.toContain("userId");
    expect(body).not.toContain("creatorId");
    expect(body).not.toContain("commonsId");
    expect(body).not.toContain("status");
  });

  it("disables the form while creation is pending", async () => {
    let resolveRequest!: (request: RequestDetails) => void;
    mockRequest.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const view = await render(<CreateRequestScreen />, {
      wrapper: createHarness().Wrapper,
    });

    await fireEvent.changeText(view.getByLabelText("Request title"), "A title");
    await fireEvent.changeText(view.getByLabelText("Description"), "A description");
    await fireEvent.press(view.getByRole("button", { name: "Create Request" }));

    await waitFor(() => {
      expect(view.getByRole("button", { name: "Creating…" })).toBeDisabled();
    });
    expect(view.getByLabelText("Request title")).toBeDisabled();
    expect(view.getByLabelText("Description")).toBeDisabled();
    await act(async () => resolveRequest(createdRequest));
    await waitFor(() => expect(mockRouterReplace).toHaveBeenCalled());
    await waitFor(() => {
      expect(view.getByRole("button", { name: "Create Request" })).toBeEnabled();
    });
  });

  it("shows backend validation and retains the entered values", async () => {
    mockRequest.mockRejectedValueOnce(
      new ApiError(400, "A Request requires a description."),
    );
    const view = await render(<CreateRequestScreen />, {
      wrapper: createHarness().Wrapper,
    });
    const title = view.getByLabelText("Request title");
    const description = view.getByLabelText("Description");

    await fireEvent.changeText(title, "A title");
    await fireEvent.changeText(description, "A description");
    await fireEvent.press(view.getByRole("button", { name: "Create Request" }));

    expect(await view.findByRole("alert")).toHaveTextContent(
      "A Request requires a description.",
    );
    expect(title).toHaveDisplayValue("A title");
    expect(description).toHaveDisplayValue("A description");
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it("loads and displays only the creator-owned read-only Request details", async () => {
    mockRequest.mockResolvedValueOnce(createdRequest);
    const view = await render(<RequestDetailScreen requestId="request-1" />, {
      wrapper: createHarness().Wrapper,
    });

    expect(
      await view.findByRole("header", { name: "Help repairing a fence" }),
    ).toBeOnTheScreen();
    expect(view.getByText("One garden fence panel needs replacing.")).toBeOnTheScreen();
    expect(view.getByText("Open")).toBeOnTheScreen();
    expect(view.getByText("Alice")).toBeOnTheScreen();
    expect(view.getByText("Brisbane Commons")).toBeOnTheScreen();
    expect(mockRequest).toHaveBeenCalledWith("/api/requests/request-1");
    expect(view.queryByRole("button", { name: /Edit|Cancel|Offer|Browse|Search/i }))
      .not.toBeOnTheScreen();
  });

  it("shows a loading state while fetching a creator-owned Request", async () => {
    let resolveRequest!: (request: RequestDetails) => void;
    mockRequest.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const view = await render(<RequestDetailScreen requestId="request-1" />, {
      wrapper: createHarness().Wrapper,
    });

    expect(
      view.getByRole("header", { name: "Loading your Request…" }),
    ).toBeOnTheScreen();
    await act(async () => resolveRequest(createdRequest));
    expect(
      await view.findByRole("header", { name: "Help repairing a fence" }),
    ).toBeOnTheScreen();
  });

  it("shows a detail load failure and retries the creator-owned endpoint", async () => {
    mockRequest
      .mockRejectedValueOnce(new Error("The Request could not be loaded."))
      .mockResolvedValueOnce(createdRequest);
    const view = await render(<RequestDetailScreen requestId="request-1" />, {
      wrapper: createHarness().Wrapper,
    });

    expect(await view.findByRole("alert")).toHaveTextContent(
      "The Request could not be loaded.",
    );
    await fireEvent.press(view.getByRole("button", { name: "Try again" }));
    expect(
      await view.findByRole("header", { name: "Help repairing a fence" }),
    ).toBeOnTheScreen();
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });
});

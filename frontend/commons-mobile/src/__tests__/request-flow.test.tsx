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

const updatedRequest: RequestDetails = {
  ...createdRequest,
  title: "Corrected fence repair",
  description: "Two garden fence panels need replacing.",
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

describe("mobile Request flows", () => {
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

  it("loads and displays the creator-owned Request details", async () => {
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
    expect(view.getByRole("button", { name: "Edit Request" })).toBeOnTheScreen();
    expect(view.getByRole("button", { name: "Cancel Request" })).toBeOnTheScreen();
    expect(view.queryByRole("button", { name: /Offer|Browse|Search/i }))
      .not.toBeOnTheScreen();
  });

  it("edits an Open Request with raw text and displays the authoritative response", async () => {
    mockRequest
      .mockResolvedValueOnce(createdRequest)
      .mockResolvedValueOnce(updatedRequest);
    const harness = createHarness();
    const view = await render(<RequestDetailScreen requestId="request-1" />, {
      wrapper: harness.Wrapper,
    });

    await view.findByRole("header", { name: "Help repairing a fence" });
    await fireEvent.press(view.getByRole("button", { name: "Edit Request" }));
    const title = view.getByLabelText("Request title");
    const description = view.getByLabelText("Description");
    expect(title).toHaveDisplayValue("Help repairing a fence");
    expect(description).toHaveDisplayValue(
      "One garden fence panel needs replacing.",
    );

    await fireEvent.changeText(title, "  Client-side title  ");
    await fireEvent.changeText(description, "  Client-side description  ");
    await fireEvent.press(view.getByRole("button", { name: "Save changes" }));

    expect(
      await view.findByRole("header", { name: "Corrected fence repair" }),
    ).toBeOnTheScreen();
    expect(view.getByText("Two garden fence panels need replacing.")).toBeOnTheScreen();
    expect(view.getByText("Open")).toBeOnTheScreen();
    expect(view.getByText("Alice")).toBeOnTheScreen();
    expect(view.getByText("Brisbane Commons")).toBeOnTheScreen();
    expect(mockRequest).toHaveBeenNthCalledWith(
      2,
      "/api/requests/request-1",
      {
        method: "PUT",
        body: JSON.stringify({
          title: "  Client-side title  ",
          description: "  Client-side description  ",
        }),
      },
    );
    expect(harness.queryClient.getQueryData(requestDetailQueryKey("request-1")))
      .toEqual(updatedRequest);

    const body = mockRequest.mock.calls[1][1].body as string;
    expect(Object.keys(JSON.parse(body))).toEqual(["title", "description"]);
  });

  it("rejects empty edits locally and discards changes without cancelling the Request", async () => {
    mockRequest.mockResolvedValueOnce(createdRequest);
    const view = await render(<RequestDetailScreen requestId="request-1" />, {
      wrapper: createHarness().Wrapper,
    });

    await view.findByRole("header", { name: "Help repairing a fence" });
    await fireEvent.press(view.getByRole("button", { name: "Edit Request" }));
    await fireEvent.changeText(view.getByLabelText("Request title"), "   ");
    expect(view.getByRole("button", { name: "Save changes" })).toBeDisabled();
    expect(view.getByRole("button", { name: "Discard changes" })).toBeOnTheScreen();
    expect(view.queryByRole("button", { name: "Cancel Request" })).not.toBeOnTheScreen();

    await fireEvent.press(view.getByRole("button", { name: "Discard changes" }));
    expect(
      view.getByRole("header", { name: "Help repairing a fence" }),
    ).toBeOnTheScreen();
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  it("disables editing controls while saving", async () => {
    let resolveEdit!: (request: RequestDetails) => void;
    mockRequest
      .mockResolvedValueOnce(createdRequest)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveEdit = resolve;
          }),
      );
    const view = await render(<RequestDetailScreen requestId="request-1" />, {
      wrapper: createHarness().Wrapper,
    });

    await view.findByRole("header", { name: "Help repairing a fence" });
    await fireEvent.press(view.getByRole("button", { name: "Edit Request" }));
    await fireEvent.press(view.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(view.getByRole("button", { name: "Saving…" })).toBeDisabled();
    });
    expect(view.getByLabelText("Request title")).toBeDisabled();
    expect(view.getByLabelText("Description")).toBeDisabled();
    expect(view.getByRole("button", { name: "Discard changes" })).toBeDisabled();
    await act(async () => resolveEdit(updatedRequest));
    expect(
      await view.findByRole("header", { name: "Corrected fence repair" }),
    ).toBeOnTheScreen();
  });

  it("retains edits when backend validation rejects them", async () => {
    mockRequest
      .mockResolvedValueOnce(createdRequest)
      .mockRejectedValueOnce(new ApiError(400, "A Request requires a title."));
    const view = await render(<RequestDetailScreen requestId="request-1" />, {
      wrapper: createHarness().Wrapper,
    });

    await view.findByRole("header", { name: "Help repairing a fence" });
    await fireEvent.press(view.getByRole("button", { name: "Edit Request" }));
    await fireEvent.changeText(view.getByLabelText("Request title"), "Changed title");
    await fireEvent.press(view.getByRole("button", { name: "Save changes" }));

    expect(await view.findByRole("alert")).toHaveTextContent(
      "A Request requires a title.",
    );
    expect(view.getByLabelText("Request title")).toHaveDisplayValue("Changed title");
    expect(view.getByRole("header", { name: "Edit Request" })).toBeOnTheScreen();
  });

  it("retains edits after a general failure and allows retry", async () => {
    mockRequest
      .mockResolvedValueOnce(createdRequest)
      .mockRejectedValueOnce(new Error("The Request could not be saved."))
      .mockResolvedValueOnce(updatedRequest);
    const view = await render(<RequestDetailScreen requestId="request-1" />, {
      wrapper: createHarness().Wrapper,
    });

    await view.findByRole("header", { name: "Help repairing a fence" });
    await fireEvent.press(view.getByRole("button", { name: "Edit Request" }));
    await fireEvent.changeText(view.getByLabelText("Request title"), "Changed title");
    await fireEvent.press(view.getByRole("button", { name: "Save changes" }));

    expect(await view.findByRole("alert")).toHaveTextContent(
      "The Request could not be saved.",
    );
    expect(view.getByLabelText("Request title")).toHaveDisplayValue("Changed title");
    await fireEvent.press(view.getByRole("button", { name: "Save changes" }));
    expect(
      await view.findByRole("header", { name: "Corrected fence repair" }),
    ).toBeOnTheScreen();
    expect(mockRequest).toHaveBeenCalledTimes(3);
  });

  it("leaves edit mode and refreshes authoritative details after a lifecycle conflict", async () => {
    const cancelledRequest: RequestDetails = {
      ...createdRequest,
      status: "Cancelled",
    };
    mockRequest
      .mockResolvedValueOnce(createdRequest)
      .mockRejectedValueOnce(
        new ApiError(409, "Only an Open Request can be edited."),
      )
      .mockResolvedValueOnce(cancelledRequest);
    const harness = createHarness();
    const view = await render(<RequestDetailScreen requestId="request-1" />, {
      wrapper: harness.Wrapper,
    });

    await view.findByRole("header", { name: "Help repairing a fence" });
    await fireEvent.press(view.getByRole("button", { name: "Edit Request" }));
    await fireEvent.changeText(view.getByLabelText("Request title"), "Changed title");
    await fireEvent.press(view.getByRole("button", { name: "Save changes" }));

    expect(await view.findByRole("alert")).toHaveTextContent(
      "Only an Open Request can be edited.",
    );
    expect(await view.findByText("Cancelled")).toBeOnTheScreen();
    expect(view.queryByRole("header", { name: "Edit Request" })).not.toBeOnTheScreen();
    expect(view.queryByRole("button", { name: "Edit Request" })).not.toBeOnTheScreen();
    expect(mockRequest).toHaveBeenNthCalledWith(3, "/api/requests/request-1");
    expect(harness.queryClient.getQueryData(requestDetailQueryKey("request-1")))
      .toEqual(cancelledRequest);
  });

  it("keeps cached data unchanged after an ownership-safe edit rejection", async () => {
    mockRequest
      .mockResolvedValueOnce(createdRequest)
      .mockRejectedValueOnce(
        new ApiError(
          404,
          "The Request does not exist or was not created by this Participant.",
        ),
      );
    const harness = createHarness();
    const view = await render(<RequestDetailScreen requestId="request-1" />, {
      wrapper: harness.Wrapper,
    });

    await view.findByRole("header", { name: "Help repairing a fence" });
    await fireEvent.press(view.getByRole("button", { name: "Edit Request" }));
    await fireEvent.changeText(view.getByLabelText("Request title"), "Changed title");
    await fireEvent.press(view.getByRole("button", { name: "Save changes" }));

    expect(await view.findByRole("alert")).toHaveTextContent(
      "The Request does not exist or was not created by this Participant.",
    );
    expect(harness.queryClient.getQueryData(requestDetailQueryKey("request-1")))
      .toEqual(createdRequest);
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });

  it.each(["Cancelled", "Matched"] as const)(
    "does not offer editing when the Request is %s",
    async (status) => {
      mockRequest.mockResolvedValueOnce({ ...createdRequest, status });
      const view = await render(<RequestDetailScreen requestId="request-1" />, {
        wrapper: createHarness().Wrapper,
      });

      expect(await view.findByText(status)).toBeOnTheScreen();
      expect(view.queryByRole("button", { name: "Edit Request" }))
        .not.toBeOnTheScreen();
      expect(view.queryByRole("button", { name: "Cancel Request" }))
        .not.toBeOnTheScreen();
    },
  );

  it("cancels an Open Request directly and displays the authoritative response", async () => {
    const cancelledRequest: RequestDetails = {
      ...createdRequest,
      status: "Cancelled",
    };
    mockRequest
      .mockResolvedValueOnce(createdRequest)
      .mockResolvedValueOnce(cancelledRequest);
    const harness = createHarness();
    const view = await render(<RequestDetailScreen requestId="request-1" />, {
      wrapper: harness.Wrapper,
    });

    await view.findByRole("header", { name: "Help repairing a fence" });
    await fireEvent.press(view.getByRole("button", { name: "Cancel Request" }));

    expect(await view.findByText("Cancelled")).toBeOnTheScreen();
    expect(view.getByRole("header", { name: "Help repairing a fence" })).toBeOnTheScreen();
    expect(view.getByText("One garden fence panel needs replacing.")).toBeOnTheScreen();
    expect(view.getByText("Alice")).toBeOnTheScreen();
    expect(view.getByText("Brisbane Commons")).toBeOnTheScreen();
    expect(view.queryByRole("button", { name: "Edit Request" })).not.toBeOnTheScreen();
    expect(view.queryByRole("button", { name: "Cancel Request" })).not.toBeOnTheScreen();
    expect(mockRequest).toHaveBeenNthCalledWith(
      2,
      "/api/requests/request-1/cancel",
      { method: "POST" },
    );
    expect(mockRequest.mock.calls[1][1].body).toBeUndefined();
    expect(harness.queryClient.getQueryData(requestDetailQueryKey("request-1")))
      .toEqual(cancelledRequest);
  });

  it("disables both lifecycle controls while cancellation is pending", async () => {
    let resolveCancellation!: (request: RequestDetails) => void;
    const cancelledRequest: RequestDetails = {
      ...createdRequest,
      status: "Cancelled",
    };
    mockRequest
      .mockResolvedValueOnce(createdRequest)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveCancellation = resolve;
          }),
      );
    const view = await render(<RequestDetailScreen requestId="request-1" />, {
      wrapper: createHarness().Wrapper,
    });

    await view.findByRole("header", { name: "Help repairing a fence" });
    await fireEvent.press(view.getByRole("button", { name: "Cancel Request" }));

    await waitFor(() => {
      expect(view.getByRole("button", { name: "Cancelling…" })).toBeDisabled();
    });
    expect(view.getByRole("button", { name: "Edit Request" })).toBeDisabled();
    await act(async () => resolveCancellation(cancelledRequest));
    expect(await view.findByText("Cancelled")).toBeOnTheScreen();
  });

  it("refreshes authoritative details after a cancellation conflict", async () => {
    const matchedRequest: RequestDetails = {
      ...createdRequest,
      status: "Matched",
      agreementId: "agreement-1",
    };
    mockRequest
      .mockResolvedValueOnce(createdRequest)
      .mockRejectedValueOnce(
        new ApiError(409, "Only an Open Request can be cancelled."),
      )
      .mockResolvedValueOnce(matchedRequest);
    const harness = createHarness();
    const view = await render(<RequestDetailScreen requestId="request-1" />, {
      wrapper: harness.Wrapper,
    });

    await view.findByRole("header", { name: "Help repairing a fence" });
    await fireEvent.press(view.getByRole("button", { name: "Cancel Request" }));

    expect(await view.findByRole("alert")).toHaveTextContent(
      "Only an Open Request can be cancelled.",
    );
    expect(await view.findByText("Matched")).toBeOnTheScreen();
    expect(view.queryByRole("button", { name: "Edit Request" })).not.toBeOnTheScreen();
    expect(view.queryByRole("button", { name: "Cancel Request" })).not.toBeOnTheScreen();
    expect(mockRequest).toHaveBeenNthCalledWith(3, "/api/requests/request-1");
    expect(harness.queryClient.getQueryData(requestDetailQueryKey("request-1")))
      .toEqual(matchedRequest);
  });

  it("keeps cached data unchanged after an ownership-safe cancellation rejection", async () => {
    mockRequest
      .mockResolvedValueOnce(createdRequest)
      .mockRejectedValueOnce(
        new ApiError(
          404,
          "The Request does not exist or was not created by this Participant.",
        ),
      );
    const harness = createHarness();
    const view = await render(<RequestDetailScreen requestId="request-1" />, {
      wrapper: harness.Wrapper,
    });

    await view.findByRole("header", { name: "Help repairing a fence" });
    await fireEvent.press(view.getByRole("button", { name: "Cancel Request" }));

    expect(await view.findByRole("alert")).toHaveTextContent(
      "The Request does not exist or was not created by this Participant.",
    );
    expect(view.getByText("Open")).toBeOnTheScreen();
    expect(harness.queryClient.getQueryData(requestDetailQueryKey("request-1")))
      .toEqual(createdRequest);
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });

  it("keeps the Request visible after a general cancellation failure and allows retry", async () => {
    const cancelledRequest: RequestDetails = {
      ...createdRequest,
      status: "Cancelled",
    };
    mockRequest
      .mockResolvedValueOnce(createdRequest)
      .mockRejectedValueOnce(new Error("The Request could not be cancelled."))
      .mockResolvedValueOnce(cancelledRequest);
    const view = await render(<RequestDetailScreen requestId="request-1" />, {
      wrapper: createHarness().Wrapper,
    });

    await view.findByRole("header", { name: "Help repairing a fence" });
    await fireEvent.press(view.getByRole("button", { name: "Cancel Request" }));

    expect(await view.findByRole("alert")).toHaveTextContent(
      "The Request could not be cancelled.",
    );
    expect(view.getByText("Open")).toBeOnTheScreen();
    await fireEvent.press(view.getByRole("button", { name: "Cancel Request" }));
    expect(await view.findByText("Cancelled")).toBeOnTheScreen();
    expect(mockRequest).toHaveBeenCalledTimes(3);
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

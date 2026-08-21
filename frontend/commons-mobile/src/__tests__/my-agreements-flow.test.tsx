import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import type { AgreementDetails } from "../api/contracts";
import { participantAgreementsQueryKey } from "../api/agreements-api";
import { ApiError } from "../api/http-client";
import { MyAgreementsScreen } from "../screens/my-agreements-screen";

const mockRequest = jest.fn();
const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();
let mockParticipantId = "participant-1";

const agreement: AgreementDetails = {
  id: "agreement-1",
  request: {
    id: "request-1",
    title: "Repair a garden gate",
    description: "The side gate no longer closes.",
    status: "Matched",
    creator: { participantId: "participant-1", displayName: "Alice" },
  },
  acceptedOffer: {
    id: "offer-1",
    status: "Accepted",
    creator: { participantId: "participant-2", displayName: "Bob" },
  },
  commonsAccountingUnits: 30,
  requestedContributions: [
    {
      capabilityId: "capability-1",
      capabilityTextSnapshot: "Fresh Eggs",
      description: "Two dozen eggs",
    },
  ],
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

jest.mock("../participants/use-participant-profile", () => ({
  useParticipantProfile: () => ({ data: { id: mockParticipantId } }),
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

describe("US 013 mobile My Agreements", () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockRouterPush.mockReset();
    mockRouterReplace.mockReset();
    mockParticipantId = "participant-1";
  });

  it("shows the other Participant and accepted return terms and opens the Agreement", async () => {
    mockRequest.mockResolvedValueOnce([agreement]);
    const harness = createHarness();
    const view = await render(<MyAgreementsScreen />, {
      wrapper: harness.Wrapper,
    });

    expect(
      await view.findByRole("header", { name: "My Agreements" }),
    ).toBeOnTheScreen();
    expect(mockRequest).toHaveBeenCalledWith("/api/agreements");
    expect(await view.findByText("With Bob")).toBeOnTheScreen();
    expect(view.getByText("30 Commons accounting units")).toBeOnTheScreen();
    expect(view.getByText(/Fresh Eggs:/)).toBeOnTheScreen();
    expect(view.getByText(/Two dozen eggs/)).toBeOnTheScreen();
    expect(
      harness.queryClient.getQueryData(participantAgreementsQueryKey),
    ).toEqual([agreement]);
    expect(
      view.queryByRole("button", {
        name: /edit|complete|cancel|fulfil|renegotiate|message|dispute/i,
      }),
    ).not.toBeOnTheScreen();

    await fireEvent.press(
      view.getByRole("button", {
        name: "View Agreement for Repair a garden gate",
      }),
    );
    expect(mockRouterPush).toHaveBeenCalledWith("/agreements/agreement-1");
  });

  it("shows the Request creator as the other Participant to the Offer creator", async () => {
    mockParticipantId = "participant-2";
    mockRequest.mockResolvedValueOnce([agreement]);
    const view = await render(<MyAgreementsScreen />, {
      wrapper: createHarness().Wrapper,
    });

    expect(await view.findByText("With Alice")).toBeOnTheScreen();
    expect(view.queryByText("With Bob")).not.toBeOnTheScreen();
  });

  it("shows the empty Agreement collection", async () => {
    mockRequest.mockResolvedValueOnce([]);
    const view = await render(<MyAgreementsScreen />, {
      wrapper: createHarness().Wrapper,
    });

    expect(
      await view.findByText("You are not part of any Agreements yet."),
    ).toBeOnTheScreen();
    await fireEvent.press(view.getByRole("button", { name: "Back to profile" }));
    expect(mockRouterReplace).toHaveBeenCalledWith("/profile");
  });

  it("uses a safe 404 message and retries a failed collection", async () => {
    let rejectLoad!: (reason: Error) => void;
    mockRequest
      .mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            rejectLoad = reject;
          }),
      )
      .mockResolvedValueOnce([agreement]);
    const view = await render(<MyAgreementsScreen />, {
      wrapper: createHarness().Wrapper,
    });

    expect(view.getByText("Loading your Agreements…")).toBeOnTheScreen();
    await act(async () =>
      rejectLoad(new ApiError(404, "Another Participant owns these Agreements.")),
    );
    expect(await view.findByRole("alert")).toHaveTextContent(
      "Your Agreements are not available.",
    );
    expect(
      view.queryByText("Another Participant owns these Agreements."),
    ).not.toBeOnTheScreen();
    await fireEvent.press(view.getByRole("button", { name: "Try again" }));
    expect(await view.findByText("With Bob")).toBeOnTheScreen();
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });
});

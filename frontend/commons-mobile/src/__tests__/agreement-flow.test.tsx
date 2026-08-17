import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import type { AgreementDetails } from "../api/contracts";
import { agreementDetailQueryKey } from "../api/agreements-api";
import { ApiError } from "../api/http-client";
import { AgreementDetailScreen } from "../screens/agreement-detail-screen";

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
      capabilityTextSnapshot: "Carpentry",
      description: "Two hours repairing the gate",
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

describe("US 012 mobile Agreement detail", () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockRouterPush.mockReset();
    mockRouterReplace.mockReset();
    mockParticipantId = "participant-1";
  });

  it("loads and displays the complete authoritative Agreement read only", async () => {
    mockRequest.mockResolvedValueOnce(agreement);
    const harness = createHarness();
    const view = await render(
      <AgreementDetailScreen agreementId="agreement-1" />,
      { wrapper: harness.Wrapper },
    );

    expect(
      await view.findByRole("header", {
        name: "Agreement for Repair a garden gate",
      }),
    ).toBeOnTheScreen();
    expect(mockRequest).toHaveBeenCalledWith("/api/agreements/agreement-1");
    expect(view.getByText("The side gate no longer closes.")).toBeOnTheScreen();
    expect(view.getByText("Matched")).toBeOnTheScreen();
    expect(view.getByText("Accepted")).toBeOnTheScreen();
    expect(view.getByText("Alice")).toBeOnTheScreen();
    expect(view.getByText("Bob")).toBeOnTheScreen();
    expect(view.getByText("30")).toBeOnTheScreen();
    expect(view.getByText("Carpentry")).toBeOnTheScreen();
    expect(view.getByText("Two hours repairing the gate")).toBeOnTheScreen();
    expect(
      harness.queryClient.getQueryData(agreementDetailQueryKey("agreement-1")),
    ).toEqual(agreement);
    expect(view.queryByRole("textbox")).not.toBeOnTheScreen();
    expect(
      view.queryByRole("button", {
        name: /complete|deliver|cancel|terminate|dispute|negotiate/i,
      }),
    ).not.toBeOnTheScreen();

    await fireEvent.press(
      view.getByRole("button", { name: "View matched Request" }),
    );
    expect(mockRouterPush).toHaveBeenCalledWith("/requests/request-1");
    expect(
      view.queryByRole("button", { name: "View accepted Offer" }),
    ).not.toBeOnTheScreen();
  });

  it("lets the Offer creator return to the accepted Offer", async () => {
    mockParticipantId = "participant-2";
    mockRequest.mockResolvedValueOnce(agreement);
    const view = await render(
      <AgreementDetailScreen agreementId="agreement-1" />,
      { wrapper: createHarness().Wrapper },
    );

    await fireEvent.press(
      await view.findByRole("button", { name: "View accepted Offer" }),
    );

    expect(mockRouterPush).toHaveBeenCalledWith("/offers/offer-1");
    expect(
      view.queryByRole("button", { name: "View matched Request" }),
    ).not.toBeOnTheScreen();
  });

  it("uses a generic 404 for an Agreement outside the Participant boundary", async () => {
    mockRequest.mockRejectedValueOnce(
      new ApiError(404, "This Agreement belongs to other Participants."),
    );
    const view = await render(
      <AgreementDetailScreen agreementId="another-agreement" />,
      { wrapper: createHarness().Wrapper },
    );

    expect(await view.findByRole("alert")).toHaveTextContent(
      "This Agreement is not available.",
    );
    expect(
      view.queryByText("This Agreement belongs to other Participants."),
    ).not.toBeOnTheScreen();
    expect(mockRequest).toHaveBeenCalledWith(
      "/api/agreements/another-agreement",
    );
  });

  it("shows loading, reports a general failure, and retries", async () => {
    let rejectLoad!: (reason: Error) => void;
    mockRequest
      .mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            rejectLoad = reject;
          }),
      )
      .mockResolvedValueOnce(agreement);
    const view = await render(
      <AgreementDetailScreen agreementId="agreement-1" />,
      { wrapper: createHarness().Wrapper },
    );

    expect(view.getByText("Loading Agreement…")).toBeOnTheScreen();
    await act(async () =>
      rejectLoad(new Error("Agreement could not be loaded.")),
    );
    expect(await view.findByRole("alert")).toHaveTextContent(
      "Agreement could not be loaded.",
    );
    await fireEvent.press(view.getByRole("button", { name: "Try again" }));
    expect(
      await view.findByRole("header", {
        name: "Agreement for Repair a garden gate",
      }),
    ).toBeOnTheScreen();
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });
});

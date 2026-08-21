import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import type {
  AgreementDetails,
  OfferDetails,
  RequestDetails,
  RequestOfferComparison,
} from "../api/contracts";
import {
  agreementDetailQueryKey,
  participantAgreementsQueryKey,
} from "../api/agreements-api";
import { ApiError } from "../api/http-client";
import { requestOffersQueryKey } from "../api/offers-api";
import {
  participantRequestsQueryKey,
  requestDetailQueryKey,
} from "../api/requests-api";
import { MyRequestsScreen } from "../screens/my-requests-screen";
import { RequestOffersScreen } from "../screens/request-offers-screen";

const mockRequest = jest.fn();
const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();

const ownedRequest: RequestDetails = {
  id: "request-1",
  title: "Repair a garden gate",
  description: "The side gate no longer closes.",
  status: "Open",
  creator: { participantId: "participant-1", displayName: "Alice" },
  homeCommons: { id: "commons-1", name: "Brisbane Commons" },
  agreementId: null,
};

const comparisonRequest = {
  id: ownedRequest.id,
  title: ownedRequest.title,
  description: ownedRequest.description,
  creator: ownedRequest.creator,
  homeCommons: ownedRequest.homeCommons,
};

function receivedOffer(
  id: string,
  creatorName: string,
  overrides: Partial<OfferDetails>,
): OfferDetails {
  return {
    id,
    status: "Active",
    commonsAccountingUnits: null,
    creator: { participantId: `participant-${id}`, displayName: creatorName },
    request: comparisonRequest,
    requestedContributions: [],
    agreementId: null,
    ...overrides,
  };
}

const unitsOffer = receivedOffer("offer-1", "Bob", {
  commonsAccountingUnits: 30,
});
const capabilityOffer = receivedOffer("offer-2", "Carol", {
  requestedContributions: [
    {
      capabilityId: "capability-1",
      capabilityTextSnapshot: "Fresh Eggs",
      description: "Two dozen eggs",
    },
  ],
});
const combinedOffer = receivedOffer("offer-3", "David", {
  commonsAccountingUnits: 12,
  requestedContributions: [
    {
      capabilityId: "capability-2",
      capabilityTextSnapshot: "Transport",
      description: "Saturday morning airport trip",
    },
  ],
});

const comparison: RequestOfferComparison = {
  request: comparisonRequest,
  offers: [unitsOffer, capabilityOffer, combinedOffer],
};

const agreement: AgreementDetails = {
  id: "agreement-1",
  request: {
    id: ownedRequest.id,
    title: ownedRequest.title,
    description: ownedRequest.description,
    status: "Matched",
    creator: ownedRequest.creator,
  },
  acceptedOffer: {
    id: unitsOffer.id,
    status: "Accepted",
    creator: unitsOffer.creator,
  },
  commonsAccountingUnits: 30,
  requestedContributions: [],
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
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return { Wrapper, queryClient };
}

describe("US 011 mobile My Requests navigation bridge", () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockRouterPush.mockReset();
    mockRouterReplace.mockReset();
  });

  it("preserves backend order and opens the selected owned Request", async () => {
    const cancelled = {
      ...ownedRequest,
      id: "request-2",
      title: "Cancelled delivery request",
      description: "This delivery is no longer needed.",
      status: "Cancelled" as const,
    };
    mockRequest.mockResolvedValueOnce([cancelled, ownedRequest]);
    const harness = createHarness();
    const view = await render(<MyRequestsScreen />, {
      wrapper: harness.Wrapper,
    });

    expect(await view.findByText("The side gate no longer closes.")).toBeOnTheScreen();
    expect(mockRequest).toHaveBeenCalledWith("/api/requests");
    expect(mockRequest).toHaveBeenCalledTimes(1);
    const requestButtons = view.getAllByRole("button", { name: /^View / });
    expect(requestButtons.map((button) => button.props.accessibilityLabel)).toEqual([
      "View Cancelled delivery request",
      "View Repair a garden gate",
    ]);
    expect(requestButtons[0]).toHaveTextContent(/Cancelled/);
    expect(requestButtons[1]).toHaveTextContent(/Open/);
    expect(harness.queryClient.getQueryData(participantRequestsQueryKey)).toEqual([
      cancelled,
      ownedRequest,
    ]);

    await fireEvent.press(requestButtons[1]);
    expect(mockRouterPush).toHaveBeenCalledWith("/requests/request-1");
  });

  it("shows the empty state", async () => {
    mockRequest.mockResolvedValueOnce([]);
    const view = await render(<MyRequestsScreen />, {
      wrapper: createHarness().Wrapper,
    });

    expect(
      await view.findByText("You have not created any Requests yet."),
    ).toBeOnTheScreen();
  });

  it("shows loading, a general failure, and retries", async () => {
    mockRequest
      .mockRejectedValueOnce(new Error("Requests could not be loaded."))
      .mockResolvedValueOnce([ownedRequest]);
    const view = await render(<MyRequestsScreen />, {
      wrapper: createHarness().Wrapper,
    });

    expect(view.getByText("Loading your Requests…")).toBeOnTheScreen();
    expect(await view.findByRole("alert")).toHaveTextContent(
      "Requests could not be loaded.",
    );
    await fireEvent.press(view.getByRole("button", { name: "Try again" }));
    expect(await view.findByText("Repair a garden gate")).toBeOnTheScreen();
    expect(mockRequest).toHaveBeenNthCalledWith(1, "/api/requests");
    expect(mockRequest).toHaveBeenNthCalledWith(2, "/api/requests");
  });
});

describe("US 011 mobile received Offer comparison", () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockRouterPush.mockReset();
    mockRouterReplace.mockReset();
  });

  it("shows complete Active Offer terms inline in backend order", async () => {
    mockRequest.mockResolvedValueOnce(comparison);
    const harness = createHarness();
    const view = await render(<RequestOffersScreen requestId="request-1" />, {
      wrapper: harness.Wrapper,
    });

    expect(
      await view.findByRole("header", {
        name: "Offers for Repair a garden gate",
      }),
    ).toBeOnTheScreen();
    expect(mockRequest).toHaveBeenCalledWith(
      "/api/requests/request-1/offers",
    );
    expect(mockRequest).toHaveBeenCalledTimes(1);
    const headers = view.getAllByRole("header");
    expect(headers.map((header) => header.props.children)).toEqual([
      "Offers for Repair a garden gate",
      "Bob",
      "Carol",
      "David",
    ]);
    expect(view.getAllByText("Active")).toHaveLength(3);
    expect(view.getByText("30")).toBeOnTheScreen();
    expect(view.getByText("12")).toBeOnTheScreen();
    expect(view.getByText("Fresh Eggs")).toBeOnTheScreen();
    expect(view.getByText("Two dozen eggs")).toBeOnTheScreen();
    expect(view.getByText("Transport")).toBeOnTheScreen();
    expect(view.getByText("Saturday morning airport trip")).toBeOnTheScreen();
    expect(view.queryByText("Renamed Eggs")).not.toBeOnTheScreen();
    expect(
      view.getByText(/not ranked or reduced to a single score/i),
    ).toBeOnTheScreen();
    expect(harness.queryClient.getQueryData(requestOffersQueryKey("request-1")))
      .toEqual(comparison);
    expect(view.getAllByRole("button", { name: "Accept Offer" })).toHaveLength(3);
    expect(view.getByTestId("accept-offer-from-Bob")).toBeOnTheScreen();
    expect(view.queryByRole("button", { name: /Reject/i })).not.toBeOnTheScreen();
    expect(view.queryByRole("button", { name: /Withdraw/i })).not.toBeOnTheScreen();
    expect(view.queryByRole("button", { name: /Negotiate/i })).not.toBeOnTheScreen();
    expect(view.queryByRole("button", { name: /View Offer/i })).not.toBeOnTheScreen();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("shows the Active Offer empty state", async () => {
    mockRequest.mockResolvedValueOnce({ ...comparison, offers: [] });
    const view = await render(<RequestOffersScreen requestId="request-1" />, {
      wrapper: createHarness().Wrapper,
    });

    expect(
      await view.findByText("This Request has no Active Offers."),
    ).toBeOnTheScreen();
  });

  it("accepts directly, caches the authoritative Agreement, and refreshes affected Request data", async () => {
    const noActiveOffers = { ...comparison, offers: [] };
    mockRequest
      .mockResolvedValueOnce(comparison)
      .mockResolvedValueOnce(agreement)
      .mockResolvedValueOnce(noActiveOffers);
    const harness = createHarness();
    harness.queryClient.setQueryData(participantRequestsQueryKey, [ownedRequest]);
    harness.queryClient.setQueryData(participantAgreementsQueryKey, []);
    harness.queryClient.setQueryData(
      requestDetailQueryKey(ownedRequest.id),
      ownedRequest,
    );
    const view = await render(<RequestOffersScreen requestId="request-1" />, {
      wrapper: harness.Wrapper,
    });

    await fireEvent.press(
      (await view.findAllByRole("button", { name: "Accept Offer" }))[0],
    );

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith(
        "/agreements/agreement-1",
      );
      expect(harness.queryClient.isFetching()).toBe(0);
      expect(harness.queryClient.isMutating()).toBe(0);
    });
    expect(mockRequest).toHaveBeenNthCalledWith(
      2,
      "/api/offers/offer-1/accept",
      { method: "POST" },
    );
    expect(mockRequest.mock.calls[1][1].body).toBeUndefined();
    expect(mockRequest.mock.calls[1][1]).not.toHaveProperty("participantId");
    expect(mockRequest).toHaveBeenNthCalledWith(
      3,
      "/api/requests/request-1/offers",
    );
    expect(
      harness.queryClient.getQueryData(agreementDetailQueryKey("agreement-1")),
    ).toEqual(agreement);
    expect(
      harness.queryClient.getQueryData(requestOffersQueryKey("request-1")),
    ).toEqual(noActiveOffers);
    expect(
      harness.queryClient.getQueryState(requestDetailQueryKey("request-1"))
        ?.isInvalidated,
    ).toBe(true);
    await waitFor(() => {
      expect(harness.queryClient.isFetching()).toBe(0);
      expect(harness.queryClient.isMutating()).toBe(0);
    });
    expect(
      harness.queryClient.getQueryState(participantRequestsQueryKey)
        ?.isInvalidated,
    ).toBe(true);
    expect(
      harness.queryClient.getQueryState(participantAgreementsQueryKey)
        ?.isInvalidated,
    ).toBe(true);
  });

  it("disables every acceptance action and prevents duplicate submissions while pending", async () => {
    let resolveAcceptance!: (value: AgreementDetails) => void;
    mockRequest
      .mockResolvedValueOnce(comparison)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveAcceptance = resolve;
          }),
      )
      .mockResolvedValueOnce({ ...comparison, offers: [] });
    const harness = createHarness();
    const view = await render(<RequestOffersScreen requestId="request-1" />, {
      wrapper: harness.Wrapper,
    });

    await fireEvent.press(
      (await view.findAllByRole("button", { name: "Accept Offer" }))[0],
    );

    const pending = await view.findByRole("button", { name: "Accepting…" });
    expect(pending).toBeDisabled();
    const otherActions = view.getAllByRole("button", { name: "Accept Offer" });
    expect(otherActions).toHaveLength(2);
    expect(otherActions.every((button) => button.props.accessibilityState.disabled))
      .toBe(true);
    await fireEvent.press(otherActions[0]);
    expect(mockRequest).toHaveBeenCalledTimes(2);

    await act(async () => resolveAcceptance(agreement));
    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith(
        "/agreements/agreement-1",
      );
      expect(harness.queryClient.isFetching()).toBe(0);
      expect(harness.queryClient.isMutating()).toBe(0);
    });
  });

  it("refetches authoritative Request state after an acceptance conflict", async () => {
    const noActiveOffers = { ...comparison, offers: [] };
    mockRequest
      .mockResolvedValueOnce(comparison)
      .mockRejectedValueOnce(
        new ApiError(409, "An Offer has already been accepted for this Request."),
      )
      .mockResolvedValueOnce(noActiveOffers);
    const harness = createHarness();
    harness.queryClient.setQueryData(participantRequestsQueryKey, [ownedRequest]);
    harness.queryClient.setQueryData(
      requestDetailQueryKey(ownedRequest.id),
      ownedRequest,
    );
    const view = await render(<RequestOffersScreen requestId="request-1" />, {
      wrapper: harness.Wrapper,
    });

    await fireEvent.press(
      (await view.findAllByRole("button", { name: "Accept Offer" }))[0],
    );

    expect(await view.findByRole("alert")).toHaveTextContent(
      "An Offer has already been accepted for this Request.",
    );
    expect(
      await view.findByText("This Request has no Active Offers."),
    ).toBeOnTheScreen();
    expect(mockRouterReplace).not.toHaveBeenCalled();
    expect(
      harness.queryClient.getQueryState(requestDetailQueryKey("request-1"))
        ?.isInvalidated,
    ).toBe(true);
  });

  it("uses an ownership-safe message when acceptance returns 404", async () => {
    mockRequest
      .mockResolvedValueOnce(comparison)
      .mockRejectedValueOnce(
        new ApiError(404, "The Offer belongs to another Participant's Request."),
      );
    const harness = createHarness();
    const view = await render(<RequestOffersScreen requestId="request-1" />, {
      wrapper: harness.Wrapper,
    });

    await fireEvent.press(
      (await view.findAllByRole("button", { name: "Accept Offer" }))[0],
    );

    expect(await view.findByRole("alert")).toHaveTextContent(
      "This Offer is not available.",
    );
    expect(
      view.queryByText("The Offer belongs to another Participant's Request."),
    ).not.toBeOnTheScreen();
    expect(
      harness.queryClient.getQueryData(requestOffersQueryKey("request-1")),
    ).toEqual(comparison);
    expect(mockRouterReplace).not.toHaveBeenCalled();
    await waitFor(() => expect(harness.queryClient.isMutating()).toBe(0));
  });

  it("shows loading, a general failure, and retries", async () => {
    mockRequest
      .mockRejectedValueOnce(new Error("Offers could not be loaded."))
      .mockResolvedValueOnce(comparison);
    const view = await render(<RequestOffersScreen requestId="request-1" />, {
      wrapper: createHarness().Wrapper,
    });

    expect(
      view.getByRole("header", { name: "Loading Offers…" }),
    ).toBeOnTheScreen();
    expect(await view.findByRole("alert")).toHaveTextContent(
      "Offers could not be loaded.",
    );
    await fireEvent.press(view.getByRole("button", { name: "Try again" }));
    expect(
      await view.findByRole("header", {
        name: "Offers for Repair a garden gate",
      }),
    ).toBeOnTheScreen();
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });

  it("uses a generic 404 for another Participant's Request identifier", async () => {
    mockRequest.mockRejectedValueOnce(
      new ApiError(404, "This Request belongs to another Participant."),
    );
    const view = await render(
      <RequestOffersScreen requestId="another-participants-request" />,
      { wrapper: createHarness().Wrapper },
    );

    expect(await view.findByRole("alert")).toHaveTextContent(
      "This Request is not available.",
    );
    expect(
      view.queryByText("This Request belongs to another Participant."),
    ).not.toBeOnTheScreen();
    expect(mockRequest).toHaveBeenCalledWith(
      "/api/requests/another-participants-request/offers",
    );
    await fireEvent.press(view.getByRole("button", { name: "Back to Request" }));
    expect(mockRouterReplace).toHaveBeenCalledWith(
      "/requests/another-participants-request",
    );
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import type { OfferDetails, OfferSubmissionOptions } from "../api/contracts";
import { ApiError } from "../api/http-client";
import {
  offerDetailQueryKey,
  participantOffersQueryKey,
} from "../api/offers-api";
import { OfferDetailScreen } from "../screens/offer-detail-screen";
import {
  parseCommonsAccountingUnits,
  SubmitOfferScreen,
} from "../screens/submit-offer-screen";

const mockRequest = jest.fn();
const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();

const availableRequest = {
  id: "request-2",
  title: "Help repairing a fence",
  description: "One garden fence panel needs replacing.",
  creator: { participantId: "participant-2", displayName: "Bob" },
  homeCommons: { id: "commons-1", name: "Brisbane Commons" },
};

const options: OfferSubmissionOptions = {
  request: availableRequest,
  capabilities: [
    { id: "capability-1", text: "Carpentry" },
    { id: "capability-2", text: "Garden maintenance" },
  ],
};

const authoritativeOffer: OfferDetails = {
  id: "offer-1",
  status: "Active",
  commonsAccountingUnits: 30,
  creator: { participantId: "participant-1", displayName: "Alice" },
  request: availableRequest,
  requestedContributions: [
    {
      capabilityId: "capability-1",
      capabilityTextSnapshot: "Carpentry",
      description: "Two hours of careful carpentry",
    },
  ],
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

async function renderSubmission() {
  mockRequest.mockResolvedValueOnce(options);
  const harness = createHarness();
  const view = await render(<SubmitOfferScreen requestId="request-2" />, {
    wrapper: harness.Wrapper,
  });
  await view.findByRole("header", { name: "Help repairing a fence" });
  return { view, ...harness };
}

describe("US 008 mobile Offer submission", () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockRouterPush.mockReset();
    mockRouterReplace.mockReset();
  });

  it.each([
    ["1", 1],
    ["30", 30],
    ["9007199254740991", 9_007_199_254_740_991],
  ])("accepts the safe accounting-unit boundary %s", (input, expected) => {
    expect(parseCommonsAccountingUnits(input)).toEqual({
      valid: true,
      value: expected,
    });
  });

  it.each(["0", "-1", "1.5", "not numeric", "9007199254740992"])(
    "rejects invalid accounting units %s",
    (input) => {
      expect(parseCommonsAccountingUnits(input)).toEqual({ valid: false });
    },
  );

  it("treats empty accounting units as null and requires another form of return", async () => {
    expect(parseCommonsAccountingUnits("")).toEqual({
      valid: true,
      value: null,
    });
    const { view } = await renderSubmission();

    expect(view.getByRole("button", { name: "Submit Offer" })).toBeDisabled();
    expect(
      view.getByText(
        "Include accounting units, a Capability contribution, or both.",
      ),
    ).toBeOnTheScreen();
  });

  it("submits a units-only Offer using only the documented body", async () => {
    const { view } = await renderSubmission();
    mockRequest.mockResolvedValueOnce({
      ...authoritativeOffer,
      requestedContributions: [],
    });

    await fireEvent.changeText(
      view.getByLabelText("Commons accounting units"),
      "30",
    );
    const submit = view.getByTestId("submit-offer");
    expect(submit).toBe(view.getByRole("button", { name: "Submit Offer" }));
    expect(submit).toBeEnabled();
    await fireEvent.press(submit);

    await waitFor(() => {
      expect(mockRequest).toHaveBeenNthCalledWith(
        2,
        "/api/requests/request-2/offers",
        {
          method: "POST",
          body: JSON.stringify({
            commonsAccountingUnits: 30,
            requestedContributions: [],
          }),
        },
      );
    });
    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith("/offers/offer-1");
      expect(
        view.getByRole("button", { name: "Submit Offer" }),
      ).toBeEnabled();
    });
  });

  it("selects, validates, submits raw Capability terms, and supports deselection", async () => {
    const { view } = await renderSubmission();
    const submit = view.getByRole("button", { name: "Submit Offer" });
    const carpentry = view.getByRole("checkbox", { name: "Carpentry" });

    await fireEvent.press(carpentry);
    expect(carpentry).toBeChecked();
    const description = view.getByLabelText(
      "Contribution description for Carpentry",
    );
    await fireEvent.changeText(description, "   ");
    expect(submit).toBeDisabled();

    await fireEvent.changeText(description, "  Two hours of carpentry  ");
    expect(submit).toBeEnabled();
    await fireEvent.press(carpentry);
    expect(carpentry).not.toBeChecked();
    expect(submit).toBeDisabled();

    await fireEvent.press(carpentry);
    await fireEvent.changeText(
      view.getByLabelText("Contribution description for Carpentry"),
      "  Two hours of carpentry  ",
    );
    mockRequest.mockResolvedValueOnce(authoritativeOffer);
    await fireEvent.press(submit);

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith("/offers/offer-1");
      expect(
        view.getByRole("button", { name: "Submit Offer" }),
      ).toBeEnabled();
    });
    const body = JSON.parse(mockRequest.mock.calls[1][1].body);
    expect(body).toEqual({
      commonsAccountingUnits: null,
      requestedContributions: [
        {
          capabilityId: "capability-1",
          description: "  Two hours of carpentry  ",
        },
      ],
    });
    expect(JSON.stringify(body)).not.toMatch(
      /participantId|userId|creatorId|commonsId|capabilityTextSnapshot/,
    );
  });

  it("submits combined terms, caches the complete response, and opens read-only detail", async () => {
    const { view, queryClient } = await renderSubmission();
    await fireEvent.changeText(
      view.getByLabelText("Commons accounting units"),
      "30",
    );
    await fireEvent.press(
      view.getByRole("checkbox", { name: "Garden maintenance" }),
    );
    await fireEvent.changeText(
      view.getByLabelText("Contribution description for Garden maintenance"),
      "  Weed the vegetable beds  ",
    );
    const returned = {
      ...authoritativeOffer,
      requestedContributions: [
        {
          capabilityId: "capability-2",
          capabilityTextSnapshot: "Garden maintenance",
          description: "Weed the vegetable beds",
        },
      ],
    };
    mockRequest.mockResolvedValueOnce(returned);

    await fireEvent.press(view.getByRole("button", { name: "Submit Offer" }));

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith("/offers/offer-1");
      expect(
        view.getByRole("button", { name: "Submit Offer" }),
      ).toBeEnabled();
    });
    expect(JSON.parse(mockRequest.mock.calls[1][1].body)).toEqual({
      commonsAccountingUnits: 30,
      requestedContributions: [
        {
          capabilityId: "capability-2",
          description: "  Weed the vegetable beds  ",
        },
      ],
    });
    expect(queryClient.getQueryData(offerDetailQueryKey("offer-1"))).toEqual(
      returned,
    );
  });

  it("loads Offer options and retries a failure", async () => {
    mockRequest
      .mockRejectedValueOnce(new Error("Options could not be loaded."))
      .mockResolvedValueOnce(options);
    const view = await render(<SubmitOfferScreen requestId="request-2" />, {
      wrapper: createHarness().Wrapper,
    });

    expect(view.getByText("Loading Offer options…")).toBeOnTheScreen();
    expect(await view.findByRole("alert")).toHaveTextContent(
      "Options could not be loaded.",
    );
    await fireEvent.press(view.getByRole("button", { name: "Try again" }));
    expect(
      await view.findByRole("header", { name: "Help repairing a fence" }),
    ).toBeOnTheScreen();
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });

  it("does not disclose why Offer options returned 404", async () => {
    mockRequest.mockRejectedValueOnce(new ApiError(404, "Hidden reason"));
    const notFound = await render(
      <SubmitOfferScreen requestId="untrusted-id" />,
      { wrapper: createHarness().Wrapper },
    );
    expect(await notFound.findByRole("alert")).toHaveTextContent(
      "This Request is not available for an Offer.",
    );
    expect(notFound.queryByText("Hidden reason")).not.toBeOnTheScreen();
  });

  it.each([
    [400, "A selected contribution requires a description."],
    [404, "This Request is no longer available for an Offer."],
  ])("shows backend %s submission failure safely", async (status, expected) => {
    const { view } = await renderSubmission();
    mockRequest.mockRejectedValueOnce(new ApiError(status, "Hidden backend detail"));
    await fireEvent.changeText(
      view.getByLabelText("Commons accounting units"),
      "30",
    );
    await fireEvent.press(view.getByRole("button", { name: "Submit Offer" }));

    const alert = await view.findByRole("alert");
    expect(alert).toHaveTextContent(
      status === 400 ? "Hidden backend detail" : expected,
    );
  });

  it("prevents duplicate submission while the Offer is pending", async () => {
    let resolveSubmit!: (offer: OfferDetails) => void;
    const { view } = await renderSubmission();
    mockRequest.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    await fireEvent.changeText(
      view.getByLabelText("Commons accounting units"),
      "30",
    );
    const submit = view.getByRole("button", { name: "Submit Offer" });

    await fireEvent.press(submit);
    const pendingSubmit = await view.findByRole("button", {
      name: "Submitting Offer…",
    });
    expect(pendingSubmit).toBeDisabled();
    expect(view.getByLabelText("Commons accounting units")).toBeDisabled();
    await fireEvent.press(pendingSubmit);
    expect(mockRequest).toHaveBeenCalledTimes(2);

    await act(async () => resolveSubmit(authoritativeOffer));
    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith("/offers/offer-1");
      expect(
        view.getByRole("button", { name: "Submit Offer" }),
      ).toBeEnabled();
    });
  });
});

describe("US 008 and US 009 mobile Offer detail", () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockRouterPush.mockReset();
    mockRouterReplace.mockReset();
  });

  it("loads authoritative Offer terms without actions beyond withdrawal", async () => {
    mockRequest.mockResolvedValueOnce(authoritativeOffer);
    const view = await render(<OfferDetailScreen offerId="offer-1" />, {
      wrapper: createHarness().Wrapper,
    });

    expect(
      await view.findByRole("header", {
        name: "Offer for Help repairing a fence",
      }),
    ).toBeOnTheScreen();
    expect(mockRequest).toHaveBeenCalledWith("/api/offers/offer-1");
    expect(view.getByText("Active")).toBeOnTheScreen();
    expect(view.getByText("30")).toBeOnTheScreen();
    expect(view.getByText("Carpentry")).toBeOnTheScreen();
    expect(
      view.getByText("Two hours of careful carpentry"),
    ).toBeOnTheScreen();
    expect(view.queryByRole("textbox")).not.toBeOnTheScreen();
    expect(
      view.getByRole("button", { name: "Withdraw Offer" }),
    ).toBeOnTheScreen();
    expect(view.queryByRole("button", { name: /Accept/i })).not.toBeOnTheScreen();
    expect(view.queryByRole("button", { name: /Reject/i })).not.toBeOnTheScreen();
    await fireEvent.press(
      view.getByRole("button", { name: "Back to My Offers" }),
    );
    expect(mockRouterReplace).toHaveBeenCalledWith("/offers");
  });

  it("does not disclose why an untrusted Offer identifier returned 404", async () => {
    mockRequest.mockRejectedValueOnce(
      new ApiError(404, "This Offer belongs to another Participant."),
    );
    const view = await render(
      <OfferDetailScreen offerId="another-participants-offer" />,
      { wrapper: createHarness().Wrapper },
    );

    expect(await view.findByRole("alert")).toHaveTextContent(
      "This Offer is not available.",
    );
    expect(
      view.queryByText("This Offer belongs to another Participant."),
    ).not.toBeOnTheScreen();
    expect(mockRequest).toHaveBeenCalledWith(
      "/api/offers/another-participants-offer",
    );
    await fireEvent.press(
      view.getByRole("button", { name: "Back to My Offers" }),
    );
    expect(mockRouterReplace).toHaveBeenCalledWith("/offers");
  });
});

describe("US 010 mobile Offer withdrawal", () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockRouterPush.mockReset();
    mockRouterReplace.mockReset();
  });

  it("withdraws an Active Offer directly and caches the complete response", async () => {
    const otherOffer = { ...authoritativeOffer, id: "offer-2" };
    const withdrawnOffer: OfferDetails = {
      ...authoritativeOffer,
      status: "Withdrawn",
    };
    mockRequest
      .mockResolvedValueOnce(authoritativeOffer)
      .mockResolvedValueOnce(withdrawnOffer);
    const harness = createHarness();
    harness.queryClient.setQueryData(participantOffersQueryKey, [
      otherOffer,
      authoritativeOffer,
    ]);
    const view = await render(<OfferDetailScreen offerId="offer-1" />, {
      wrapper: harness.Wrapper,
    });

    await fireEvent.press(
      await view.findByRole("button", { name: "Withdraw Offer" }),
    );

    expect(await view.findByText("Withdrawn")).toBeOnTheScreen();
    expect(mockRequest).toHaveBeenNthCalledWith(
      2,
      "/api/offers/offer-1/withdraw",
      { method: "POST" },
    );
    expect(mockRequest.mock.calls[1][1].body).toBeUndefined();
    expect(
      view.queryByRole("button", { name: "Withdraw Offer" }),
    ).not.toBeOnTheScreen();
    expect(view.getByText("30")).toBeOnTheScreen();
    expect(view.getByText("Carpentry")).toBeOnTheScreen();
    expect(
      view.getByText("Two hours of careful carpentry"),
    ).toBeOnTheScreen();
    expect(
      harness.queryClient.getQueryData(offerDetailQueryKey("offer-1")),
    ).toEqual(withdrawnOffer);
    expect(
      harness.queryClient.getQueryData(participantOffersQueryKey),
    ).toEqual([otherOffer, withdrawnOffer]);
  });

  it.each(["Withdrawn", "Accepted", "Closed"] as const)(
    "does not expose withdrawal for a %s Offer",
    async (status) => {
      mockRequest.mockResolvedValueOnce({ ...authoritativeOffer, status });
      const view = await render(<OfferDetailScreen offerId="offer-1" />, {
        wrapper: createHarness().Wrapper,
      });

      expect(await view.findByText(status)).toBeOnTheScreen();
      expect(
        view.queryByRole("button", { name: "Withdraw Offer" }),
      ).not.toBeOnTheScreen();
      expect(mockRequest).toHaveBeenCalledTimes(1);
    },
  );

  it("opens the persisted Agreement from an Accepted Offer", async () => {
    mockRequest.mockResolvedValueOnce({
      ...authoritativeOffer,
      status: "Accepted",
      agreementId: "agreement-1",
    });
    const view = await render(<OfferDetailScreen offerId="offer-1" />, {
      wrapper: createHarness().Wrapper,
    });

    await fireEvent.press(
      await view.findByRole("button", { name: "View Agreement" }),
    );

    expect(mockRouterPush).toHaveBeenCalledWith("/agreements/agreement-1");
    expect(
      view.queryByRole("button", { name: "Withdraw Offer" }),
    ).not.toBeOnTheScreen();
  });

  it("disables withdrawal and prevents duplicate submission while pending", async () => {
    let resolveWithdrawal!: (offer: OfferDetails) => void;
    mockRequest
      .mockResolvedValueOnce(authoritativeOffer)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveWithdrawal = resolve;
          }),
      );
    const view = await render(<OfferDetailScreen offerId="offer-1" />, {
      wrapper: createHarness().Wrapper,
    });

    await fireEvent.press(
      await view.findByRole("button", { name: "Withdraw Offer" }),
    );
    const pending = await view.findByRole("button", { name: "Withdrawing…" });
    expect(pending).toBeDisabled();
    expect(view.getByText("One garden fence panel needs replacing.")).toBeOnTheScreen();
    await fireEvent.press(pending);
    expect(mockRequest).toHaveBeenCalledTimes(2);

    await act(async () =>
      resolveWithdrawal({ ...authoritativeOffer, status: "Withdrawn" }),
    );
    expect(await view.findByText("Withdrawn")).toBeOnTheScreen();
  });

  it("refetches authoritative detail and invalidates My Offers after conflict", async () => {
    const acceptedOffer: OfferDetails = {
      ...authoritativeOffer,
      status: "Accepted",
      agreementId: "agreement-1",
    };
    mockRequest
      .mockResolvedValueOnce(authoritativeOffer)
      .mockRejectedValueOnce(
        new ApiError(409, "Only an Active Offer can be withdrawn."),
      )
      .mockResolvedValueOnce(acceptedOffer);
    const harness = createHarness();
    harness.queryClient.setQueryData(participantOffersQueryKey, [
      authoritativeOffer,
    ]);
    const view = await render(<OfferDetailScreen offerId="offer-1" />, {
      wrapper: harness.Wrapper,
    });

    await fireEvent.press(
      await view.findByRole("button", { name: "Withdraw Offer" }),
    );

    expect(await view.findByRole("alert")).toHaveTextContent(
      "Only an Active Offer can be withdrawn.",
    );
    expect(await view.findByText("Accepted")).toBeOnTheScreen();
    expect(mockRequest).toHaveBeenNthCalledWith(3, "/api/offers/offer-1");
    expect(
      view.queryByRole("button", { name: "Withdraw Offer" }),
    ).not.toBeOnTheScreen();
    expect(
      harness.queryClient.getQueryData(offerDetailQueryKey("offer-1")),
    ).toEqual(acceptedOffer);
    expect(
      harness.queryClient.getQueryState(participantOffersQueryKey)?.isInvalidated,
    ).toBe(true);
  });

  it("keeps cached data and uses a generic message after a withdrawal 404", async () => {
    mockRequest
      .mockResolvedValueOnce(authoritativeOffer)
      .mockRejectedValueOnce(
        new ApiError(404, "This Offer belongs to another Participant."),
      );
    const harness = createHarness();
    harness.queryClient.setQueryData(participantOffersQueryKey, [
      authoritativeOffer,
    ]);
    const view = await render(<OfferDetailScreen offerId="offer-1" />, {
      wrapper: harness.Wrapper,
    });

    await fireEvent.press(
      await view.findByRole("button", { name: "Withdraw Offer" }),
    );

    expect(await view.findByRole("alert")).toHaveTextContent(
      "This Offer is not available.",
    );
    expect(
      view.queryByText("This Offer belongs to another Participant."),
    ).not.toBeOnTheScreen();
    expect(
      harness.queryClient.getQueryData(offerDetailQueryKey("offer-1")),
    ).toEqual(authoritativeOffer);
    expect(
      harness.queryClient.getQueryData(participantOffersQueryKey),
    ).toEqual([authoritativeOffer]);
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });

  it("preserves authoritative data after a general failure and permits retry", async () => {
    const withdrawnOffer: OfferDetails = {
      ...authoritativeOffer,
      status: "Withdrawn",
    };
    mockRequest
      .mockResolvedValueOnce(authoritativeOffer)
      .mockRejectedValueOnce(new Error("Withdrawal could not be completed."))
      .mockResolvedValueOnce(withdrawnOffer);
    const harness = createHarness();
    const view = await render(<OfferDetailScreen offerId="offer-1" />, {
      wrapper: harness.Wrapper,
    });

    await fireEvent.press(
      await view.findByRole("button", { name: "Withdraw Offer" }),
    );
    expect(await view.findByRole("alert")).toHaveTextContent(
      "Withdrawal could not be completed.",
    );
    expect(
      harness.queryClient.getQueryData(offerDetailQueryKey("offer-1")),
    ).toEqual(authoritativeOffer);

    await fireEvent.press(
      view.getByRole("button", { name: "Withdraw Offer" }),
    );
    expect(await view.findByText("Withdrawn")).toBeOnTheScreen();
    expect(mockRequest).toHaveBeenCalledTimes(3);
    expect(
      harness.queryClient.getQueryData(participantOffersQueryKey),
    ).toBeUndefined();
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import type { OfferDetails } from "../api/contracts";
import { ApiError } from "../api/http-client";
import { participantOffersQueryKey } from "../api/offers-api";
import { MyOffersScreen } from "../screens/my-offers-screen";

const mockRequest = jest.fn();
const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();

function offer(
  id: string,
  title: string,
  status: OfferDetails["status"],
  overrides: Partial<OfferDetails> = {},
): OfferDetails {
  return {
    id,
    status,
    commonsAccountingUnits: null,
    creator: { participantId: "participant-1", displayName: "Alice" },
    request: {
      id: `request-${id}`,
      title,
      description: `Description for ${title}`,
      creator: { participantId: "participant-2", displayName: "Bob" },
      homeCommons: { id: "commons-1", name: "Brisbane Commons" },
    },
    requestedContributions: [],
    agreementId: null,
    ...overrides,
  };
}

const activeUnitsOffer = offer("offer-1", "Repair a fence", "Active", {
  commonsAccountingUnits: 30,
});
const withdrawnCapabilityOffer = offer(
  "offer-2",
  "Move a garden bed",
  "Withdrawn",
  {
    requestedContributions: [
      {
        capabilityId: "capability-1",
        capabilityTextSnapshot: "Fresh Eggs",
        description: "Two dozen eggs",
      },
    ],
  },
);
const acceptedCombinedOffer = offer(
  "offer-3",
  "Transport to an appointment",
  "Accepted",
  {
    commonsAccountingUnits: 9_007_199_254_740_991,
    requestedContributions: [
      {
        capabilityId: "capability-2",
        capabilityTextSnapshot: "Garden maintenance",
        description: "Help clear the vegetable beds",
      },
    ],
  },
);
const closedOffer = offer("offer-4", "Paint a gate", "Closed");

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

describe("US 009 mobile My Offers", () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockRouterPush.mockReset();
    mockRouterReplace.mockReset();
  });

  it("shows every Offer in backend order with authoritative terms and status", async () => {
    const offers = [
      closedOffer,
      activeUnitsOffer,
      withdrawnCapabilityOffer,
      acceptedCombinedOffer,
    ];
    mockRequest.mockResolvedValueOnce(offers);
    const harness = createHarness();
    const view = await render(<MyOffersScreen />, {
      wrapper: harness.Wrapper,
    });

    expect(
      await view.findByRole("header", { name: "My Offers" }),
    ).toBeOnTheScreen();
    expect(await view.findByText("Paint a gate")).toBeOnTheScreen();
    expect(mockRequest).toHaveBeenCalledWith("/api/offers");
    expect(mockRequest).toHaveBeenCalledTimes(1);

    const offerButtons = view.getAllByRole("button", { name: /^View Offer for/ });
    expect(offerButtons.map((button) => button.props.accessibilityLabel)).toEqual([
      "View Offer for Paint a gate",
      "View Offer for Repair a fence",
      "View Offer for Move a garden bed",
      "View Offer for Transport to an appointment",
    ]);
    expect(view.getByText("Active")).toBeOnTheScreen();
    expect(view.getByText("Withdrawn")).toBeOnTheScreen();
    expect(view.getByText("Accepted")).toBeOnTheScreen();
    expect(view.getByText("Closed")).toBeOnTheScreen();
    expect(view.getAllByText("Request created by Bob")).toHaveLength(4);
    expect(offerButtons[1]).toHaveTextContent(
      /Commons accounting units requested:.*30/,
    );
    expect(offerButtons[2]).toHaveTextContent(/Fresh Eggs:.*Two dozen eggs/);
    expect(offerButtons[3]).toHaveTextContent(
      /Commons accounting units requested:.*9,007,199,254,740,991/,
    );
    expect(offerButtons[3]).toHaveTextContent(
      /Garden maintenance:.*Help clear the vegetable beds/,
    );
    expect(harness.queryClient.getQueryData(participantOffersQueryKey)).toEqual(
      offers,
    );
    expect(view.queryByRole("button", { name: /Withdraw/i })).not.toBeOnTheScreen();
    expect(view.queryByRole("button", { name: /Accept/i })).not.toBeOnTheScreen();
    expect(view.queryByRole("button", { name: /Reject/i })).not.toBeOnTheScreen();
    expect(view.queryByRole("button", { name: /Compare/i })).not.toBeOnTheScreen();
    expect(view.queryByRole("button", { name: /Negotiate/i })).not.toBeOnTheScreen();
  });

  it("opens the selected Offer using its untrusted route identifier", async () => {
    mockRequest.mockResolvedValueOnce([activeUnitsOffer]);
    const view = await render(<MyOffersScreen />, {
      wrapper: createHarness().Wrapper,
    });

    await fireEvent.press(
      await view.findByRole("button", {
        name: "View Offer for Repair a fence",
      }),
    );
    expect(mockRouterPush).toHaveBeenCalledWith("/offers/offer-1");
  });

  it("shows loading and retries the bodyless list request", async () => {
    let rejectList!: (error: Error) => void;
    mockRequest
      .mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            rejectList = reject;
          }),
      )
      .mockResolvedValueOnce([activeUnitsOffer]);
    const view = await render(<MyOffersScreen />, {
      wrapper: createHarness().Wrapper,
    });

    expect(view.getByText("Loading your Offers…")).toBeOnTheScreen();
    await act(async () => rejectList(new Error("Offers could not be loaded.")));
    expect(await view.findByRole("alert")).toHaveTextContent(
      "Offers could not be loaded.",
    );
    await fireEvent.press(view.getByRole("button", { name: "Try again" }));
    expect(await view.findByText("Repair a fence")).toBeOnTheScreen();
    expect(mockRequest).toHaveBeenNthCalledWith(1, "/api/offers");
    expect(mockRequest).toHaveBeenNthCalledWith(2, "/api/offers");
  });

  it("shows the documented empty state", async () => {
    mockRequest.mockResolvedValueOnce([]);
    const view = await render(<MyOffersScreen />, {
      wrapper: createHarness().Wrapper,
    });

    expect(
      await view.findByText("You have not submitted any Offers yet."),
    ).toBeOnTheScreen();
  });

  it("uses a generic list 404 and does not disclose backend details", async () => {
    mockRequest.mockRejectedValueOnce(
      new ApiError(404, "The authenticated account has no Participant."),
    );
    const view = await render(<MyOffersScreen />, {
      wrapper: createHarness().Wrapper,
    });

    expect(await view.findByRole("alert")).toHaveTextContent(
      "Your Offers are not available.",
    );
    expect(
      view.queryByText("The authenticated account has no Participant."),
    ).not.toBeOnTheScreen();
  });

  it("returns to the profile without changing Offer state", async () => {
    mockRequest.mockResolvedValueOnce([]);
    const view = await render(<MyOffersScreen />, {
      wrapper: createHarness().Wrapper,
    });

    await view.findByText("You have not submitted any Offers yet.");
    await fireEvent.press(view.getByRole("button", { name: "Back to profile" }));
    expect(mockRouterReplace).toHaveBeenCalledWith("/profile");
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { ApiError } from "../api/http-client";
import { CapabilitiesSection } from "../participants/capabilities-section";

const mockRequest = jest.fn();

jest.mock("../auth/session-context", () => ({
  useSession: () => ({
    status: "authenticated",
    request: mockRequest,
  }),
}));

function createWrapper() {
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

  return Wrapper;
}

describe("US 002 Capability management", () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  it("shows an inline loading state while the Capability list is pending", async () => {
    let resolveCapabilities!: (value: unknown[]) => void;
    mockRequest.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveCapabilities = resolve;
        }),
    );
    const view = await render(<CapabilitiesSection />, {
      wrapper: createWrapper(),
    });

    expect(view.getByText("Loading Capabilities…")).toBeOnTheScreen();
    resolveCapabilities([]);
    expect(
      await view.findByText("You have not listed any Capabilities yet."),
    ).toBeOnTheScreen();
  });

  it("shows the empty state and rejects whitespace-only input before submission", async () => {
    mockRequest.mockResolvedValueOnce([]);
    const view = await render(<CapabilitiesSection />, {
      wrapper: createWrapper(),
    });

    expect(
      await view.findByText("You have not listed any Capabilities yet."),
    ).toBeOnTheScreen();
    expect(
      view.getByText(/A Capability is not an Offer, current availability/),
    ).toBeOnTheScreen();

    const addButton = view.getByRole("button", { name: "Add Capability" });
    expect(addButton).toBeDisabled();
    await fireEvent.changeText(view.getByLabelText("Add a Capability"), "   ");
    expect(addButton).toBeDisabled();
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  it("sends unnormalized text, displays the server value, and removes by Capability ID", async () => {
    const savedCapability = {
      id: "capability-1",
      text: "Computer Hardware Repair",
    };
    mockRequest
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(savedCapability)
      .mockResolvedValueOnce([savedCapability])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([]);
    const view = await render(<CapabilitiesSection />, {
      wrapper: createWrapper(),
    });

    await view.findByText("You have not listed any Capabilities yet.");
    await fireEvent.changeText(
      view.getByLabelText("Add a Capability"),
      "  Computer Hardware Repair  ",
    );
    await fireEvent.press(view.getByRole("button", { name: "Add Capability" }));

    expect(await view.findByText("Computer Hardware Repair")).toBeOnTheScreen();
    expect(mockRequest).toHaveBeenNthCalledWith(
      2,
      "/api/participants/me/capabilities",
      {
        method: "POST",
        body: JSON.stringify({ text: "  Computer Hardware Repair  " }),
      },
    );
    expect(view.getByLabelText("Add a Capability")).toHaveDisplayValue("");

    await fireEvent.press(
      view.getByRole("button", { name: "Remove Computer Hardware Repair" }),
    );

    await waitFor(() => {
      expect(view.queryByText("Computer Hardware Repair")).not.toBeOnTheScreen();
    });
    expect(mockRequest).toHaveBeenNthCalledWith(
      4,
      "/api/participants/me/capabilities/capability-1",
      { method: "DELETE" },
    );
  });

  it("shows multiple server-owned Capabilities without changing their casing", async () => {
    mockRequest.mockResolvedValueOnce([
      { id: "capability-1", text: "Carpentry" },
      { id: "capability-2", text: "iOS troubleshooting" },
    ]);
    const view = await render(<CapabilitiesSection />, {
      wrapper: createWrapper(),
    });

    expect(await view.findByText("Carpentry")).toBeOnTheScreen();
    expect(view.getByText("iOS troubleshooting")).toBeOnTheScreen();
  });

  it("keeps the entered text and shows the backend duplicate rejection", async () => {
    mockRequest
      .mockResolvedValueOnce([{ id: "capability-1", text: "Carpentry" }])
      .mockRejectedValueOnce(
        new ApiError(
          409,
          "This Capability is already listed on the Participant's profile.",
        ),
      );
    const view = await render(<CapabilitiesSection />, {
      wrapper: createWrapper(),
    });

    await view.findByText("Carpentry");
    const input = view.getByLabelText("Add a Capability");
    await fireEvent.changeText(input, "  cArPeNtRy  ");
    await fireEvent.press(view.getByRole("button", { name: "Add Capability" }));

    expect(
      await view.findByRole("alert"),
    ).toHaveTextContent(
      "This Capability is already listed on the Participant's profile.",
    );
    expect(input).toHaveDisplayValue("  cArPeNtRy  ");
  });

  it("retains the Capability when the backend rejects removal", async () => {
    mockRequest
      .mockResolvedValueOnce([{ id: "capability-1", text: "Carpentry" }])
      .mockRejectedValueOnce(new Error("The Capability could not be removed."));
    const view = await render(<CapabilitiesSection />, {
      wrapper: createWrapper(),
    });

    await view.findByText("Carpentry");
    await fireEvent.press(
      view.getByRole("button", { name: "Remove Carpentry" }),
    );

    expect(await view.findByRole("alert")).toHaveTextContent(
      "The Capability could not be removed.",
    );
    expect(view.getByText("Carpentry")).toBeOnTheScreen();
  });

  it("shows a list failure and retries the existing endpoint", async () => {
    mockRequest
      .mockRejectedValueOnce(new Error("Capabilities could not be loaded."))
      .mockResolvedValueOnce([{ id: "capability-1", text: "Bicycle repair" }]);
    const view = await render(<CapabilitiesSection />, {
      wrapper: createWrapper(),
    });

    expect(await view.findByRole("alert")).toHaveTextContent(
      "Capabilities could not be loaded.",
    );
    await fireEvent.press(
      view.getByRole("button", { name: "Try loading Capabilities again" }),
    );

    expect(await view.findByText("Bicycle repair")).toBeOnTheScreen();
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });
});

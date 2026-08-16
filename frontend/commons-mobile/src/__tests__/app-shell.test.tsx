import { render } from "@testing-library/react-native";
import { AppProviders } from "../providers/app-providers";
import { FoundationScreen } from "../screens/foundation-screen";

describe("mobile application shell", () => {
  it("renders the foundation without participant behaviour", async () => {
    const view = await render(
      <AppProviders>
        <FoundationScreen />
      </AppProviders>,
    );

    expect(view.getByText("Commons Market")).toBeOnTheScreen();
    expect(view.getByText("Mobile client foundation")).toBeOnTheScreen();
  });
});

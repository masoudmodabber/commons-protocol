import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { AuthenticationScreen } from "../screens/authentication-screen";

describe("authentication screen", () => {
  it("registers with trimmed email and does not alter the password", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const view = await render(
      <AuthenticationScreen
        mode="register"
        onSubmit={onSubmit}
        onSwitch={jest.fn()}
      />,
    );

    await fireEvent.changeText(view.getByLabelText("Email"), " person@example.com ");
    await fireEvent.changeText(view.getByLabelText("Password"), " secret value ");
    await fireEvent.press(view.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: "person@example.com",
        password: " secret value ",
      });
    });
  });

  it("requires both credentials before sign in", async () => {
    const view = await render(
      <AuthenticationScreen
        mode="sign-in"
        onSubmit={jest.fn()}
        onSwitch={jest.fn()}
      />,
    );

    expect(view.getByRole("button", { name: "Sign in" })).toBeDisabled();
  });
});

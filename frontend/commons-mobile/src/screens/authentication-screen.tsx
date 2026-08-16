import { useState } from "react";
import { TextInput } from "react-native";
import type { Credentials } from "../api/auth-api";
import {
  ErrorMessage,
  Field,
  formControlStyles,
  PrimaryButton,
  TextButton,
} from "../components/form-controls";
import { ScreenLayout } from "../components/screen-layout";

interface AuthenticationScreenProps {
  mode: "sign-in" | "register";
  onSubmit(credentials: Credentials): Promise<void>;
  onSwitch(): void;
}

export function AuthenticationScreen({
  mode,
  onSubmit,
  onSwitch,
}: AuthenticationScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isRegistration = mode === "register";
  const isComplete = email.trim().length > 0 && password.length > 0;

  async function submit() {
    if (!isComplete || pending) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      await onSubmit({ email: email.trim(), password });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Authentication could not be completed.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <ScreenLayout
      eyebrow="Your local exchange"
      title={isRegistration ? "Create your account" : "Welcome back"}
      description={
        isRegistration
          ? "Create an account before joining your Home Commons."
          : "Sign in to join a Commons or view your participant profile."
      }
    >
      <Field label="Email">
        <TextInput
          accessibilityLabel="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          returnKeyType="next"
          style={formControlStyles.input}
          value={email}
        />
      </Field>
      <Field label="Password">
        <TextInput
          accessibilityLabel="Password"
          autoCapitalize="none"
          autoComplete={isRegistration ? "new-password" : "current-password"}
          onChangeText={setPassword}
          onSubmitEditing={() => void submit()}
          returnKeyType="done"
          secureTextEntry
          style={formControlStyles.input}
          value={password}
        />
      </Field>
      {error ? <ErrorMessage message={error} /> : null}
      <PrimaryButton
        disabled={!isComplete}
        label={isRegistration ? "Create account" : "Sign in"}
        onPress={() => void submit()}
        pending={pending}
        pendingLabel={isRegistration ? "Creating account…" : "Signing in…"}
      />
      <TextButton
        disabled={pending}
        label={
          isRegistration ? "Already registered? Sign in" : "New here? Create an account"
        }
        onPress={onSwitch}
      />
    </ScreenLayout>
  );
}

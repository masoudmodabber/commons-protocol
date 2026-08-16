import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { ErrorMessage, PrimaryButton } from "../components/form-controls";
import { ScreenLayout } from "../components/screen-layout";

export function StartupScreen({
  error,
  onRetry,
  onSignOut,
}: {
  error?: string;
  onRetry?(): void;
  onSignOut?(): Promise<void> | void;
}) {
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  async function signOut() {
    if (!onSignOut) {
      return;
    }

    setSigningOut(true);
    setSignOutError(null);

    try {
      await onSignOut();
    } catch {
      setSignOutError(
        "The securely stored session could not be removed. Please try again.",
      );
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <ScreenLayout
      eyebrow="Your local exchange"
      title="Commons Market"
      description={error ? "We could not load your participant profile." : undefined}
    >
      {error ? (
        <>
          <ErrorMessage message={error} />
          {signOutError ? <ErrorMessage message={signOutError} /> : null}
          {onRetry ? <PrimaryButton label="Try again" onPress={onRetry} /> : null}
          {onSignOut ? (
            <View style={styles.secondaryAction}>
              <PrimaryButton
                label="Sign out"
                onPress={() => void signOut()}
                pending={signingOut}
                pendingLabel="Signing out…"
              />
            </View>
          ) : null}
        </>
      ) : (
        <View accessibilityRole="progressbar" style={styles.loading}>
          <ActivityIndicator color="#276544" size="large" />
          <Text style={styles.loadingText}>Loading your session…</Text>
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  loading: { alignItems: "center", paddingVertical: 20 },
  loadingText: { marginTop: 14, color: "#4c5f53", fontSize: 15 },
  secondaryAction: { marginTop: 12 },
});

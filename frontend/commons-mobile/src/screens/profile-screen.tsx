import { useRouter, type Href } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSession } from "../auth/session-context";
import { ErrorMessage, PrimaryButton } from "../components/form-controls";
import { ScreenLayout } from "../components/screen-layout";
import { SignOutButton } from "../components/sign-out-button";
import { CapabilitiesSection } from "../participants/capabilities-section";
import { useParticipantProfile } from "../participants/use-participant-profile";
import { StartupScreen } from "./startup-screen";

export function ProfileScreen() {
  const router = useRouter();
  const session = useSession();
  const profileQuery = useParticipantProfile();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  async function signOut() {
    setSigningOut(true);
    setSignOutError(null);

    try {
      await session.signOut();
    } catch {
      setSignOutError(
        "The securely stored session could not be removed. Please try again.",
      );
    } finally {
      setSigningOut(false);
    }
  }

  if (!profileQuery.data) {
    return <StartupScreen />;
  }

  const profile = profileQuery.data;

  return (
    <ScreenLayout
      description="Your participant identity in your Home Commons."
      eyebrow="Participant profile"
      headerAction={
        <SignOutButton disabled={signingOut} onPress={() => void signOut()} />
      }
      title={profile.displayName}
    >
      {signOutError ? <ErrorMessage message={signOutError} /> : null}
      <View style={styles.detail}>
        <Text style={styles.label}>Home Commons</Text>
        <Text style={styles.value}>{profile.homeCommons.name}</Text>
      </View>
      <View style={styles.detail}>
        <Text style={styles.label}>Short bio</Text>
        <Text style={profile.bio ? styles.value : styles.emptyValue}>
          {profile.bio ?? "No bio provided."}
        </Text>
      </View>
      <View style={styles.requestActions}>
        <PrimaryButton
          label="Browse Available Requests"
          onPress={() => router.push("/available-requests" as Href)}
        />
        <PrimaryButton
          label="Create a Request"
          onPress={() => router.push("/requests/new" as Href)}
        />
      </View>
      <CapabilitiesSection />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  detail: {
    marginBottom: 14,
    borderRadius: 12,
    backgroundColor: "#f2f5f1",
    padding: 16,
  },
  label: {
    marginBottom: 5,
    color: "#52725f",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  value: { color: "#17251d", fontSize: 17, lineHeight: 25 },
  emptyValue: { color: "#687a6f", fontSize: 16, fontStyle: "italic" },
  requestActions: { gap: 10 },
});

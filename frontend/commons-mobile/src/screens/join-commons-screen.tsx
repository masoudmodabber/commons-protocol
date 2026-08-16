import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ApiError } from "../api/http-client";
import {
  availableCommonsQueryKey,
  createParticipantsApi,
  participantProfileQueryKey,
} from "../api/participants-api";
import { useSession } from "../auth/session-context";
import {
  ErrorMessage,
  Field,
  formControlStyles,
  PrimaryButton,
} from "../components/form-controls";
import { ScreenLayout } from "../components/screen-layout";
import { SignOutButton } from "../components/sign-out-button";

export function JoinCommonsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useSession();
  const participantsApi = useMemo(
    () => createParticipantsApi(session.request),
    [session.request],
  );
  const [homeCommonsId, setHomeCommonsId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const commonsQuery = useQuery({
    queryKey: availableCommonsQueryKey,
    queryFn: () => participantsApi.getAvailableCommons(),
    enabled: session.status === "authenticated",
    retry: false,
  });
  const joinMutation = useMutation({
    mutationFn: async () => {
      const input = {
        homeCommonsId,
        displayName: displayName.trim(),
        bio: bio.trim() || null,
      };

      try {
        await participantsApi.joinCommons(input);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 409) {
          throw error;
        }

        const existingProfile = await participantsApi.getMyProfile();
        queryClient.setQueryData(participantProfileQueryKey, existingProfile);
        return;
      }

      const profile = await participantsApi.getMyProfile();
      queryClient.setQueryData(participantProfileQueryKey, profile);
    },
    onSuccess: () => router.replace("/" as Href),
  });
  const canJoin = homeCommonsId.length > 0 && displayName.trim().length > 0;

  async function signOut() {
    setSignOutError(null);

    try {
      await session.signOut();
    } catch {
      setSignOutError(
        "The securely stored session could not be removed. Please try again.",
      );
    }
  }

  return (
    <ScreenLayout
      description="Choose one existing local Commons and create your participant profile."
      eyebrow="Your home community"
      headerAction={
        <SignOutButton
          disabled={joinMutation.isPending}
          onPress={() => void signOut()}
        />
      }
      title="Join a Commons"
    >
      {signOutError ? <ErrorMessage message={signOutError} /> : null}
      {commonsQuery.isPending ? (
        <Text style={styles.status}>Loading available Commons…</Text>
      ) : null}
      {commonsQuery.isError ? (
        <>
          <ErrorMessage message={commonsQuery.error.message} />
          <PrimaryButton
            label="Try again"
            onPress={() => void commonsQuery.refetch()}
          />
        </>
      ) : null}
      {commonsQuery.isSuccess && commonsQuery.data.length === 0 ? (
        <View>
          <Text style={styles.status}>There are no Commons available to join yet.</Text>
          <PrimaryButton
            label="Check again"
            onPress={() => void commonsQuery.refetch()}
          />
        </View>
      ) : null}
      {commonsQuery.isSuccess && commonsQuery.data.length > 0 ? (
        <>
          <Field label="Home Commons">
            <View accessibilityRole="radiogroup" style={styles.commonsList}>
              {commonsQuery.data.map((commons) => {
                const selected = commons.id === homeCommonsId;

                return (
                  <Pressable
                    accessibilityLabel={commons.name}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    key={commons.id}
                    onPress={() => setHomeCommonsId(commons.id)}
                    style={({ pressed }) => [
                      styles.commonsOption,
                      selected && styles.selectedCommonsOption,
                      pressed && styles.pressedCommonsOption,
                    ]}
                  >
                    <View style={[styles.radio, selected && styles.selectedRadio]} />
                    <Text style={styles.commonsName}>{commons.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>
          <Field label="Display name">
            <TextInput
              accessibilityLabel="Display name"
              autoCapitalize="words"
              autoComplete="name"
              onChangeText={setDisplayName}
              style={formControlStyles.input}
              value={displayName}
            />
          </Field>
          <Field label="Short bio (optional)">
            <TextInput
              accessibilityLabel="Short bio (optional)"
              multiline
              onChangeText={setBio}
              style={[formControlStyles.input, formControlStyles.multilineInput]}
              value={bio}
            />
          </Field>
          {joinMutation.isError ? (
            <ErrorMessage message={joinMutation.error.message} />
          ) : null}
          <PrimaryButton
            disabled={!canJoin}
            label="Join this Commons"
            onPress={() => joinMutation.mutate()}
            pending={joinMutation.isPending}
            pendingLabel="Joining…"
          />
        </>
      ) : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  status: {
    marginBottom: 18,
    color: "#4c5f53",
    fontSize: 15,
    lineHeight: 22,
  },
  commonsList: { gap: 10 },
  commonsOption: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#b9c8be",
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  selectedCommonsOption: {
    borderColor: "#276544",
    backgroundColor: "#edf6f0",
  },
  pressedCommonsOption: { opacity: 0.72 },
  radio: {
    width: 18,
    height: 18,
    marginRight: 11,
    borderWidth: 2,
    borderColor: "#789083",
    borderRadius: 9,
  },
  selectedRadio: { borderWidth: 5, borderColor: "#276544" },
  commonsName: { color: "#17251d", fontSize: 16, fontWeight: "600" },
});

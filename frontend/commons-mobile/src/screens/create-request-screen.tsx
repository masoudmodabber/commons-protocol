import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput } from "react-native";
import {
  createRequestsApi,
  requestDetailQueryKey,
} from "../api/requests-api";
import { useSession } from "../auth/session-context";
import {
  ErrorMessage,
  Field,
  formControlStyles,
  PrimaryButton,
  TextButton,
} from "../components/form-controls";
import { ScreenLayout } from "../components/screen-layout";
import { useParticipantProfile } from "../participants/use-participant-profile";
import { StartupScreen } from "./startup-screen";

export function CreateRequestScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useSession();
  const profileQuery = useParticipantProfile();
  const requestsApi = useMemo(
    () => createRequestsApi(session.request),
    [session.request],
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const createMutation = useMutation({
    mutationFn: () => requestsApi.createRequest({ title, description }),
    onSuccess: (request) => {
      queryClient.setQueryData(requestDetailQueryKey(request.id), request);
      router.replace(`/requests/${request.id}` as Href);
    },
  });

  if (!profileQuery.data) {
    return <StartupScreen />;
  }

  const canCreate =
    title.trim().length > 0 && description.trim().length > 0;

  return (
    <ScreenLayout
      description={`Describe what you need from ${profileQuery.data.homeCommons.name}.`}
      eyebrow="Something you need"
      title="Create a Request"
    >
      <Text style={styles.guidance}>
        You do not need to say what you will provide in return; terms can be
        proposed voluntarily later.
      </Text>
      <Field label="Request title">
        <TextInput
          accessibilityLabel="Request title"
          editable={!createMutation.isPending}
          onChangeText={setTitle}
          style={formControlStyles.input}
          value={title}
        />
      </Field>
      <Field label="Description">
        <TextInput
          accessibilityLabel="Description"
          editable={!createMutation.isPending}
          multiline
          onChangeText={setDescription}
          style={[formControlStyles.input, formControlStyles.multilineInput]}
          value={description}
        />
      </Field>
      {createMutation.isError ? (
        <ErrorMessage message={createMutation.error.message} />
      ) : null}
      <PrimaryButton
        disabled={!canCreate}
        label="Create Request"
        onPress={() => createMutation.mutate()}
        pending={createMutation.isPending}
        pendingLabel="Creating…"
      />
      <TextButton
        disabled={createMutation.isPending}
        label="Back to profile"
        onPress={() => router.replace("/profile" as Href)}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  guidance: {
    marginBottom: 20,
    color: "#4c5f53",
    fontSize: 15,
    lineHeight: 22,
  },
});

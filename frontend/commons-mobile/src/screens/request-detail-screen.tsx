import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ApiError } from "../api/http-client";
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

export function RequestDetailScreen({ requestId }: { requestId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useSession();
  const requestsApi = useMemo(
    () => createRequestsApi(session.request),
    [session.request],
  );
  const requestQuery = useQuery({
    queryKey: requestDetailQueryKey(requestId),
    queryFn: () => requestsApi.getRequest(requestId),
    enabled: session.status === "authenticated",
    retry: false,
  });
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [detailError, setDetailError] = useState<string | null>(null);
  const editMutation = useMutation({
    mutationFn: () => requestsApi.editRequest(requestId, { title, description }),
    onSuccess: (request) => {
      queryClient.setQueryData(requestDetailQueryKey(request.id), request);
      setDetailError(null);
      setEditing(false);
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 409) {
        setDetailError(error.message);
        setEditing(false);
        await requestQuery.refetch();
      }
    },
  });

  if (requestQuery.isPending) {
    return (
      <ScreenLayout eyebrow="Your Request" title="Loading your Request…">
        <ActivityIndicator color="#276544" size="small" />
      </ScreenLayout>
    );
  }

  if (requestQuery.isError) {
    return (
      <ScreenLayout eyebrow="Your Request" title="Request unavailable">
        <ErrorMessage message={requestQuery.error.message} />
        <PrimaryButton
          label="Try again"
          onPress={() => void requestQuery.refetch()}
        />
        <TextButton
          label="Back to profile"
          onPress={() => router.replace("/profile" as Href)}
        />
      </ScreenLayout>
    );
  }

  const request = requestQuery.data;

  function beginEditing() {
    setTitle(request.title);
    setDescription(request.description);
    setDetailError(null);
    editMutation.reset();
    setEditing(true);
  }

  if (editing) {
    const canSave =
      title.trim().length > 0 && description.trim().length > 0;

    return (
      <ScreenLayout
        description="Correct or clarify what you need while this Request is Open."
        eyebrow="Open Request"
        title="Edit Request"
      >
        <Field label="Request title">
          <TextInput
            accessibilityLabel="Request title"
            editable={!editMutation.isPending}
            onChangeText={setTitle}
            style={formControlStyles.input}
            value={title}
          />
        </Field>
        <Field label="Description">
          <TextInput
            accessibilityLabel="Description"
            editable={!editMutation.isPending}
            multiline
            onChangeText={setDescription}
            style={[formControlStyles.input, formControlStyles.multilineInput]}
            value={description}
          />
        </Field>
        {editMutation.isError ? (
          <ErrorMessage message={editMutation.error.message} />
        ) : null}
        <PrimaryButton
          disabled={!canSave}
          label="Save changes"
          onPress={() => editMutation.mutate()}
          pending={editMutation.isPending}
          pendingLabel="Saving…"
        />
        <TextButton
          disabled={editMutation.isPending}
          label="Discard changes"
          onPress={() => setEditing(false)}
        />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      description="The Request you created in your Home Commons."
      eyebrow="Your Request"
      title={request.title}
    >
      {detailError ? <ErrorMessage message={detailError} /> : null}
      <Detail label="Status" value={request.status} />
      <Detail label="Description" value={request.description} />
      <Detail label="Requested by" value={request.creator.displayName} />
      <Detail label="Home Commons" value={request.homeCommons.name} />
      {request.status === "Open" && !detailError ? (
        <PrimaryButton label="Edit Request" onPress={beginEditing} />
      ) : null}
      <TextButton
        label="Back to profile"
        onPress={() => router.replace("/profile" as Href)}
      />
    </ScreenLayout>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
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
});

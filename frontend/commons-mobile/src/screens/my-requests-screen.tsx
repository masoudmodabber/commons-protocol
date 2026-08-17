import { useQuery } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { RequestDetails } from "../api/contracts";
import {
  createRequestsApi,
  participantRequestsQueryKey,
} from "../api/requests-api";
import { useSession } from "../auth/session-context";
import {
  ErrorMessage,
  PrimaryButton,
  TextButton,
} from "../components/form-controls";
import { ScreenLayout } from "../components/screen-layout";

export function MyRequestsScreen() {
  const router = useRouter();
  const session = useSession();
  const requestsApi = useMemo(
    () => createRequestsApi(session.request),
    [session.request],
  );
  const requestsQuery = useQuery({
    queryKey: participantRequestsQueryKey,
    queryFn: () => requestsApi.getMyRequests(),
    enabled: session.status === "authenticated",
    retry: false,
  });

  return (
    <ScreenLayout
      description="Requests you created in your Home Commons."
      eyebrow="Your Requests"
      title="My Requests"
    >
      {requestsQuery.isPending ? (
        <View style={styles.status}>
          <ActivityIndicator color="#276544" size="small" />
          <Text style={styles.statusText}>Loading your Requests…</Text>
        </View>
      ) : null}

      {requestsQuery.isError ? (
        <>
          <ErrorMessage message={requestsQuery.error.message} />
          <PrimaryButton
            label="Try again"
            onPress={() => void requestsQuery.refetch()}
          />
        </>
      ) : null}

      {requestsQuery.isSuccess && requestsQuery.data.length === 0 ? (
        <Text style={styles.empty}>You have not created any Requests yet.</Text>
      ) : null}

      {requestsQuery.isSuccess && requestsQuery.data.length > 0 ? (
        <View style={styles.list}>
          {requestsQuery.data.map((request) => (
            <MyRequestItem
              key={request.id}
              onPress={() => router.push(`/requests/${request.id}` as Href)}
              request={request}
            />
          ))}
        </View>
      ) : null}

      <TextButton
        label="Back to profile"
        onPress={() => router.replace("/profile" as Href)}
      />
    </ScreenLayout>
  );
}

function MyRequestItem({
  request,
  onPress,
}: {
  request: RequestDetails;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`View ${request.title}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.request, pressed && styles.pressedRequest]}
    >
      <View style={styles.requestHeading}>
        <Text style={styles.requestTitle}>{request.title}</Text>
        <Text style={styles.requestStatus}>{request.status}</Text>
      </View>
      <Text style={styles.description}>{request.description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
  },
  statusText: { color: "#52725f", fontSize: 15 },
  empty: {
    borderRadius: 12,
    backgroundColor: "#f2f5f1",
    padding: 18,
    color: "#52725f",
    fontSize: 16,
    lineHeight: 23,
  },
  list: { gap: 12 },
  request: {
    borderWidth: 1,
    borderColor: "#d5dfd8",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    padding: 16,
  },
  pressedRequest: { backgroundColor: "#f2f5f1" },
  requestHeading: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  requestTitle: {
    flex: 1,
    color: "#17251d",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  requestStatus: {
    borderRadius: 999,
    backgroundColor: "#e3eee7",
    paddingHorizontal: 9,
    paddingVertical: 4,
    color: "#276544",
    fontSize: 12,
    fontWeight: "700",
  },
  description: { marginTop: 8, color: "#4c5f53", fontSize: 15, lineHeight: 21 },
});

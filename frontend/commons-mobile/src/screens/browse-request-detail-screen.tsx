import { useQuery } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { ApiError } from "../api/http-client";
import {
  availableRequestDetailQueryKey,
  createRequestsApi,
} from "../api/requests-api";
import { useSession } from "../auth/session-context";
import {
  ErrorMessage,
  PrimaryButton,
  TextButton,
} from "../components/form-controls";
import { ScreenLayout } from "../components/screen-layout";

export function BrowseRequestDetailScreen({
  requestId,
}: {
  requestId: string;
}) {
  const router = useRouter();
  const session = useSession();
  const requestsApi = useMemo(
    () => createRequestsApi(session.request),
    [session.request],
  );
  const requestQuery = useQuery({
    queryKey: availableRequestDetailQueryKey(requestId),
    queryFn: () => requestsApi.getBrowseRequest(requestId),
    enabled: session.status === "authenticated",
    retry: false,
  });

  if (requestQuery.isPending) {
    return (
      <ScreenLayout eyebrow="Available Request" title="Loading Request…">
        <ActivityIndicator color="#276544" size="small" />
      </ScreenLayout>
    );
  }

  if (requestQuery.isError) {
    const message =
      requestQuery.error instanceof ApiError && requestQuery.error.status === 404
        ? "This Request is not available."
        : requestQuery.error.message;

    return (
      <ScreenLayout eyebrow="Available Request" title="Request unavailable">
        <ErrorMessage message={message} />
        <PrimaryButton
          label="Try again"
          onPress={() => void requestQuery.refetch()}
        />
        <TextButton
          label="Back to Available Requests"
          onPress={() => router.replace("/available-requests" as Href)}
        />
      </ScreenLayout>
    );
  }

  const request = requestQuery.data;

  return (
    <ScreenLayout
      description="An Open Request from another Participant in your Home Commons."
      eyebrow="Available Request"
      title={request.title}
    >
      <Detail label="Status" value={request.status} />
      <Detail label="Description" value={request.description} />
      <Detail label="Requested by" value={request.creator.displayName} />
      <Detail label="Home Commons" value={request.homeCommons.name} />
      <PrimaryButton
        label="Submit an Offer"
        onPress={() =>
          router.push(`/available-requests/${request.id}/offer` as Href)
        }
      />
      <TextButton
        label="Back to Available Requests"
        onPress={() => router.replace("/available-requests" as Href)}
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

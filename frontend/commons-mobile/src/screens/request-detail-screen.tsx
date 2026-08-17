import { useQuery } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import {
  createRequestsApi,
  requestDetailQueryKey,
} from "../api/requests-api";
import { useSession } from "../auth/session-context";
import { ErrorMessage, PrimaryButton, TextButton } from "../components/form-controls";
import { ScreenLayout } from "../components/screen-layout";

export function RequestDetailScreen({ requestId }: { requestId: string }) {
  const router = useRouter();
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

  return (
    <ScreenLayout
      description="The Request you created in your Home Commons."
      eyebrow="Your Request"
      title={request.title}
    >
      <Detail label="Status" value={request.status} />
      <Detail label="Description" value={request.description} />
      <Detail label="Requested by" value={request.creator.displayName} />
      <Detail label="Home Commons" value={request.homeCommons.name} />
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

import { useQuery } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { RequestDetails } from "../api/contracts";
import {
  availableRequestsSearchQueryKey,
  createRequestsApi,
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

export function BrowseRequestsScreen() {
  const router = useRouter();
  const session = useSession();
  const [searchText, setSearchText] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState<string>();
  const requestsApi = useMemo(
    () => createRequestsApi(session.request),
    [session.request],
  );
  const requestsQuery = useQuery({
    queryKey: availableRequestsSearchQueryKey(appliedSearchTerm),
    queryFn: () => requestsApi.browseRequests(appliedSearchTerm),
    enabled: session.status === "authenticated",
    retry: false,
  });

  function applySearch() {
    setAppliedSearchTerm(searchText.trim() ? searchText : undefined);
  }

  function clearSearch() {
    setSearchText("");
    setAppliedSearchTerm(undefined);
  }

  return (
    <ScreenLayout
      description="Open needs from other Participants in your Home Commons."
      eyebrow="Your Home Commons"
      title="Available Requests"
    >
      <View style={styles.search}>
        <Field label="Search Available Requests">
          <TextInput
            accessibilityLabel="Search Available Requests"
            onChangeText={setSearchText}
            onSubmitEditing={applySearch}
            returnKeyType="search"
            style={formControlStyles.input}
            value={searchText}
          />
        </Field>
        <PrimaryButton label="Search" onPress={applySearch} />
        {appliedSearchTerm !== undefined ? (
          <TextButton label="Clear search" onPress={clearSearch} />
        ) : null}
      </View>

      {requestsQuery.isPending ? (
        <View style={styles.status}>
          <ActivityIndicator color="#276544" size="small" />
          <Text style={styles.statusText}>
            {appliedSearchTerm
              ? "Searching Available Requests…"
              : "Loading Available Requests…"}
          </Text>
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
        <Text style={styles.empty}>
          {appliedSearchTerm
            ? "No Available Requests match your search."
            : "There are no Open Requests from other Participants in your Home Commons."}
        </Text>
      ) : null}

      {requestsQuery.isSuccess && requestsQuery.data.length > 0 ? (
        <View style={styles.list}>
          {requestsQuery.data.map((request) => (
            <AvailableRequestItem
              key={request.id}
              onPress={() =>
                router.push(`/available-requests/${request.id}` as Href)
              }
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

function AvailableRequestItem({
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
      style={({ pressed }) => [
        styles.request,
        pressed && styles.pressedRequest,
      ]}
    >
      <View style={styles.requestHeading}>
        <Text style={styles.requestTitle}>{request.title}</Text>
        <Text style={styles.requestStatus}>{request.status}</Text>
      </View>
      <Text style={styles.description}>{request.description}</Text>
      <Text style={styles.creator}>
        Requested by {request.creator.displayName}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  search: { marginBottom: 24 },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusText: { color: "#4c5f53", fontSize: 16 },
  empty: {
    borderRadius: 12,
    backgroundColor: "#f2f5f1",
    padding: 16,
    color: "#4c5f53",
    fontSize: 16,
    lineHeight: 24,
  },
  list: { gap: 12 },
  request: {
    borderWidth: 1,
    borderColor: "#d4ded7",
    borderRadius: 12,
    backgroundColor: "#f8faf8",
    padding: 16,
  },
  pressedRequest: { backgroundColor: "#edf3ef" },
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
    backgroundColor: "#dceae1",
    paddingHorizontal: 10,
    paddingVertical: 4,
    color: "#276544",
    fontSize: 12,
    fontWeight: "700",
  },
  description: {
    marginTop: 10,
    color: "#35483c",
    fontSize: 16,
    lineHeight: 23,
  },
  creator: {
    marginTop: 12,
    color: "#52725f",
    fontSize: 14,
    fontWeight: "600",
  },
});

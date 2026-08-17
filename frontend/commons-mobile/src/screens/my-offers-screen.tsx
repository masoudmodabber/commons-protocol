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
import type { OfferDetails } from "../api/contracts";
import { ApiError } from "../api/http-client";
import { createOffersApi, participantOffersQueryKey } from "../api/offers-api";
import { useSession } from "../auth/session-context";
import {
  ErrorMessage,
  PrimaryButton,
  TextButton,
} from "../components/form-controls";
import { ScreenLayout } from "../components/screen-layout";

export function MyOffersScreen() {
  const router = useRouter();
  const session = useSession();
  const offersApi = useMemo(
    () => createOffersApi(session.request),
    [session.request],
  );
  const offersQuery = useQuery({
    queryKey: participantOffersQueryKey,
    queryFn: () => offersApi.getMyOffers(),
    enabled: session.status === "authenticated",
    retry: false,
  });

  return (
    <ScreenLayout
      description="The proposals you have submitted in response to Requests."
      eyebrow="Your proposals"
      title="My Offers"
    >
      {offersQuery.isPending ? (
        <View style={styles.status}>
          <ActivityIndicator color="#276544" size="small" />
          <Text style={styles.statusText}>Loading your Offers…</Text>
        </View>
      ) : null}

      {offersQuery.isError ? (
        <>
          <ErrorMessage
            message={
              offersQuery.error instanceof ApiError &&
              offersQuery.error.status === 404
                ? "Your Offers are not available."
                : offersQuery.error.message
            }
          />
          <PrimaryButton
            label="Try again"
            onPress={() => void offersQuery.refetch()}
          />
        </>
      ) : null}

      {offersQuery.isSuccess && offersQuery.data.length === 0 ? (
        <Text style={styles.empty}>You have not submitted any Offers yet.</Text>
      ) : null}

      {offersQuery.isSuccess && offersQuery.data.length > 0 ? (
        <View style={styles.list}>
          {offersQuery.data.map((offer) => (
            <MyOfferItem
              key={offer.id}
              offer={offer}
              onPress={() => router.push(`/offers/${offer.id}` as Href)}
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

function MyOfferItem({
  offer,
  onPress,
}: {
  offer: OfferDetails;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`View Offer for ${offer.request.title}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.offer, pressed && styles.pressedOffer]}
    >
      <View style={styles.offerHeading}>
        <Text style={styles.offerTitle}>{offer.request.title}</Text>
        <Text style={styles.offerStatus}>{offer.status}</Text>
      </View>
      <Text style={styles.creator}>
        Request created by {offer.request.creator.displayName}
      </Text>
      {offer.commonsAccountingUnits !== null ? (
        <Text style={styles.terms}>
          <Text style={styles.termLabel}>Commons accounting units requested: </Text>
          {offer.commonsAccountingUnits.toLocaleString("en-US")}
        </Text>
      ) : null}
      {offer.requestedContributions.map((contribution) => (
        <Text key={contribution.capabilityId} style={styles.terms}>
          <Text style={styles.termLabel}>
            {contribution.capabilityTextSnapshot}:{" "}
          </Text>
          {contribution.description}
        </Text>
      ))}
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
  offer: {
    borderWidth: 1,
    borderColor: "#d5dfd8",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    padding: 16,
  },
  pressedOffer: { backgroundColor: "#f2f5f1" },
  offerHeading: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  offerTitle: {
    flex: 1,
    color: "#17251d",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  offerStatus: {
    borderRadius: 999,
    backgroundColor: "#e3eee7",
    paddingHorizontal: 9,
    paddingVertical: 4,
    color: "#276544",
    fontSize: 12,
    fontWeight: "700",
  },
  creator: { marginTop: 7, color: "#52725f", fontSize: 14 },
  terms: { marginTop: 10, color: "#263b2f", fontSize: 15, lineHeight: 21 },
  termLabel: { fontWeight: "700" },
});

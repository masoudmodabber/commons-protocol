import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { useMemo, useRef } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { OfferDetails } from "../api/contracts";
import {
  agreementDetailQueryKey,
  participantAgreementsQueryKey,
} from "../api/agreements-api";
import { ApiError } from "../api/http-client";
import {
  createOffersApi,
  requestOffersQueryKey,
} from "../api/offers-api";
import {
  participantRequestsQueryKey,
  requestDetailQueryKey,
} from "../api/requests-api";
import { useSession } from "../auth/session-context";
import {
  ErrorMessage,
  PrimaryButton,
  TextButton,
} from "../components/form-controls";
import { ScreenLayout } from "../components/screen-layout";

export function RequestOffersScreen({ requestId }: { requestId: string }) {
  const router = useRouter();
  const session = useSession();
  const queryClient = useQueryClient();
  const acceptanceInFlight = useRef(false);
  const offersApi = useMemo(
    () => createOffersApi(session.request),
    [session.request],
  );
  const offersQuery = useQuery({
    queryKey: requestOffersQueryKey(requestId),
    queryFn: () => offersApi.getRequestOffers(requestId),
    enabled: session.status === "authenticated",
    retry: false,
  });
  const acceptMutation = useMutation({
    mutationFn: (offerId: string) => offersApi.acceptOffer(offerId),
    onSuccess: async (agreement) => {
      queryClient.setQueryData(
        agreementDetailQueryKey(agreement.id),
        agreement,
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: requestOffersQueryKey(requestId),
          exact: true,
        }),
        queryClient.invalidateQueries({
          queryKey: requestDetailQueryKey(requestId),
          exact: true,
        }),
        queryClient.invalidateQueries({
          queryKey: participantRequestsQueryKey,
          exact: true,
        }),
        queryClient.invalidateQueries({
          queryKey: participantAgreementsQueryKey,
          exact: true,
        }),
      ]);
      router.replace(`/agreements/${agreement.id}` as Href);
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 409) {
        await Promise.all([
          offersQuery.refetch(),
          queryClient.invalidateQueries({
            queryKey: requestDetailQueryKey(requestId),
            exact: true,
          }),
          queryClient.invalidateQueries({
            queryKey: participantRequestsQueryKey,
            exact: true,
          }),
        ]);
      }
    },
    onSettled: () => {
      acceptanceInFlight.current = false;
    },
  });

  function acceptOffer(offerId: string) {
    if (acceptMutation.isPending || acceptanceInFlight.current) {
      return;
    }

    acceptanceInFlight.current = true;
    acceptMutation.mutate(offerId);
  }

  if (offersQuery.isPending) {
    return (
      <ScreenLayout eyebrow="Active proposals" title="Loading Offers…">
        <ActivityIndicator color="#276544" size="small" />
      </ScreenLayout>
    );
  }

  if (offersQuery.isError) {
    const message =
      offersQuery.error instanceof ApiError && offersQuery.error.status === 404
        ? "This Request is not available."
        : offersQuery.error.message;

    return (
      <ScreenLayout eyebrow="Active proposals" title="Offers unavailable">
        <ErrorMessage message={message} />
        <PrimaryButton
          label="Try again"
          onPress={() => void offersQuery.refetch()}
        />
        <TextButton
          label="Back to Request"
          onPress={() => router.replace(`/requests/${requestId}` as Href)}
        />
      </ScreenLayout>
    );
  }

  const comparison = offersQuery.data;

  return (
    <ScreenLayout
      description={comparison.request.description}
      eyebrow="Active proposals received"
      title={`Offers for ${comparison.request.title}`}
    >
      <Text style={styles.guidance}>
        Review each Participant's proposed terms. Offers may use different forms
        of return and are not ranked or reduced to a single score.
      </Text>
      {comparison.offers.length === 0 ? (
        <Text style={styles.empty}>This Request has no Active Offers.</Text>
      ) : (
        <View style={styles.list}>
          {comparison.offers.map((offer) => (
            <ReceivedOffer
              accepting={
                acceptMutation.isPending
                && acceptMutation.variables === offer.id
              }
              disabled={acceptMutation.isPending}
              key={offer.id}
              offer={offer}
              onAccept={() => acceptOffer(offer.id)}
            />
          ))}
        </View>
      )}
      {acceptMutation.isError ? (
        <ErrorMessage
          message={
            acceptMutation.error instanceof ApiError
              && acceptMutation.error.status === 404
              ? "This Offer is not available."
              : acceptMutation.error.message
          }
        />
      ) : null}
      <TextButton
        label="Back to Request"
        onPress={() => router.replace(`/requests/${requestId}` as Href)}
      />
    </ScreenLayout>
  );
}

function ReceivedOffer({
  accepting,
  disabled,
  offer,
  onAccept,
}: {
  accepting: boolean;
  disabled: boolean;
  offer: OfferDetails;
  onAccept: () => void;
}) {
  return (
    <View style={styles.offer}>
      <View style={styles.offerHeading}>
        <Text accessibilityRole="header" style={styles.offerCreator}>
          {offer.creator.displayName}
        </Text>
        <Text style={styles.offerStatus}>{offer.status}</Text>
      </View>
      {offer.commonsAccountingUnits !== null ? (
        <View style={styles.term}>
          <Text style={styles.termLabel}>Commons accounting units requested</Text>
          <Text style={styles.termValue}>
            {offer.commonsAccountingUnits.toLocaleString("en-US")}
          </Text>
        </View>
      ) : null}
      {offer.requestedContributions.length > 0 ? (
        <View style={styles.term}>
          <Text style={styles.termLabel}>Requested contributions</Text>
          {offer.requestedContributions.map((contribution) => (
            <View key={contribution.capabilityId} style={styles.contribution}>
              <Text style={styles.contributionTitle}>
                {contribution.capabilityTextSnapshot}
              </Text>
              <Text style={styles.termValue}>{contribution.description}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={styles.offerAction}>
        <PrimaryButton
          disabled={disabled}
          label="Accept Offer"
          onPress={onAccept}
          pending={accepting}
          pendingLabel="Accepting…"
          testID={`accept-offer-from-${offer.creator.displayName}`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  guidance: {
    marginBottom: 18,
    borderRadius: 12,
    backgroundColor: "#f2f5f1",
    padding: 16,
    color: "#4c5f53",
    fontSize: 15,
    lineHeight: 22,
  },
  empty: {
    borderRadius: 12,
    backgroundColor: "#f2f5f1",
    padding: 18,
    color: "#52725f",
    fontSize: 16,
    lineHeight: 23,
  },
  list: { gap: 14 },
  offer: {
    borderWidth: 1,
    borderColor: "#d5dfd8",
    borderRadius: 12,
    padding: 16,
  },
  offerHeading: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  offerCreator: {
    flex: 1,
    color: "#17251d",
    fontSize: 19,
    fontWeight: "700",
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
  term: { marginTop: 14 },
  termLabel: { color: "#263b2f", fontSize: 14, fontWeight: "700" },
  termValue: { marginTop: 4, color: "#263b2f", fontSize: 15, lineHeight: 21 },
  contribution: { marginTop: 10 },
  contributionTitle: { color: "#276544", fontSize: 15, fontWeight: "700" },
  offerAction: { marginTop: 16 },
});

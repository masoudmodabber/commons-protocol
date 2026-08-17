import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { useMemo, useRef } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { OfferDetails } from "../api/contracts";
import { ApiError } from "../api/http-client";
import {
  createOffersApi,
  offerDetailQueryKey,
  participantOffersQueryKey,
} from "../api/offers-api";
import { useSession } from "../auth/session-context";
import {
  ErrorMessage,
  PrimaryButton,
  TextButton,
} from "../components/form-controls";
import { ScreenLayout } from "../components/screen-layout";

export function OfferDetailScreen({ offerId }: { offerId: string }) {
  const router = useRouter();
  const session = useSession();
  const queryClient = useQueryClient();
  const withdrawalInFlight = useRef(false);
  const offersApi = useMemo(
    () => createOffersApi(session.request),
    [session.request],
  );
  const offerQuery = useQuery({
    queryKey: offerDetailQueryKey(offerId),
    queryFn: () => offersApi.getOffer(offerId),
    enabled: session.status === "authenticated",
    retry: false,
  });
  const withdrawMutation = useMutation({
    mutationFn: () => offersApi.withdrawOffer(offerId),
    onSuccess: (offer) => {
      queryClient.setQueryData(offerDetailQueryKey(offer.id), offer);
      queryClient.setQueryData<OfferDetails[]>(
        participantOffersQueryKey,
        (current) =>
          current?.map((existing) =>
            existing.id === offer.id ? offer : existing,
          ),
      );
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 409) {
        await offerQuery.refetch();
        await queryClient.invalidateQueries({
          queryKey: participantOffersQueryKey,
          exact: true,
        });
      }
    },
    onSettled: () => {
      withdrawalInFlight.current = false;
    },
  });

  function withdrawOffer() {
    if (withdrawMutation.isPending || withdrawalInFlight.current) {
      return;
    }

    withdrawalInFlight.current = true;
    withdrawMutation.mutate();
  }

  if (offerQuery.isPending) {
    return (
      <ScreenLayout eyebrow="My Offer" title="Loading Offer…">
        <ActivityIndicator color="#276544" size="small" />
      </ScreenLayout>
    );
  }

  if (offerQuery.isError) {
    const message =
      offerQuery.error instanceof ApiError && offerQuery.error.status === 404
        ? "This Offer is not available."
        : offerQuery.error.message;

    return (
      <ScreenLayout eyebrow="My Offer" title="Offer unavailable">
        <ErrorMessage message={message} />
        <PrimaryButton
          label="Try again"
          onPress={() => void offerQuery.refetch()}
        />
        <TextButton
          label="Back to My Offers"
          onPress={() => router.replace("/offers" as Href)}
        />
      </ScreenLayout>
    );
  }

  const offer = offerQuery.data;
  const withdrawalError = withdrawMutation.error;
  const withdrawalErrorMessage =
    withdrawalError instanceof ApiError && withdrawalError.status === 404
      ? "This Offer is not available."
      : withdrawalError?.message;

  return (
    <ScreenLayout
      description="The terms below are the authoritative Offer currently stored by Commons Market."
      eyebrow="My Offer"
      title={`Offer for ${offer.request.title}`}
    >
      <Detail label="Status" value={offer.status} />
      <Detail label="Request" value={offer.request.description} />
      <Detail label="Requested by" value={offer.request.creator.displayName} />
      <Detail label="Home Commons" value={offer.request.homeCommons.name} />
      {offer.commonsAccountingUnits !== null ? (
        <Detail
          label="Commons accounting units"
          value={offer.commonsAccountingUnits.toLocaleString("en-US")}
        />
      ) : null}
      {offer.requestedContributions.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Capability contributions</Text>
          {offer.requestedContributions.map((contribution) => (
            <View key={contribution.capabilityId} style={styles.contribution}>
              <Text style={styles.contributionTitle}>
                {contribution.capabilityTextSnapshot}
              </Text>
              <Text style={styles.value}>{contribution.description}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {withdrawalErrorMessage ? (
        <ErrorMessage message={withdrawalErrorMessage} />
      ) : null}
      {offer.status === "Active" ? (
        <PrimaryButton
          label="Withdraw Offer"
          onPress={withdrawOffer}
          pending={withdrawMutation.isPending}
          pendingLabel="Withdrawing…"
          tone="danger"
        />
      ) : null}
      {offer.agreementId ? (
        <PrimaryButton
          label="View Agreement"
          onPress={() =>
            router.push(`/agreements/${offer.agreementId}` as Href)
          }
        />
      ) : null}
      <TextButton
        label="Back to My Offers"
        onPress={() => router.replace("/offers" as Href)}
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
  section: { marginTop: 4 },
  sectionTitle: {
    marginBottom: 10,
    color: "#263b2f",
    fontSize: 17,
    fontWeight: "700",
  },
  contribution: {
    marginBottom: 14,
    borderRadius: 12,
    backgroundColor: "#f2f5f1",
    padding: 16,
  },
  contributionTitle: {
    marginBottom: 5,
    color: "#276544",
    fontSize: 16,
    fontWeight: "700",
  },
});

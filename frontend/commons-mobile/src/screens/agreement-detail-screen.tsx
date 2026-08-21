import { useQuery } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import {
  agreementDetailQueryKey,
  createAgreementsApi,
} from "../api/agreements-api";
import { ApiError } from "../api/http-client";
import { useSession } from "../auth/session-context";
import {
  ErrorMessage,
  PrimaryButton,
  TextButton,
} from "../components/form-controls";
import { ScreenLayout } from "../components/screen-layout";
import { useParticipantProfile } from "../participants/use-participant-profile";

export function AgreementDetailScreen({
  agreementId,
}: {
  agreementId: string;
}) {
  const router = useRouter();
  const session = useSession();
  const profileQuery = useParticipantProfile();
  const agreementsApi = useMemo(
    () => createAgreementsApi(session.request),
    [session.request],
  );
  const agreementQuery = useQuery({
    queryKey: agreementDetailQueryKey(agreementId),
    queryFn: () => agreementsApi.getAgreement(agreementId),
    enabled: session.status === "authenticated",
    retry: false,
  });

  if (agreementQuery.isPending) {
    return (
      <ScreenLayout eyebrow="Agreement" title="Loading Agreement…">
        <ActivityIndicator color="#276544" size="small" />
      </ScreenLayout>
    );
  }

  if (agreementQuery.isError) {
    const message =
      agreementQuery.error instanceof ApiError
      && agreementQuery.error.status === 404
        ? "This Agreement is not available."
        : agreementQuery.error.message;

    return (
      <ScreenLayout eyebrow="Agreement" title="Agreement unavailable">
        <ErrorMessage message={message} />
        <PrimaryButton
          label="Try again"
          onPress={() => void agreementQuery.refetch()}
        />
        <TextButton
          label="Back to My Agreements"
          onPress={() => router.replace("/agreements" as Href)}
        />
      </ScreenLayout>
    );
  }

  const agreement = agreementQuery.data;
  const participantId = profileQuery.data?.id;

  return (
    <ScreenLayout
      description={agreement.request.description}
      eyebrow="Mutual commitment"
      title={`Agreement for ${agreement.request.title}`}
    >
      <Text style={styles.guidance}>
        These are the Request and accepted Offer terms recorded for both
        Participants.
      </Text>
      <Detail label="Request status" value={agreement.request.status} />
      <Detail
        label="Accepted Offer status"
        value={agreement.acceptedOffer.status}
      />
      <Detail
        label="Request creator"
        value={agreement.request.creator.displayName}
      />
      <Detail
        label="Offer creator"
        value={agreement.acceptedOffer.creator.displayName}
      />
      {agreement.commonsAccountingUnits !== null ? (
        <Detail
          label="Commons accounting units"
          value={agreement.commonsAccountingUnits.toLocaleString("en-US")}
        />
      ) : null}
      {agreement.requestedContributions.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requested contributions</Text>
          {agreement.requestedContributions.map((contribution) => (
            <View key={contribution.capabilityId} style={styles.contribution}>
              <Text style={styles.contributionTitle}>
                {contribution.capabilityTextSnapshot}
              </Text>
              <Text style={styles.value}>{contribution.description}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={styles.actions}>
        {participantId === agreement.request.creator.participantId ? (
          <PrimaryButton
            label="View matched Request"
            onPress={() =>
              router.push(`/requests/${agreement.request.id}` as Href)
            }
          />
        ) : null}
        {participantId === agreement.acceptedOffer.creator.participantId ? (
          <PrimaryButton
            label="View accepted Offer"
            onPress={() =>
              router.push(`/offers/${agreement.acceptedOffer.id}` as Href)
            }
          />
        ) : null}
      </View>
      <TextButton
        label="Back to My Agreements"
        onPress={() => router.replace("/agreements" as Href)}
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
  guidance: {
    marginBottom: 18,
    borderRadius: 12,
    backgroundColor: "#f2f5f1",
    padding: 16,
    color: "#4c5f53",
    fontSize: 15,
    lineHeight: 22,
  },
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
  actions: { gap: 10 },
});

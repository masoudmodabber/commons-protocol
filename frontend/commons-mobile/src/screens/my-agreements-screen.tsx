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
import {
  createAgreementsApi,
  participantAgreementsQueryKey,
} from "../api/agreements-api";
import type { AgreementDetails } from "../api/contracts";
import { ApiError } from "../api/http-client";
import { useSession } from "../auth/session-context";
import {
  ErrorMessage,
  PrimaryButton,
  TextButton,
} from "../components/form-controls";
import { ScreenLayout } from "../components/screen-layout";
import { useParticipantProfile } from "../participants/use-participant-profile";

export function MyAgreementsScreen() {
  const router = useRouter();
  const session = useSession();
  const profileQuery = useParticipantProfile();
  const agreementsApi = useMemo(
    () => createAgreementsApi(session.request),
    [session.request],
  );
  const agreementsQuery = useQuery({
    queryKey: participantAgreementsQueryKey,
    queryFn: () => agreementsApi.getMyAgreements(),
    enabled: session.status === "authenticated",
    retry: false,
  });
  const participantId = profileQuery.data?.id;

  return (
    <ScreenLayout
      description="Mutual commitments created from Offers that were accepted."
      eyebrow="Your mutual commitments"
      title="My Agreements"
    >
      {agreementsQuery.isPending ? (
        <View style={styles.status}>
          <ActivityIndicator color="#276544" size="small" />
          <Text style={styles.statusText}>Loading your Agreements…</Text>
        </View>
      ) : null}

      {agreementsQuery.isError ? (
        <>
          <ErrorMessage
            message={
              agreementsQuery.error instanceof ApiError
              && agreementsQuery.error.status === 404
                ? "Your Agreements are not available."
                : agreementsQuery.error.message
            }
          />
          <PrimaryButton
            label="Try again"
            onPress={() => void agreementsQuery.refetch()}
          />
        </>
      ) : null}

      {agreementsQuery.isSuccess && agreementsQuery.data.length === 0 ? (
        <Text style={styles.empty}>You are not part of any Agreements yet.</Text>
      ) : null}

      {agreementsQuery.isSuccess
      && agreementsQuery.data.length > 0
      && participantId ? (
        <View style={styles.list}>
          {agreementsQuery.data.map((agreement) => (
            <AgreementItem
              agreement={agreement}
              key={agreement.id}
              participantId={participantId}
              onPress={() =>
                router.push(`/agreements/${agreement.id}` as Href)
              }
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

function AgreementItem({
  agreement,
  participantId,
  onPress,
}: {
  agreement: AgreementDetails;
  participantId: string;
  onPress: () => void;
}) {
  const otherParticipant =
    participantId === agreement.request.creator.participantId
      ? agreement.acceptedOffer.creator
      : agreement.request.creator;

  return (
    <Pressable
      accessibilityLabel={`View Agreement for ${agreement.request.title}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.agreement, pressed && styles.pressedAgreement]}
    >
      <Text style={styles.title}>{agreement.request.title}</Text>
      <Text style={styles.otherParticipant}>With {otherParticipant.displayName}</Text>
      <Text style={styles.termsHeading}>Accepted return terms</Text>
      {agreement.commonsAccountingUnits !== null ? (
        <Text style={styles.term}>
          {agreement.commonsAccountingUnits.toLocaleString("en-US")} Commons accounting units
        </Text>
      ) : null}
      {agreement.requestedContributions.map((contribution) => (
        <Text key={contribution.capabilityId} style={styles.term}>
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
  agreement: {
    borderWidth: 1,
    borderColor: "#d5dfd8",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    padding: 16,
  },
  pressedAgreement: { backgroundColor: "#f2f5f1" },
  title: {
    color: "#17251d",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  otherParticipant: { marginTop: 7, color: "#52725f", fontSize: 14 },
  termsHeading: {
    marginTop: 12,
    color: "#263b2f",
    fontSize: 15,
    fontWeight: "700",
  },
  term: { marginTop: 6, color: "#263b2f", fontSize: 15, lineHeight: 21 },
  termLabel: { fontWeight: "700" },
});

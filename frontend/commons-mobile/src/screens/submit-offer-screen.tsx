import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ApiError } from "../api/http-client";
import {
  createOffersApi,
  maximumCommonsAccountingUnits,
  offerDetailQueryKey,
  offerSubmissionOptionsQueryKey,
} from "../api/offers-api";
import { useSession } from "../auth/session-context";
import {
  ErrorMessage,
  Field,
  formControlStyles,
  PrimaryButton,
  TextButton,
} from "../components/form-controls";
import { ScreenLayout } from "../components/screen-layout";

export function parseCommonsAccountingUnits(value: string):
  | { valid: true; value: number | null }
  | { valid: false } {
  if (value === "") {
    return { valid: true, value: null };
  }

  if (!/^\d+$/.test(value)) {
    return { valid: false };
  }

  const parsed = Number(value);
  if (
    !Number.isSafeInteger(parsed) ||
    parsed <= 0 ||
    parsed > maximumCommonsAccountingUnits
  ) {
    return { valid: false };
  }

  return { valid: true, value: parsed };
}

export function SubmitOfferScreen({ requestId }: { requestId: string }) {
  const router = useRouter();
  const session = useSession();
  const queryClient = useQueryClient();
  const offersApi = useMemo(
    () => createOffersApi(session.request),
    [session.request],
  );
  const [accountingUnits, setAccountingUnits] = useState("");
  const [contributionDescriptions, setContributionDescriptions] = useState<
    Record<string, string>
  >({});
  const submitInFlight = useRef(false);

  const optionsQuery = useQuery({
    queryKey: offerSubmissionOptionsQueryKey(requestId),
    queryFn: () => offersApi.getSubmissionOptions(requestId),
    enabled: session.status === "authenticated",
    retry: false,
  });
  const submitMutation = useMutation({
    mutationFn: (input: Parameters<typeof offersApi.submitOffer>[1]) =>
      offersApi.submitOffer(requestId, input),
    onSuccess: (offer) => {
      queryClient.setQueryData(offerDetailQueryKey(offer.id), offer);
      router.replace(`/offers/${offer.id}` as Href);
    },
    onSettled: () => {
      submitInFlight.current = false;
    },
  });

  if (optionsQuery.isPending) {
    return (
      <ScreenLayout eyebrow="Submit Offer" title="Loading Offer options…">
        <ActivityIndicator color="#276544" size="small" />
      </ScreenLayout>
    );
  }

  if (optionsQuery.isError) {
    const message =
      optionsQuery.error instanceof ApiError && optionsQuery.error.status === 404
        ? "This Request is not available for an Offer."
        : optionsQuery.error.message;

    return (
      <ScreenLayout eyebrow="Submit Offer" title="Offer options unavailable">
        <ErrorMessage message={message} />
        <PrimaryButton
          label="Try again"
          onPress={() => void optionsQuery.refetch()}
        />
        <TextButton
          label="Back to Request"
          onPress={() =>
            router.replace(`/available-requests/${requestId}` as Href)
          }
        />
      </ScreenLayout>
    );
  }

  const options = optionsQuery.data;
  const parsedUnits = parseCommonsAccountingUnits(accountingUnits);
  const selectedCapabilities = options.capabilities.filter(
    (capability) => contributionDescriptions[capability.id] !== undefined,
  );
  const contributionsAreValid = selectedCapabilities.every(
    (capability) =>
      contributionDescriptions[capability.id]?.trim().length > 0,
  );
  const hasReturn =
    (parsedUnits.valid && parsedUnits.value !== null) ||
    selectedCapabilities.length > 0;
  const formIsValid = parsedUnits.valid && contributionsAreValid && hasReturn;
  const pending = submitMutation.isPending;

  function toggleCapability(capabilityId: string) {
    setContributionDescriptions((current) => {
      if (current[capabilityId] !== undefined) {
        const next = { ...current };
        delete next[capabilityId];
        return next;
      }

      return { ...current, [capabilityId]: "" };
    });
  }

  function submit() {
    if (
      !formIsValid ||
      !parsedUnits.valid ||
      pending ||
      submitInFlight.current
    ) {
      return;
    }

    submitInFlight.current = true;
    submitMutation.mutate({
      commonsAccountingUnits: parsedUnits.value,
      requestedContributions: selectedCapabilities.map((capability) => ({
        capabilityId: capability.id,
        description: contributionDescriptions[capability.id],
      })),
    });
  }

  const submitError = submitMutation.error;
  const submitErrorMessage =
    submitError instanceof ApiError && submitError.status === 404
      ? "This Request is no longer available for an Offer."
      : submitError?.message;

  return (
    <ScreenLayout
      description="Choose one or both forms of return. The Request owner will decide whether to accept the Offer."
      eyebrow="Submit Offer"
      title={options.request.title}
    >
      <View style={styles.requestSummary}>
        <Text style={styles.summaryLabel}>Request</Text>
        <Text style={styles.summaryText}>{options.request.description}</Text>
        <Text style={styles.summaryMeta}>
          Requested by {options.request.creator.displayName}
        </Text>
      </View>

      <Field label="Commons accounting units (optional)">
        <TextInput
          accessibilityLabel="Commons accounting units"
          editable={!pending}
          keyboardType="number-pad"
          onChangeText={setAccountingUnits}
          placeholder="For example, 30"
          style={formControlStyles.input}
          value={accountingUnits}
        />
      </Field>
      {!parsedUnits.valid ? (
        <ErrorMessage
          message={`Enter a whole number from 1 to ${maximumCommonsAccountingUnits.toLocaleString("en-US")}.`}
        />
      ) : null}

      <Text style={styles.sectionTitle}>Capability contributions (optional)</Text>
      {options.capabilities.length === 0 ? (
        <Text style={styles.emptyText}>
          The Request owner has no Capabilities available for an Offer.
        </Text>
      ) : null}
      {options.capabilities.map((capability) => {
        const selected = contributionDescriptions[capability.id] !== undefined;
        return (
          <View key={capability.id} style={styles.capabilityCard}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected, disabled: pending }}
              disabled={pending}
              onPress={() => toggleCapability(capability.id)}
              style={styles.checkboxRow}
            >
              <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                {selected ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <Text style={styles.capabilityText}>{capability.text}</Text>
            </Pressable>
            {selected ? (
              <Field label={`Contribution description for ${capability.text}`}>
                <TextInput
                  accessibilityLabel={`Contribution description for ${capability.text}`}
                  editable={!pending}
                  multiline
                  onChangeText={(description) =>
                    setContributionDescriptions((current) => ({
                      ...current,
                      [capability.id]: description,
                    }))
                  }
                  placeholder="Describe what you are requesting"
                  style={[
                    formControlStyles.input,
                    formControlStyles.multilineInput,
                  ]}
                  value={contributionDescriptions[capability.id]}
                />
              </Field>
            ) : null}
          </View>
        );
      })}

      {!hasReturn ? (
        <Text style={styles.guidance}>
          Include accounting units, a Capability contribution, or both.
        </Text>
      ) : null}
      {submitErrorMessage ? <ErrorMessage message={submitErrorMessage} /> : null}
      <PrimaryButton
        disabled={!formIsValid}
        label="Submit Offer"
        onPress={submit}
        pending={pending}
        pendingLabel="Submitting Offer…"
      />
      <TextButton
        disabled={pending}
        label="Back to Request"
        onPress={() =>
          router.replace(`/available-requests/${requestId}` as Href)
        }
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  requestSummary: {
    marginBottom: 22,
    borderRadius: 12,
    backgroundColor: "#f2f5f1",
    padding: 16,
  },
  summaryLabel: {
    marginBottom: 6,
    color: "#52725f",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  summaryText: { color: "#17251d", fontSize: 16, lineHeight: 23 },
  summaryMeta: { marginTop: 8, color: "#52725f", fontSize: 14 },
  sectionTitle: {
    marginBottom: 10,
    color: "#263b2f",
    fontSize: 17,
    fontWeight: "700",
  },
  emptyText: { marginBottom: 18, color: "#52725f", lineHeight: 21 },
  capabilityCard: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#d5dfd8",
    borderRadius: 12,
    padding: 14,
  },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  checkbox: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#789183",
    borderRadius: 5,
  },
  checkboxSelected: { borderColor: "#276544", backgroundColor: "#276544" },
  checkmark: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  capabilityText: { flex: 1, color: "#17251d", fontSize: 16 },
  guidance: { marginBottom: 14, color: "#52725f", lineHeight: 20 },
});

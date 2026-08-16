import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  createParticipantsApi,
  participantCapabilitiesQueryKey,
} from "../api/participants-api";
import { useSession } from "../auth/session-context";
import {
  ErrorMessage,
  Field,
  formControlStyles,
  PrimaryButton,
} from "../components/form-controls";

export function CapabilitiesSection() {
  const session = useSession();
  const queryClient = useQueryClient();
  const participantsApi = useMemo(
    () => createParticipantsApi(session.request),
    [session.request],
  );
  const [text, setText] = useState("");

  const capabilitiesQuery = useQuery({
    queryKey: participantCapabilitiesQueryKey,
    queryFn: () => participantsApi.getMyCapabilities(),
    enabled: session.status === "authenticated",
    retry: false,
  });
  const addMutation = useMutation({
    mutationFn: () => participantsApi.addCapability(text),
    onSuccess: async () => {
      setText("");
      await queryClient.invalidateQueries({
        queryKey: participantCapabilitiesQueryKey,
      });
    },
  });
  const removeMutation = useMutation({
    mutationFn: (capabilityId: string) =>
      participantsApi.removeCapability(capabilityId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: participantCapabilitiesQueryKey,
      });
    },
  });
  const controlsDisabled = addMutation.isPending || removeMutation.isPending;

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.heading}>
        Capabilities
      </Text>
      <Text style={styles.guidance}>
        Describe what you may be able to provide. A Capability is not an Offer,
        current availability, a price, a quantity, or an obligation.
      </Text>

      {capabilitiesQuery.isPending ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#276544" size="small" />
          <Text style={styles.status}>Loading Capabilities…</Text>
        </View>
      ) : null}

      {capabilitiesQuery.isError ? (
        <View>
          <ErrorMessage message={capabilitiesQuery.error.message} />
          <PrimaryButton
            label="Try loading Capabilities again"
            onPress={() => void capabilitiesQuery.refetch()}
          />
        </View>
      ) : null}

      {capabilitiesQuery.isSuccess ? (
        <>
          {capabilitiesQuery.data.length === 0 ? (
            <Text style={styles.empty}>You have not listed any Capabilities yet.</Text>
          ) : (
            <View style={styles.list}>
              {capabilitiesQuery.data.map((capability) => (
                <View key={capability.id} style={styles.capability}>
                  <Text style={styles.capabilityText}>{capability.text}</Text>
                  <Pressable
                    accessibilityLabel={`Remove ${capability.text}`}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: controlsDisabled }}
                    disabled={controlsDisabled}
                    onPress={() => removeMutation.mutate(capability.id)}
                    style={({ pressed }) => [
                      styles.removeButton,
                      controlsDisabled && styles.disabledButton,
                      pressed && !controlsDisabled && styles.pressedButton,
                    ]}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <Field label="Add a Capability">
            <TextInput
              accessibilityLabel="Add a Capability"
              editable={!controlsDisabled}
              onChangeText={setText}
              style={formControlStyles.input}
              value={text}
            />
          </Field>
          {addMutation.isError ? (
            <ErrorMessage message={addMutation.error.message} />
          ) : null}
          {removeMutation.isError ? (
            <ErrorMessage message={removeMutation.error.message} />
          ) : null}
          <PrimaryButton
            disabled={text.trim().length === 0 || removeMutation.isPending}
            label="Add Capability"
            onPress={() => addMutation.mutate()}
            pending={addMutation.isPending}
            pendingLabel="Adding…"
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#d8e1da",
    paddingTop: 24,
  },
  heading: {
    color: "#17251d",
    fontSize: 23,
    fontWeight: "700",
  },
  guidance: {
    marginTop: 8,
    marginBottom: 18,
    color: "#4c5f53",
    fontSize: 15,
    lineHeight: 22,
  },
  loading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  status: { color: "#4c5f53", fontSize: 15 },
  empty: {
    marginBottom: 18,
    color: "#687a6f",
    fontSize: 15,
    fontStyle: "italic",
  },
  list: { marginBottom: 20, gap: 10 },
  capability: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 10,
    backgroundColor: "#f2f5f1",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  capabilityText: {
    flex: 1,
    color: "#17251d",
    fontSize: 16,
    lineHeight: 23,
  },
  removeButton: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  removeButtonText: { color: "#8b2e24", fontSize: 14, fontWeight: "700" },
  disabledButton: { opacity: 0.5 },
  pressedButton: { backgroundColor: "#fbe9e7" },
});

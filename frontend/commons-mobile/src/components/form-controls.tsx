import type { PropsWithChildren } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export function Field({
  label,
  children,
}: PropsWithChildren<{ label: string }>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

export function PrimaryButton({
  label,
  pendingLabel,
  pending = false,
  disabled = false,
  tone = "primary",
  testID,
  onPress,
}: {
  label: string;
  pendingLabel?: string;
  pending?: boolean;
  disabled?: boolean;
  tone?: "primary" | "danger";
  testID?: string;
  onPress: () => void;
}) {
  const isDisabled = pending || disabled;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.primaryButton,
        tone === "danger" && styles.dangerButton,
        isDisabled && styles.disabledButton,
        pressed &&
          !isDisabled &&
          (tone === "danger"
            ? styles.pressedDangerButton
            : styles.pressedButton),
      ]}
    >
      {pending ? <ActivityIndicator color="#ffffff" size="small" /> : null}
      <Text style={styles.primaryButtonText}>
        {pending ? (pendingLabel ?? label) : label}
      </Text>
    </Pressable>
  );
}

export function TextButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.textButton,
        pressed && styles.pressedTextButton,
      ]}
    >
      <Text style={styles.textButtonText}>{label}</Text>
    </Pressable>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <Text accessibilityRole="alert" style={styles.error}>
      {message}
    </Text>
  );
}

export const formControlStyles = StyleSheet.create({
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#b9c8be",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    color: "#17251d",
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 104,
    paddingTop: 13,
    textAlignVertical: "top",
  },
});

const styles = StyleSheet.create({
  field: { marginBottom: 18 },
  label: {
    marginBottom: 7,
    color: "#263b2f",
    fontSize: 15,
    fontWeight: "600",
  },
  primaryButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 12,
    backgroundColor: "#276544",
    paddingHorizontal: 18,
  },
  disabledButton: { opacity: 0.5 },
  pressedButton: { backgroundColor: "#1d5035" },
  dangerButton: { backgroundColor: "#9b342a" },
  pressedDangerButton: { backgroundColor: "#79271f" },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  textButton: {
    alignSelf: "center",
    marginTop: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pressedTextButton: { opacity: 0.6 },
  textButtonText: {
    color: "#276544",
    fontSize: 15,
    fontWeight: "600",
  },
  error: {
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: "#fbe9e7",
    padding: 12,
    color: "#8b2e24",
    fontSize: 14,
    lineHeight: 20,
  },
});

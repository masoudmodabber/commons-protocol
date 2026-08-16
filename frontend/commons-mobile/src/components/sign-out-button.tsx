import { Pressable, StyleSheet, Text } from "react-native";

export function SignOutButton({
  disabled = false,
  onPress,
}: {
  disabled?: boolean;
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.label}>Sign out</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { paddingHorizontal: 8, paddingVertical: 7 },
  pressed: { opacity: 0.6 },
  label: { color: "#276544", fontSize: 14, fontWeight: "700" },
});

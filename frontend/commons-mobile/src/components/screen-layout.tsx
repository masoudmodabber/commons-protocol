import type { PropsWithChildren, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenLayoutProps extends PropsWithChildren {
  eyebrow?: string;
  title: string;
  description?: string;
  headerAction?: ReactNode;
}

export function ScreenLayout({
  children,
  eyebrow,
  title,
  description,
  headerAction,
}: ScreenLayoutProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.brandRow}>
              <Text style={styles.brand}>Commons Market</Text>
              {headerAction}
            </View>
            <View style={styles.intro}>
              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
              <Text accessibilityRole="header" style={styles.title}>
                {title}
              </Text>
              {description ? (
                <Text style={styles.description}>{description}</Text>
              ) : null}
            </View>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#eef2ec",
  },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 560,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    padding: 24,
    shadowColor: "#17251d",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 36,
  },
  brand: {
    color: "#244d35",
    fontSize: 18,
    fontWeight: "700",
  },
  intro: { marginTop: 28, marginBottom: 24 },
  eyebrow: {
    marginBottom: 8,
    color: "#52725f",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: "#17251d",
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 37,
  },
  description: {
    marginTop: 10,
    color: "#4c5f53",
    fontSize: 16,
    lineHeight: 24,
  },
});

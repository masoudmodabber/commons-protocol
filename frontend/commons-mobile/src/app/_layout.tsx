import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProviders } from "../providers/app-providers";
import { useSession } from "../auth/session-context";
import { useParticipantProfile } from "../participants/use-participant-profile";

export default function RootLayout() {
  return (
    <AppProviders>
      <Navigation />
      <StatusBar style="auto" />
    </AppProviders>
  );
}

function Navigation() {
  const session = useSession();
  const profileQuery = useParticipantProfile();
  const isAuthenticated = session.status === "authenticated";
  const canJoin =
    isAuthenticated && profileQuery.isSuccess && profileQuery.data === null;
  const hasProfile =
    isAuthenticated && profileQuery.isSuccess && profileQuery.data !== null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={session.status === "unauthenticated"}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="register" />
      </Stack.Protected>
      <Stack.Protected guard={canJoin}>
        <Stack.Screen name="join" />
      </Stack.Protected>
      <Stack.Protected guard={hasProfile}>
        <Stack.Screen name="profile" />
        <Stack.Screen name="available-requests/index" />
        <Stack.Screen name="available-requests/[requestId]" />
        <Stack.Screen name="available-requests/[requestId]/offer" />
        <Stack.Screen name="offers/index" />
        <Stack.Screen name="offers/[offerId]" />
        <Stack.Screen name="requests/new" />
        <Stack.Screen name="requests/[requestId]" />
      </Stack.Protected>
    </Stack>
  );
}

import { Redirect, type Href } from "expo-router";
import { useSession } from "../auth/session-context";
import { useParticipantProfile } from "../participants/use-participant-profile";
import { StartupScreen } from "../screens/startup-screen";

export default function IndexRoute() {
  const session = useSession();
  const profileQuery = useParticipantProfile();

  if (session.status === "restoring") {
    return <StartupScreen />;
  }

  if (session.status === "unauthenticated") {
    return <Redirect href={"/sign-in" as Href} />;
  }

  if (profileQuery.isPending) {
    return <StartupScreen />;
  }

  if (profileQuery.isError) {
    return (
      <StartupScreen
        error={profileQuery.error.message}
        onRetry={() => void profileQuery.refetch()}
        onSignOut={session.signOut}
      />
    );
  }

  return (
    <Redirect href={(profileQuery.data ? "/profile" : "/join") as Href} />
  );
}

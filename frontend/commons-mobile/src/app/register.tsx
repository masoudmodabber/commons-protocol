import { useRouter, type Href } from "expo-router";
import { useSession } from "../auth/session-context";
import { AuthenticationScreen } from "../screens/authentication-screen";

export default function RegisterRoute() {
  const router = useRouter();
  const session = useSession();

  return (
    <AuthenticationScreen
      mode="register"
      onSubmit={async (credentials) => {
        await session.registerAndSignIn(credentials);
        router.replace("/" as Href);
      }}
      onSwitch={() => router.back()}
    />
  );
}

import { useRouter, type Href } from "expo-router";
import { useSession } from "../auth/session-context";
import { AuthenticationScreen } from "../screens/authentication-screen";

export default function SignInRoute() {
  const router = useRouter();
  const session = useSession();

  return (
    <AuthenticationScreen
      mode="sign-in"
      onSubmit={async (credentials) => {
        await session.signIn(credentials);
        router.replace("/" as Href);
      }}
      onSwitch={() => router.push("/register" as Href)}
    />
  );
}

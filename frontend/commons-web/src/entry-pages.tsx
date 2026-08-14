import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCommons, joinCommons, login, register } from "./api";
import { navigate } from "./navigation";
import { Brand, Field, Header } from "./ui";

export function Authentication({ onAuthenticated }: { onAuthenticated: (token: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "register") {
        await register(email, password);
      }

      onAuthenticated(await login(email, password));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="card auth-card">
        <Brand />
        <div className="intro">
          <p className="eyebrow">Welcome</p>
          <h1>{mode === "login" ? "Sign in to your Commons" : "Create your account"}</h1>
          <p>
            {mode === "login"
              ? "Continue to your participant profile and local Commons."
              : "Create an account, then choose the existing Commons you call home."}
          </p>
        </div>

        <form onSubmit={submit} className="form-stack">
          <Field label="Email" htmlFor="email">
            <input id="email" type="email" autoComplete="email" value={email}
              onChange={(event) => setEmail(event.target.value)} required />
          </Field>
          <Field label="Password" htmlFor="password">
            <input id="password" type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password} onChange={(event) => setPassword(event.target.value)} required />
          </Field>
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button className="text-button" type="button" onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setError(null);
        }}>
          {mode === "login" ? "New here? Create an account" : "Already registered? Sign in"}
        </button>
      </section>
    </main>
  );
}

export function JoinCommonsPage({
  accessToken,
  onSignOut,
}: {
  accessToken: string;
  onSignOut: () => void;
}) {
  const queryClient = useQueryClient();
  const [homeCommonsId, setHomeCommonsId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const commonsQuery = useQuery({
    queryKey: ["commons", accessToken],
    queryFn: () => getCommons(accessToken),
  });
  const joinMutation = useMutation({
    mutationFn: () => joinCommons(accessToken, {
      homeCommonsId,
      displayName,
      bio: bio.trim() || null,
    }),
    onSuccess: async () => {
      navigate("/profile");
      await queryClient.invalidateQueries({ queryKey: ["participant-profile"] });
    },
  });

  return (
    <main className="page-shell">
      <section className="card join-card">
        <Header onSignOut={onSignOut} />
        <div className="intro">
          <p className="eyebrow">Your home community</p>
          <h1>Join a Commons</h1>
          <p>Choose one existing local Commons and create your participant profile.</p>
        </div>

        {commonsQuery.isPending && <p className="status-message">Loading available Commons…</p>}
        {commonsQuery.isError && (
          <p className="error-message" role="alert">{commonsQuery.error.message}</p>
        )}
        {commonsQuery.isSuccess && commonsQuery.data.length === 0 && (
          <p className="status-message">There are no Commons available to join yet.</p>
        )}
        {commonsQuery.isSuccess && commonsQuery.data.length > 0 && (
          <form onSubmit={(event) => { event.preventDefault(); joinMutation.mutate(); }}
            className="form-stack">
            <Field label="Home Commons" htmlFor="home-commons">
              <select id="home-commons" value={homeCommonsId}
                onChange={(event) => setHomeCommonsId(event.target.value)} required>
                <option value="">Select your Commons</option>
                {commonsQuery.data.map((commons) => (
                  <option key={commons.id} value={commons.id}>{commons.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Display name" htmlFor="display-name">
              <input id="display-name" value={displayName}
                onChange={(event) => setDisplayName(event.target.value)} required />
            </Field>
            <Field label="Short bio (optional)" htmlFor="bio">
              <textarea id="bio" rows={4} value={bio}
                onChange={(event) => setBio(event.target.value)} />
            </Field>
            {joinMutation.isError && (
              <p className="error-message" role="alert">{joinMutation.error.message}</p>
            )}
            <button className="primary-button" type="submit" disabled={joinMutation.isPending}>
              {joinMutation.isPending ? "Joining…" : "Join this Commons"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

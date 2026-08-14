import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiError,
  getCommons,
  getProfile,
  joinCommons,
  login,
  ParticipantProfile,
  register,
} from "./api";

const accessTokenKey = "commons-access-token";

export function App() {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    sessionStorage.getItem(accessTokenKey),
  );
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["participant-profile", accessToken],
    queryFn: () => getProfile(accessToken!),
    enabled: accessToken !== null,
    retry: false,
  });

  function authenticated(token: string) {
    sessionStorage.setItem(accessTokenKey, token);
    setAccessToken(token);
  }

  function signOut() {
    sessionStorage.removeItem(accessTokenKey);
    setAccessToken(null);
    queryClient.clear();
  }

  if (!accessToken) {
    return <Authentication onAuthenticated={authenticated} />;
  }

  if (profileQuery.isPending) {
    return <PageMessage message="Loading your Commons profile…" />;
  }

  if (profileQuery.isSuccess) {
    return <Profile profile={profileQuery.data} onSignOut={signOut} />;
  }

  if (profileQuery.error instanceof ApiError && profileQuery.error.status === 404) {
    return <JoinCommons accessToken={accessToken} onSignOut={signOut} />;
  }

  return (
    <PageMessage
      message={profileQuery.error?.message ?? "Your profile could not be loaded."}
      actionLabel="Sign out"
      onAction={signOut}
    />
  );
}

function Authentication({ onAuthenticated }: { onAuthenticated: (token: string) => void }) {
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

function JoinCommons({ accessToken, onSignOut }: { accessToken: string; onSignOut: () => void }) {
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["participant-profile"] }),
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
        {commonsQuery.isError && <p className="error-message" role="alert">{commonsQuery.error.message}</p>}
        {commonsQuery.isSuccess && commonsQuery.data.length === 0 && (
          <p className="status-message">There are no Commons available to join yet.</p>
        )}
        {commonsQuery.isSuccess && commonsQuery.data.length > 0 && (
          <form onSubmit={(event) => { event.preventDefault(); joinMutation.mutate(); }} className="form-stack">
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
            {joinMutation.isError && <p className="error-message" role="alert">{joinMutation.error.message}</p>}
            <button className="primary-button" type="submit" disabled={joinMutation.isPending}>
              {joinMutation.isPending ? "Joining…" : "Join this Commons"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

function Profile({ profile, onSignOut }: { profile: ParticipantProfile; onSignOut: () => void }) {
  return (
    <main className="page-shell">
      <section className="card profile-card">
        <Header onSignOut={onSignOut} />
        <div className="profile-heading">
          <div className="avatar" aria-hidden="true">{profile.displayName.slice(0, 1).toUpperCase()}</div>
          <div>
            <p className="eyebrow">Participant profile</p>
            <h1>{profile.displayName}</h1>
          </div>
        </div>
        {profile.bio && <p className="bio">{profile.bio}</p>}
        <dl className="profile-details">
          <div><dt>Home Commons</dt><dd>{profile.homeCommons.name}</dd></div>
          <div><dt>Joined</dt><dd>{new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(profile.joinedAt))}</dd></div>
        </dl>
      </section>
    </main>
  );
}

function Header({ onSignOut }: { onSignOut: () => void }) {
  return <header className="app-header"><Brand /><button className="text-button" type="button" onClick={onSignOut}>Sign out</button></header>;
}

function Brand() {
  return <div className="brand"><span aria-hidden="true">◉</span> Commons Market</div>;
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return <label className="field" htmlFor={htmlFor}><span>{label}</span>{children}</label>;
}

function PageMessage({ message, actionLabel, onAction }: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <main className="page-shell">
      <section className="card message-card">
        <Brand />
        <p className="status-message">{message}</p>
        {actionLabel && onAction && <button type="button" className="primary-button" onClick={onAction}>{actionLabel}</button>}
      </section>
    </main>
  );
}

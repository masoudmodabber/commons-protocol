import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addCapability,
  ApiError,
  createRequest,
  editRequest,
  getCommons,
  getProfile,
  joinCommons,
  login,
  ParticipantProfile,
  RequestDetails,
  removeCapability,
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
    return <Profile profile={profileQuery.data} accessToken={accessToken} onSignOut={signOut} />;
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

function Profile({
  profile,
  accessToken,
  onSignOut,
}: {
  profile: ParticipantProfile;
  accessToken: string;
  onSignOut: () => void;
}) {
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
        <CapabilityManager profile={profile} accessToken={accessToken} />
        <RequestManager profile={profile} accessToken={accessToken} />
      </section>
    </main>
  );
}

function CapabilityManager({
  profile,
  accessToken,
}: {
  profile: ParticipantProfile;
  accessToken: string;
}) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const addMutation = useMutation({
    mutationFn: () => addCapability(accessToken, text),
    onSuccess: async () => {
      setText("");
      await queryClient.invalidateQueries({ queryKey: ["participant-profile"] });
    },
  });
  const removeMutation = useMutation({
    mutationFn: (capabilityId: string) => removeCapability(accessToken, capabilityId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["participant-profile"] }),
  });

  return (
    <section className="capabilities" aria-labelledby="capabilities-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">What I may be able to provide</p>
          <h2 id="capabilities-heading">Capabilities</h2>
        </div>
        <span className="capability-count">{profile.capabilities.length}</span>
      </div>
      <p className="capability-guidance">
        These descriptions help your Commons understand what you may be able to provide,
        whether that is a skill, service, good, resource, or something you have available,
        such as carpentry, eggs, tools, or transport. They do not indicate availability,
        price, quantity, or an obligation to trade.
      </p>

      {profile.capabilities.length === 0 ? (
        <p className="empty-state">You have not listed any Capabilities yet.</p>
      ) : (
        <ul className="capability-list">
          {profile.capabilities.map((capability) => (
            <li key={capability.id}>
              <span>{capability.text}</span>
              <button
                type="button"
                className="remove-button"
                aria-label={`Remove ${capability.text}`}
                disabled={removeMutation.isPending}
                onClick={() => removeMutation.mutate(capability.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="capability-form"
        onSubmit={(event) => {
          event.preventDefault();
          addMutation.mutate();
        }}
      >
        <Field label="Add a Capability" htmlFor="capability-text">
          <input
            id="capability-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="For example, bicycle repair"
            required
          />
        </Field>
        <button
          className="primary-button"
          type="submit"
          disabled={addMutation.isPending || text.trim().length === 0}
        >
          {addMutation.isPending ? "Adding…" : "Add Capability"}
        </button>
      </form>
      {addMutation.isError && (
        <p className="error-message" role="alert">{addMutation.error.message}</p>
      )}
      {removeMutation.isError && (
        <p className="error-message" role="alert">{removeMutation.error.message}</p>
      )}
    </section>
  );
}

function RequestManager({
  profile,
  accessToken,
}: {
  profile: ParticipantProfile;
  accessToken: string;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [createdRequest, setCreatedRequest] = useState<RequestDetails | null>(null);
  const [editing, setEditing] = useState(false);
  const createMutation = useMutation({
    mutationFn: () => createRequest(accessToken, { title, description }),
    onSuccess: (request) => setCreatedRequest(request),
  });
  const editMutation = useMutation({
    mutationFn: () => editRequest(accessToken, createdRequest!.id, { title, description }),
    onSuccess: (request) => {
      setCreatedRequest(request);
      setEditing(false);
    },
  });

  if (createdRequest && !editing) {
    return (
      <section className="requests" aria-labelledby="request-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Request created</p>
            <h2 id="request-heading">{createdRequest.title}</h2>
          </div>
          <span className="request-status">{createdRequest.status}</span>
        </div>
        <p className="request-description">{createdRequest.description}</p>
        <dl className="request-details">
          <div><dt>Requested by</dt><dd>{createdRequest.creator.displayName}</dd></div>
          <div><dt>Home Commons</dt><dd>{createdRequest.homeCommons.name}</dd></div>
        </dl>
        <div className="request-actions">
          {createdRequest.status === "Open" && (
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setTitle(createdRequest.title);
                setDescription(createdRequest.description);
                setEditing(true);
              }}
            >
              Edit Request
            </button>
          )}
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setCreatedRequest(null);
              setTitle("");
              setDescription("");
            }}
          >
            Create another Request
          </button>
        </div>
      </section>
    );
  }

  if (createdRequest && editing) {
    return (
      <section className="requests" aria-labelledby="edit-request-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Open Request</p>
            <h2 id="edit-request-heading">Edit Request</h2>
          </div>
        </div>
        <form
          className="form-stack"
          onSubmit={(event) => {
            event.preventDefault();
            editMutation.mutate();
          }}
        >
          <Field label="Request title" htmlFor="edit-request-title">
            <input
              id="edit-request-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </Field>
          <Field label="Description" htmlFor="edit-request-description">
            <textarea
              id="edit-request-description"
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
            />
          </Field>
          {editMutation.isError && (
            <p className="error-message" role="alert">{editMutation.error.message}</p>
          )}
          <div className="request-actions">
            <button
              className="primary-button"
              type="submit"
              disabled={editMutation.isPending
                || title.trim().length === 0
                || description.trim().length === 0}
            >
              {editMutation.isPending ? "Saving…" : "Save changes"}
            </button>
            <button
              className="text-button"
              type="button"
              disabled={editMutation.isPending}
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="requests" aria-labelledby="requests-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Something you need</p>
          <h2 id="requests-heading">Create a Request</h2>
        </div>
      </div>
      <p className="request-guidance">
        Describe what you need from {profile.homeCommons.name}. You do not need to say what
        you will provide in return; any terms can emerge voluntarily later.
      </p>
      <form
        className="form-stack"
        onSubmit={(event) => {
          event.preventDefault();
          createMutation.mutate();
        }}
      >
        <Field label="Request title" htmlFor="request-title">
          <input
            id="request-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="For example, help repairing a fence"
            required
          />
        </Field>
        <Field label="Description" htmlFor="request-description">
          <textarea
            id="request-description"
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
          />
        </Field>
        {createMutation.isError && (
          <p className="error-message" role="alert">{createMutation.error.message}</p>
        )}
        <button
          className="primary-button"
          type="submit"
          disabled={createMutation.isPending
            || title.trim().length === 0
            || description.trim().length === 0}
        >
          {createMutation.isPending ? "Creating…" : "Create Request"}
        </button>
      </form>
    </section>
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

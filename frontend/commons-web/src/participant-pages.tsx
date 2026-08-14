import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addCapability,
  ParticipantProfile,
  removeCapability,
} from "./api";
import { Field } from "./ui";

export function ProfilePage({ profile }: { profile: ParticipantProfile }) {
  return (
    <section className="feature-page" aria-labelledby="profile-heading">
      <div className="profile-heading">
        <div className="avatar" aria-hidden="true">
          {profile.displayName.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="eyebrow">Participant profile</p>
          <h1 id="profile-heading">{profile.displayName}</h1>
        </div>
      </div>
      {profile.bio && <p className="bio">{profile.bio}</p>}
      <dl className="profile-details">
        <div><dt>Home Commons</dt><dd>{profile.homeCommons.name}</dd></div>
        <div>
          <dt>Joined</dt>
          <dd>
            {new Intl.DateTimeFormat(undefined, { dateStyle: "long" })
              .format(new Date(profile.joinedAt))}
          </dd>
        </div>
      </dl>
    </section>
  );
}

export function CapabilitiesPage({
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
    <section className="feature-page capabilities" aria-labelledby="capabilities-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">What I may be able to provide</p>
          <h1 id="capabilities-heading">Capabilities</h1>
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

      <form className="capability-form" onSubmit={(event) => {
        event.preventDefault();
        addMutation.mutate();
      }}>
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

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getOffer,
  getOfferSubmissionOptions,
  submitOffer,
} from "./api";
import { navigate } from "./navigation";
import { Field } from "./ui";

export function SubmitOfferPage({
  accessToken,
  requestId,
}: {
  accessToken: string;
  requestId: string;
}) {
  const queryClient = useQueryClient();
  const [commonsAccountingUnits, setCommonsAccountingUnits] = useState("");
  const [contributionDescriptions, setContributionDescriptions] = useState<
    Record<string, string>
  >({});
  const optionsQuery = useQuery({
    queryKey: ["offer-options", accessToken, requestId],
    queryFn: () => getOfferSubmissionOptions(accessToken, requestId),
  });
  const selectedContributions = Object.entries(contributionDescriptions)
    .map(([capabilityId, description]) => ({ capabilityId, description }));
  const parsedUnits = commonsAccountingUnits === "" ? null : Number(commonsAccountingUnits);
  const unitsAreValid = parsedUnits === null
    || (Number.isSafeInteger(parsedUnits) && parsedUnits > 0);
  const descriptionsAreValid = selectedContributions.every(
    contribution => contribution.description.trim().length > 0,
  );
  const hasRequestedReturn = parsedUnits !== null || selectedContributions.length > 0;
  const formIsValid = unitsAreValid && descriptionsAreValid && hasRequestedReturn;
  const submitMutation = useMutation({
    mutationFn: () => submitOffer(accessToken, requestId, {
      commonsAccountingUnits: parsedUnits,
      requestedContributions: selectedContributions,
    }),
    onSuccess: (offer) => {
      queryClient.setQueryData(["offer", accessToken, offer.id], offer);
      navigate(`/offers/${offer.id}`);
    },
  });

  if (optionsQuery.isPending) {
    return <p className="status-message feature-page">Loading Offer options…</p>;
  }

  if (optionsQuery.isError) {
    return <p className="error-message feature-page" role="alert">{optionsQuery.error.message}</p>;
  }

  const options = optionsQuery.data;

  function updateUnits(value: string) {
    if (value === "" || /^[1-9]\d*$/.test(value)) {
      setCommonsAccountingUnits(value);
    }
  }

  function selectCapability(capabilityId: string, selected: boolean) {
    setContributionDescriptions(current => {
      if (selected) {
        return { ...current, [capabilityId]: "" };
      }

      const next = { ...current };
      delete next[capabilityId];
      return next;
    });
  }

  return (
    <section className="feature-page requests" aria-labelledby="submit-offer-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Offer to satisfy this Request</p>
          <h1 id="submit-offer-heading">Submit an Offer</h1>
        </div>
      </div>
      <h2 className="offer-request-title">{options.request.title}</h2>
      <p className="request-description">{options.request.description}</p>

      <form className="form-stack" onSubmit={(event) => {
        event.preventDefault();
        if (formIsValid) {
          submitMutation.mutate();
        }
      }}>
        <Field label="Commons accounting units (optional)" htmlFor="offer-units">
          <input
            id="offer-units"
            type="text"
            inputMode="numeric"
            pattern="[1-9][0-9]*"
            value={commonsAccountingUnits}
            onChange={(event) => {
              const enteredValue = event.target.value;
              updateUnits(enteredValue);

              if (enteredValue !== "" && !/^[1-9]\d*$/.test(enteredValue)) {
                event.currentTarget.value = commonsAccountingUnits;
              }
            }}
          />
        </Field>
        <p className="offer-guidance">Enter a positive whole number, or leave this empty.</p>

        <fieldset className="offer-capabilities">
          <legend>Requested contributions (optional)</legend>
          {options.capabilities.length === 0 && (
            <p className="empty-state">
              The Request creator has no current Capabilities to request.
            </p>
          )}
          {options.capabilities.map(capability => {
            const selected = capability.id in contributionDescriptions;
            return (
              <div className="offer-capability" key={capability.id}>
                <label className="capability-choice">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(event) => selectCapability(capability.id, event.target.checked)}
                  />
                  <span>{capability.text}</span>
                </label>
                {selected && (
                  <Field
                    label={`What are you requesting from ${capability.text}?`}
                    htmlFor={`contribution-${capability.id}`}
                  >
                    <textarea
                      id={`contribution-${capability.id}`}
                      rows={3}
                      value={contributionDescriptions[capability.id]}
                      onChange={(event) => setContributionDescriptions(current => ({
                        ...current,
                        [capability.id]: event.target.value,
                      }))}
                      required
                    />
                  </Field>
                )}
              </div>
            );
          })}
        </fieldset>

        {submitMutation.isError && (
          <p className="error-message" role="alert">{submitMutation.error.message}</p>
        )}
        <div className="request-actions">
          <button
            className="primary-button"
            type="submit"
            disabled={!formIsValid || submitMutation.isPending}
          >
            {submitMutation.isPending ? "Submitting…" : "Submit Offer"}
          </button>
          <a className="text-link" href={`#/available-requests/${requestId}`}>
            Back to Request
          </a>
        </div>
      </form>
    </section>
  );
}

export function OfferDetailPage({
  accessToken,
  offerId,
}: {
  accessToken: string;
  offerId: string;
}) {
  const offerQuery = useQuery({
    queryKey: ["offer", accessToken, offerId],
    queryFn: () => getOffer(accessToken, offerId),
  });

  if (offerQuery.isPending) {
    return <p className="status-message feature-page">Loading your Offer…</p>;
  }

  if (offerQuery.isError) {
    return <p className="error-message feature-page" role="alert">{offerQuery.error.message}</p>;
  }

  const offer = offerQuery.data;

  return (
    <section className="feature-page requests" aria-labelledby="offer-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Your submitted Offer</p>
          <h1 id="offer-heading">Offer for {offer.request.title}</h1>
        </div>
      </div>
      <p className="request-description">{offer.request.description}</p>
      <dl className="request-details">
        <div><dt>Offer submitted by</dt><dd>{offer.creator.displayName}</dd></div>
        <div><dt>Request created by</dt><dd>{offer.request.creator.displayName}</dd></div>
        {offer.commonsAccountingUnits !== null && (
          <div>
            <dt>Commons accounting units requested</dt>
            <dd>{offer.commonsAccountingUnits}</dd>
          </div>
        )}
      </dl>
      {offer.requestedContributions.length > 0 && (
        <section aria-labelledby="offer-contributions-heading">
          <h2 id="offer-contributions-heading" className="offer-terms-heading">
            Requested contributions
          </h2>
          <ul className="offer-contribution-list">
            {offer.requestedContributions.map(contribution => (
              <li key={contribution.capabilityId}>
                <strong>{contribution.capabilityTextSnapshot}</strong>
                <p>{contribution.description}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      <a className="text-link" href={`#/available-requests/${offer.request.id}`}>
        Back to Request
      </a>
    </section>
  );
}

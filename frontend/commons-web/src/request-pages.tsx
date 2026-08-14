import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  browseRequests,
  cancelRequest,
  createRequest,
  editRequest,
  getBrowseRequest,
  getMyRequests,
  getRequest,
  ParticipantProfile,
} from "./api";
import { navigate } from "./navigation";
import { Field } from "./ui";

export function MyRequestsPage({ accessToken }: { accessToken: string }) {
  const requestsQuery = useQuery({
    queryKey: ["my-requests", accessToken],
    queryFn: () => getMyRequests(accessToken),
  });

  return (
    <section className="feature-page requests" aria-labelledby="requests-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Requests you created</p>
          <h1 id="requests-heading">My Requests</h1>
        </div>
        <a className="primary-link" href="#/requests/new">Create Request</a>
      </div>

      {requestsQuery.isPending && <p className="status-message">Loading your Requests…</p>}
      {requestsQuery.isError && (
        <p className="error-message" role="alert">{requestsQuery.error.message}</p>
      )}
      {requestsQuery.isSuccess && requestsQuery.data.length === 0 && (
        <p className="empty-state">You have not created any Requests yet.</p>
      )}
      {requestsQuery.isSuccess && requestsQuery.data.length > 0 && (
        <ul className="request-list">
          {requestsQuery.data.map((request) => (
            <li key={request.id}>
              <a href={`#/requests/${request.id}`}>{request.title}</a>
              <span className="request-status">{request.status}</span>
              <p>{request.description}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function BrowseRequestsPage({ accessToken }: { accessToken: string }) {
  const requestsQuery = useQuery({
    queryKey: ["browse-requests", accessToken],
    queryFn: () => browseRequests(accessToken),
  });

  return (
    <section className="feature-page requests" aria-labelledby="browse-requests-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Open needs from other Participants in your Home Commons</p>
          <h1 id="browse-requests-heading">Available Requests</h1>
        </div>
      </div>

      {requestsQuery.isPending && <p className="status-message">Loading Requests…</p>}
      {requestsQuery.isError && (
        <p className="error-message" role="alert">{requestsQuery.error.message}</p>
      )}
      {requestsQuery.isSuccess && requestsQuery.data.length === 0 && (
        <p className="empty-state">
          There are no Open Requests from other Participants in your Home Commons.
        </p>
      )}
      {requestsQuery.isSuccess && requestsQuery.data.length > 0 && (
        <ul className="request-list">
          {requestsQuery.data.map((request) => (
            <li key={request.id}>
              <a href={`#/available-requests/${request.id}`}>{request.title}</a>
              <span className="request-status">{request.status}</span>
              <p>{request.description}</p>
              <p className="request-creator">Requested by {request.creator.displayName}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function CreateRequestPage({
  profile,
  accessToken,
}: {
  profile: ParticipantProfile;
  accessToken: string;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const createMutation = useMutation({
    mutationFn: () => createRequest(accessToken, { title, description }),
    onSuccess: async (request) => {
      queryClient.setQueryData(["request", accessToken, request.id], request);
      await queryClient.invalidateQueries({ queryKey: ["my-requests", accessToken] });
      await queryClient.invalidateQueries({ queryKey: ["browse-requests", accessToken] });
      navigate(`/requests/${request.id}`);
    },
  });

  return (
    <section className="feature-page requests" aria-labelledby="create-request-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Something you need</p>
          <h1 id="create-request-heading">Create a Request</h1>
        </div>
      </div>
      <p className="request-guidance">
        Describe what you need from {profile.homeCommons.name}. You do not need to say what
        you will provide in return; any terms can emerge voluntarily later.
      </p>
      <RequestForm
        title={title}
        description={description}
        submitLabel={createMutation.isPending ? "Creating…" : "Create Request"}
        isPending={createMutation.isPending}
        error={createMutation.isError ? createMutation.error.message : null}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onSubmit={() => createMutation.mutate()}
      />
    </section>
  );
}

export function RequestDetailPage({
  accessToken,
  requestId,
}: {
  accessToken: string;
  requestId: string;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const requestQuery = useQuery({
    queryKey: ["request", accessToken, requestId],
    queryFn: () => getRequest(accessToken, requestId),
  });
  const editMutation = useMutation({
    mutationFn: () => editRequest(accessToken, requestId, { title, description }),
    onSuccess: async (request) => {
      queryClient.setQueryData(["request", accessToken, request.id], request);
      await queryClient.invalidateQueries({ queryKey: ["my-requests", accessToken] });
      await queryClient.invalidateQueries({ queryKey: ["browse-requests", accessToken] });
      await queryClient.invalidateQueries({
        queryKey: ["browse-request", accessToken, request.id],
      });
      setEditing(false);
    },
  });
  const cancelMutation = useMutation({
    mutationFn: () => cancelRequest(accessToken, requestId),
    onSuccess: async (request) => {
      queryClient.setQueryData(["request", accessToken, request.id], request);
      await queryClient.invalidateQueries({ queryKey: ["my-requests", accessToken] });
      await queryClient.invalidateQueries({ queryKey: ["browse-requests", accessToken] });
      await queryClient.invalidateQueries({
        queryKey: ["browse-request", accessToken, request.id],
      });
    },
  });

  if (requestQuery.isPending) {
    return <p className="status-message feature-page">Loading your Request…</p>;
  }

  if (requestQuery.isError) {
    return <p className="error-message feature-page" role="alert">{requestQuery.error.message}</p>;
  }

  const request = requestQuery.data;

  if (editing) {
    return (
      <section className="feature-page requests" aria-labelledby="edit-request-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Open Request</p>
            <h1 id="edit-request-heading">Edit Request</h1>
          </div>
        </div>
        <RequestForm
          title={title}
          description={description}
          submitLabel={editMutation.isPending ? "Saving…" : "Save changes"}
          isPending={editMutation.isPending}
          error={editMutation.isError ? editMutation.error.message : null}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onSubmit={() => editMutation.mutate()}
          onCancel={() => setEditing(false)}
        />
      </section>
    );
  }

  return (
    <section className="feature-page requests" aria-labelledby="request-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Your Request</p>
          <h1 id="request-heading">{request.title}</h1>
        </div>
        <span className="request-status">{request.status}</span>
      </div>
      <p className="request-description">{request.description}</p>
      <dl className="request-details">
        <div><dt>Requested by</dt><dd>{request.creator.displayName}</dd></div>
        <div><dt>Home Commons</dt><dd>{request.homeCommons.name}</dd></div>
      </dl>
      <div className="request-actions">
        {request.status === "Open" && (
          <>
            <button type="button" className="primary-button"
              disabled={cancelMutation.isPending} onClick={() => {
                setTitle(request.title);
                setDescription(request.description);
                setEditing(true);
              }}>
              Edit Request
            </button>
            <button type="button" className="danger-button"
              disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>
              {cancelMutation.isPending ? "Cancelling…" : "Cancel Request"}
            </button>
          </>
        )}
        <a className="text-link" href="#/requests">Back to My Requests</a>
      </div>
      {cancelMutation.isError && (
        <p className="error-message" role="alert">{cancelMutation.error.message}</p>
      )}
    </section>
  );
}

export function BrowseRequestDetailPage({
  accessToken,
  requestId,
}: {
  accessToken: string;
  requestId: string;
}) {
  const requestQuery = useQuery({
    queryKey: ["browse-request", accessToken, requestId],
    queryFn: () => getBrowseRequest(accessToken, requestId),
  });

  if (requestQuery.isPending) {
    return <p className="status-message feature-page">Loading Request…</p>;
  }

  if (requestQuery.isError) {
    return <p className="error-message feature-page" role="alert">{requestQuery.error.message}</p>;
  }

  const request = requestQuery.data;

  return (
    <section className="feature-page requests" aria-labelledby="browse-request-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Request in your Home Commons</p>
          <h1 id="browse-request-heading">{request.title}</h1>
        </div>
        <span className="request-status">{request.status}</span>
      </div>
      <p className="request-description">{request.description}</p>
      <dl className="request-details">
        <div><dt>Requested by</dt><dd>{request.creator.displayName}</dd></div>
        <div><dt>Home Commons</dt><dd>{request.homeCommons.name}</dd></div>
      </dl>
      <div className="request-actions">
        <a className="text-link" href="#/available-requests">Back to Available Requests</a>
      </div>
    </section>
  );
}

function RequestForm({
  title,
  description,
  submitLabel,
  isPending,
  error,
  onTitleChange,
  onDescriptionChange,
  onSubmit,
  onCancel,
}: {
  title: string;
  description: string;
  submitLabel: string;
  isPending: boolean;
  error: string | null;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
}) {
  return (
    <form className="form-stack" onSubmit={(event) => {
      event.preventDefault();
      onSubmit();
    }}>
      <Field label="Request title" htmlFor="request-title">
        <input id="request-title" value={title}
          onChange={(event) => onTitleChange(event.target.value)} required />
      </Field>
      <Field label="Description" htmlFor="request-description">
        <textarea id="request-description" rows={5} value={description}
          onChange={(event) => onDescriptionChange(event.target.value)} required />
      </Field>
      {error && <p className="error-message" role="alert">{error}</p>}
      <div className="request-actions">
        <button className="primary-button" type="submit"
          disabled={isPending || title.trim().length === 0 || description.trim().length === 0}>
          {submitLabel}
        </button>
        {onCancel && (
          <button className="text-button" type="button" disabled={isPending} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

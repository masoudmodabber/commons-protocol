const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export interface CommonsSummary {
  id: string;
  name: string;
}

export interface ParticipantProfile {
  id: string;
  displayName: string;
  bio: string | null;
  joinedAt: string;
  homeCommons: CommonsSummary;
  capabilities: CapabilitySummary[];
}

export interface CapabilitySummary {
  id: string;
  text: string;
}

export interface RequestDetails {
  id: string;
  title: string;
  description: string;
  status: "Open" | "Cancelled";
  creator: {
    participantId: string;
    displayName: string;
  };
  homeCommons: CommonsSummary;
}

interface AccessTokenResponse {
  accessToken: string;
}

async function request<T>(path: string, options: RequestInit = {}, accessToken?: string): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });

  if (!response.ok) {
    let message = "The request could not be completed.";

    try {
      const problem = (await response.json()) as {
        title?: string;
        detail?: string;
        errors?: Record<string, string[]>;
      };
      const validationMessage = Object.values(problem.errors ?? {}).flat().join(" ");
      message = problem.detail ?? problem.title ?? (validationMessage || message);
    } catch {
      // Use the fallback message for responses without a JSON body.
    }

    throw new ApiError(response.status, message);
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function register(email: string, password: string): Promise<void> {
  await request<void>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email: string, password: string): Promise<string> {
  const response = await request<AccessTokenResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  return response.accessToken;
}

export function getProfile(accessToken: string): Promise<ParticipantProfile> {
  return request<ParticipantProfile>("/api/participants/me", {}, accessToken);
}

export function getCommons(accessToken: string): Promise<CommonsSummary[]> {
  return request<CommonsSummary[]>("/api/commons", {}, accessToken);
}

export function joinCommons(
  accessToken: string,
  input: { homeCommonsId: string; displayName: string; bio: string | null },
): Promise<void> {
  return request<void>(
    "/api/participants/me",
    { method: "POST", body: JSON.stringify(input) },
    accessToken,
  );
}

export function addCapability(accessToken: string, text: string): Promise<CapabilitySummary> {
  return request<CapabilitySummary>(
    "/api/participants/me/capabilities",
    { method: "POST", body: JSON.stringify({ text }) },
    accessToken,
  );
}

export function removeCapability(accessToken: string, capabilityId: string): Promise<void> {
  return request<void>(
    `/api/participants/me/capabilities/${capabilityId}`,
    { method: "DELETE" },
    accessToken,
  );
}

export function createRequest(
  accessToken: string,
  input: { title: string; description: string },
): Promise<RequestDetails> {
  return request<RequestDetails>(
    "/api/requests",
    { method: "POST", body: JSON.stringify(input) },
    accessToken,
  );
}

export function getMyRequests(accessToken: string): Promise<RequestDetails[]> {
  return request<RequestDetails[]>("/api/requests", {}, accessToken);
}

export function getRequest(accessToken: string, requestId: string): Promise<RequestDetails> {
  return request<RequestDetails>(`/api/requests/${requestId}`, {}, accessToken);
}

export function browseRequests(
  accessToken: string,
  searchTerm?: string,
): Promise<RequestDetails[]> {
  const search = searchTerm === undefined
    ? ""
    : `?${new URLSearchParams({ search: searchTerm })}`;

  return request<RequestDetails[]>(`/api/requests/browse${search}`, {}, accessToken);
}

export function getBrowseRequest(
  accessToken: string,
  requestId: string,
): Promise<RequestDetails> {
  return request<RequestDetails>(`/api/requests/browse/${requestId}`, {}, accessToken);
}

export function editRequest(
  accessToken: string,
  requestId: string,
  input: { title: string; description: string },
): Promise<RequestDetails> {
  return request<RequestDetails>(
    `/api/requests/${requestId}`,
    { method: "PUT", body: JSON.stringify(input) },
    accessToken,
  );
}

export function cancelRequest(
  accessToken: string,
  requestId: string,
): Promise<RequestDetails> {
  return request<RequestDetails>(
    `/api/requests/${requestId}/cancel`,
    { method: "POST" },
    accessToken,
  );
}

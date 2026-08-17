import type { CreateRequestInput, RequestDetails } from "./contracts";
import type { AuthenticatedRequest } from "./participants-api";
import { participantProfileQueryKey } from "./participants-api";

export const participantRequestsQueryKey = [
  ...participantProfileQueryKey,
  "requests",
] as const;

export function requestDetailQueryKey(requestId: string) {
  return [...participantRequestsQueryKey, requestId] as const;
}

export interface RequestsApi {
  createRequest(input: CreateRequestInput): Promise<RequestDetails>;
  getRequest(requestId: string): Promise<RequestDetails>;
}

export function createRequestsApi(request: AuthenticatedRequest): RequestsApi {
  return {
    createRequest(input) {
      return request<RequestDetails>("/api/requests", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },

    getRequest(requestId) {
      return request<RequestDetails>(`/api/requests/${requestId}`);
    },
  };
}

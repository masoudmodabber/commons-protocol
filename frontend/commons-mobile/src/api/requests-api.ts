import type {
  CreateRequestInput,
  EditRequestInput,
  RequestDetails,
} from "./contracts";
import type { AuthenticatedRequest } from "./participants-api";
import { participantProfileQueryKey } from "./participants-api";

export const participantRequestsQueryKey = [
  ...participantProfileQueryKey,
  "requests",
] as const;

export const availableRequestsQueryKey = [
  ...participantRequestsQueryKey,
  "available",
] as const;

export function requestDetailQueryKey(requestId: string) {
  return [...participantRequestsQueryKey, requestId] as const;
}

export function availableRequestDetailQueryKey(requestId: string) {
  return [...availableRequestsQueryKey, requestId] as const;
}

export function availableRequestsSearchQueryKey(searchTerm?: string) {
  return searchTerm?.trim()
    ? [...availableRequestsQueryKey, "search", searchTerm] as const
    : availableRequestsQueryKey;
}

export interface RequestsApi {
  createRequest(input: CreateRequestInput): Promise<RequestDetails>;
  getRequest(requestId: string): Promise<RequestDetails>;
  browseRequests(searchTerm?: string): Promise<RequestDetails[]>;
  getBrowseRequest(requestId: string): Promise<RequestDetails>;
  editRequest(
    requestId: string,
    input: EditRequestInput,
  ): Promise<RequestDetails>;
  cancelRequest(requestId: string): Promise<RequestDetails>;
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

    browseRequests(searchTerm) {
      const path = searchTerm?.trim()
        ? `/api/requests/browse?search=${encodeURIComponent(searchTerm)}`
        : "/api/requests/browse";

      return request<RequestDetails[]>(path);
    },

    getBrowseRequest(requestId) {
      return request<RequestDetails>(`/api/requests/browse/${requestId}`);
    },

    editRequest(requestId, input) {
      return request<RequestDetails>(`/api/requests/${requestId}`, {
        method: "PUT",
        body: JSON.stringify(input),
      });
    },

    cancelRequest(requestId) {
      return request<RequestDetails>(`/api/requests/${requestId}/cancel`, {
        method: "POST",
      });
    },
  };
}

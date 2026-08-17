import type {
  OfferDetails,
  OfferSubmissionOptions,
  SubmitOfferInput,
} from "./contracts";
import type { AuthenticatedRequest } from "./participants-api";
import { participantProfileQueryKey } from "./participants-api";
import { availableRequestDetailQueryKey } from "./requests-api";

export const maximumCommonsAccountingUnits = 9_007_199_254_740_991;

export const participantOffersQueryKey = [
  ...participantProfileQueryKey,
  "offers",
] as const;

export function offerDetailQueryKey(offerId: string) {
  return [...participantOffersQueryKey, offerId] as const;
}

export function offerSubmissionOptionsQueryKey(requestId: string) {
  return [
    ...availableRequestDetailQueryKey(requestId),
    "offer-options",
  ] as const;
}

export interface OffersApi {
  getSubmissionOptions(requestId: string): Promise<OfferSubmissionOptions>;
  submitOffer(requestId: string, input: SubmitOfferInput): Promise<OfferDetails>;
  getMyOffers(): Promise<OfferDetails[]>;
  getOffer(offerId: string): Promise<OfferDetails>;
  withdrawOffer(offerId: string): Promise<OfferDetails>;
}

export function createOffersApi(request: AuthenticatedRequest): OffersApi {
  return {
    getSubmissionOptions(requestId) {
      return request<OfferSubmissionOptions>(
        `/api/requests/browse/${requestId}/offer-options`,
      );
    },

    submitOffer(requestId, input) {
      return request<OfferDetails>(`/api/requests/${requestId}/offers`, {
        method: "POST",
        body: JSON.stringify(input),
      });
    },

    getMyOffers() {
      return request<OfferDetails[]>("/api/offers");
    },

    getOffer(offerId) {
      return request<OfferDetails>(`/api/offers/${offerId}`);
    },

    withdrawOffer(offerId) {
      return request<OfferDetails>(`/api/offers/${offerId}/withdraw`, {
        method: "POST",
      });
    },
  };
}

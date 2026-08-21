import type { AgreementDetails } from "./contracts";
import type { AuthenticatedRequest } from "./participants-api";
import { participantProfileQueryKey } from "./participants-api";

export const participantAgreementsQueryKey = [
  ...participantProfileQueryKey,
  "agreements",
] as const;

export function agreementDetailQueryKey(agreementId: string) {
  return [...participantAgreementsQueryKey, agreementId] as const;
}

export interface AgreementsApi {
  getMyAgreements(): Promise<AgreementDetails[]>;
  getAgreement(agreementId: string): Promise<AgreementDetails>;
}

export function createAgreementsApi(
  request: AuthenticatedRequest,
): AgreementsApi {
  return {
    getMyAgreements() {
      return request<AgreementDetails[]>("/api/agreements");
    },
    getAgreement(agreementId) {
      return request<AgreementDetails>(`/api/agreements/${agreementId}`);
    },
  };
}

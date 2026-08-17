export interface AccessTokenResponse {
  tokenType: string;
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
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
}

export interface CapabilitySummary {
  id: string;
  text: string;
}

export interface CreateRequestInput {
  title: string;
  description: string;
}

export interface EditRequestInput {
  title: string;
  description: string;
}

export interface RequestDetails {
  id: string;
  title: string;
  description: string;
  status: "Open" | "Cancelled" | "Matched";
  creator: {
    participantId: string;
    displayName: string;
  };
  homeCommons: CommonsSummary;
  agreementId?: string | null;
}

export interface OfferCapabilityOption {
  id: string;
  text: string;
}

export interface OfferRequestSummary {
  id: string;
  title: string;
  description: string;
  creator: {
    participantId: string;
    displayName: string;
  };
  homeCommons: CommonsSummary;
}

export interface OfferSubmissionOptions {
  request: OfferRequestSummary;
  capabilities: OfferCapabilityOption[];
}

export interface RequestedContributionInput {
  capabilityId: string;
  description: string;
}

export interface SubmitOfferInput {
  commonsAccountingUnits: number | null;
  requestedContributions: RequestedContributionInput[];
}

export interface OfferDetails {
  id: string;
  status: "Active" | "Withdrawn" | "Accepted" | "Closed";
  commonsAccountingUnits: number | null;
  creator: {
    participantId: string;
    displayName: string;
  };
  request: OfferRequestSummary;
  requestedContributions: Array<{
    capabilityId: string;
    capabilityTextSnapshot: string;
    description: string;
  }>;
  agreementId?: string | null;
}

export interface JoinCommonsInput {
  homeCommonsId: string;
  displayName: string;
  bio: string | null;
}

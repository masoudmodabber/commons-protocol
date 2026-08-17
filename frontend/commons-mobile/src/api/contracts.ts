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

export interface JoinCommonsInput {
  homeCommonsId: string;
  displayName: string;
  bio: string | null;
}

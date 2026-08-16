import type {
  CommonsSummary,
  JoinCommonsInput,
  ParticipantProfile,
} from "./contracts";

export const participantProfileQueryKey = ["participant", "me"] as const;
export const availableCommonsQueryKey = ["commons", "available"] as const;

export interface AuthenticatedRequest {
  <T>(path: string, options?: RequestInit): Promise<T>;
}

export interface ParticipantsApi {
  getAvailableCommons(): Promise<CommonsSummary[]>;
  getMyProfile(): Promise<ParticipantProfile>;
  joinCommons(input: JoinCommonsInput): Promise<void>;
}

export function createParticipantsApi(
  request: AuthenticatedRequest,
): ParticipantsApi {
  return {
    getAvailableCommons() {
      return request<CommonsSummary[]>("/api/commons");
    },

    getMyProfile() {
      return request<ParticipantProfile>("/api/participants/me");
    },

    joinCommons(input) {
      return request<void>("/api/participants/me", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
  };
}

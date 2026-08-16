import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ApiError } from "../api/http-client";
import {
  createParticipantsApi,
  participantProfileQueryKey,
} from "../api/participants-api";
import { useSession } from "../auth/session-context";

export function useParticipantProfile() {
  const session = useSession();
  const participantsApi = useMemo(
    () => createParticipantsApi(session.request),
    [session.request],
  );

  return useQuery({
    queryKey: participantProfileQueryKey,
    enabled: session.status === "authenticated",
    retry: false,
    queryFn: async () => {
      try {
        return await participantsApi.getMyProfile();
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return null;
        }

        throw error;
      }
    },
  });
}

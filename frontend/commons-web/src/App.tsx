import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, getProfile, ParticipantProfile } from "./api";
import { Authentication, JoinCommonsPage } from "./entry-pages";
import { navigate, useHashPath } from "./navigation";
import { CapabilitiesPage, ProfilePage } from "./participant-pages";
import {
  AgreementDetailPage,
  MyOffersPage,
  OfferDetailPage,
  RequestOffersPage,
  SubmitOfferPage,
} from "./offer-pages";
import {
  BrowseRequestDetailPage,
  BrowseRequestsPage,
  CreateRequestPage,
  MyRequestsPage,
  RequestDetailPage,
} from "./request-pages";
import { AuthenticatedLayout, PageMessage } from "./ui";

const accessTokenKey = "commons-access-token";

export function App() {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    sessionStorage.getItem(accessTokenKey),
  );
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["participant-profile", accessToken],
    queryFn: () => getProfile(accessToken!),
    enabled: accessToken !== null,
    retry: false,
  });

  function authenticated(token: string) {
    sessionStorage.setItem(accessTokenKey, token);
    navigate("/profile");
    setAccessToken(token);
  }

  function signOut() {
    sessionStorage.removeItem(accessTokenKey);
    setAccessToken(null);
    queryClient.clear();
  }

  if (!accessToken) {
    return <Authentication onAuthenticated={authenticated} />;
  }

  if (profileQuery.isPending) {
    return <PageMessage message="Loading your Commons profile…" />;
  }

  if (profileQuery.isSuccess) {
    return (
      <ParticipantApplication
        profile={profileQuery.data}
        accessToken={accessToken}
        onSignOut={signOut}
      />
    );
  }

  if (profileQuery.error instanceof ApiError && profileQuery.error.status === 404) {
    return <JoinCommonsPage accessToken={accessToken} onSignOut={signOut} />;
  }

  return (
    <PageMessage
      message={profileQuery.error?.message ?? "Your profile could not be loaded."}
      actionLabel="Sign out"
      onAction={signOut}
    />
  );
}

function ParticipantApplication({
  profile,
  accessToken,
  onSignOut,
}: {
  profile: ParticipantProfile;
  accessToken: string;
  onSignOut: () => void;
}) {
  const path = useHashPath();
  const submitOfferMatch = /^\/available-requests\/([^/]+)\/offer$/.exec(path);
  const availableRequestMatch = /^\/available-requests\/([^/]+)$/.exec(path);
  const offerMatch = /^\/offers\/([^/]+)$/.exec(path);
  const agreementMatch = /^\/agreements\/([^/]+)$/.exec(path);
  const requestOffersMatch = /^\/requests\/([^/]+)\/offers$/.exec(path);
  const requestMatch = /^\/requests\/([^/]+)$/.exec(path);

  let page = <ProfilePage profile={profile} />;

  if (path === "/capabilities") {
    page = <CapabilitiesPage profile={profile} accessToken={accessToken} />;
  } else if (path === "/requests") {
    page = <MyRequestsPage accessToken={accessToken} />;
  } else if (path === "/requests/new") {
    page = <CreateRequestPage profile={profile} accessToken={accessToken} />;
  } else if (path === "/available-requests") {
    page = <BrowseRequestsPage accessToken={accessToken} />;
  } else if (path === "/offers") {
    page = <MyOffersPage accessToken={accessToken} />;
  } else if (submitOfferMatch) {
    page = <SubmitOfferPage accessToken={accessToken} requestId={submitOfferMatch[1]} />;
  } else if (availableRequestMatch) {
    page = (
      <BrowseRequestDetailPage
        accessToken={accessToken}
        requestId={availableRequestMatch[1]}
      />
    );
  } else if (offerMatch) {
    page = <OfferDetailPage accessToken={accessToken} offerId={offerMatch[1]} />;
  } else if (agreementMatch) {
    page = (
      <AgreementDetailPage
        accessToken={accessToken}
        agreementId={agreementMatch[1]}
        participantId={profile.id}
      />
    );
  } else if (requestOffersMatch) {
    page = <RequestOffersPage accessToken={accessToken} requestId={requestOffersMatch[1]} />;
  } else if (requestMatch) {
    page = <RequestDetailPage accessToken={accessToken} requestId={requestMatch[1]} />;
  }

  return (
    <AuthenticatedLayout path={path} onSignOut={onSignOut}>
      {page}
    </AuthenticatedLayout>
  );
}

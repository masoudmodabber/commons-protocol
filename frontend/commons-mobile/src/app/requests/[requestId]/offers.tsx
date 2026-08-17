import { useLocalSearchParams } from "expo-router";
import { RequestOffersScreen } from "../../../screens/request-offers-screen";

export default function RequestOffersRoute() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();

  return <RequestOffersScreen requestId={requestId} />;
}

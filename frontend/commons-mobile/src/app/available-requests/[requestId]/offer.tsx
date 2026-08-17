import { useLocalSearchParams } from "expo-router";
import { SubmitOfferScreen } from "../../../screens/submit-offer-screen";

export default function SubmitOfferRoute() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();

  return <SubmitOfferScreen requestId={requestId} />;
}

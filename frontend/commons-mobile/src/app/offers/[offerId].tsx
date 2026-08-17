import { useLocalSearchParams } from "expo-router";
import { OfferDetailScreen } from "../../screens/offer-detail-screen";

export default function OfferDetailRoute() {
  const { offerId } = useLocalSearchParams<{ offerId: string }>();

  return <OfferDetailScreen offerId={offerId} />;
}

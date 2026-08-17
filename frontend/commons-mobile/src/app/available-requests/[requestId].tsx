import { useLocalSearchParams } from "expo-router";
import { BrowseRequestDetailScreen } from "../../screens/browse-request-detail-screen";

export default function BrowseRequestDetailRoute() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();

  return <BrowseRequestDetailScreen requestId={requestId} />;
}

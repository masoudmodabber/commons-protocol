import { useLocalSearchParams } from "expo-router";
import { RequestDetailScreen } from "../../screens/request-detail-screen";

export default function RequestDetailRoute() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();

  return <RequestDetailScreen requestId={requestId} />;
}

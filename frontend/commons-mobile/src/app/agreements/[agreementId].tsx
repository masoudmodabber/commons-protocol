import { useLocalSearchParams } from "expo-router";
import { AgreementDetailScreen } from "../../screens/agreement-detail-screen";

export default function AgreementDetailRoute() {
  const { agreementId } = useLocalSearchParams<{ agreementId: string }>();

  return <AgreementDetailScreen agreementId={agreementId} />;
}

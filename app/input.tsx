import { Redirect } from "expo-router";
import { useLocalSearchParams } from "expo-router";

export default function InputRedirect() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  return (
    <Redirect href={{ pathname: "/", params: section ? { section } : {} }} />
  );
}

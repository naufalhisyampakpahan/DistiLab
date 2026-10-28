import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useApp } from "../state/AppContext";
import { colors } from "../theme";

export function WorkflowNav({
  active,
}: {
  active: "process" | "data" | "result";
}) {
  const app = useApp();
  const steps = [
    {
      id: "process",
      label: "Proses",
      icon: "git-branch-outline",
      route: "/process",
    },
    { id: "data", label: "Data", icon: "options-outline", route: "/input" },
    {
      id: "result",
      label: "Hasil",
      icon: "analytics-outline",
      route: "/result",
    },
  ] as const;
  return (
    <View
      accessibilityRole="tablist"
      style={{ flexDirection: "row", gap: 6, marginBottom: 24 }}
    >
      {steps.map((step) => {
        const selected = active === step.id,
          disabled = step.id === "result" && !app.result;
        return (
          <Pressable
            key={step.id}
            accessibilityRole="tab"
            accessibilityLabel={
              disabled ? "Hasil, hitung data terlebih dahulu" : step.label
            }
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => router.replace(step.route)}
            style={{
              flex: 1,
              minHeight: 52,
              padding: 10,
              borderRadius: 12,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 5,
              backgroundColor: selected ? colors.primary : colors.surface,
              opacity: disabled ? 0.45 : 1,
            }}
          >
            <Ionicons
              name={step.icon}
              size={18}
              color={selected ? colors.surface : colors.primary}
            />
            <Text
              style={{
                color: selected ? colors.surface : colors.primary,
                fontSize: 14,
                fontWeight: "600",
                flexShrink: 1,
              }}
            >
              {step.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

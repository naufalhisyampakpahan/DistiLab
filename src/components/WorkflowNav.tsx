import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useApp } from "../state/AppContext";
import { colors } from "../theme";

export function WorkflowNav({
  active,
}: {
  active: "process" | "data" | "result";
}) {
  const app = useApp();
  const steps = [
    { id: "data", label: "Data", route: "/" },
    {
      id: "result",
      label: "Hasil",
      route: "/(tabs)/result",
    },
  ] as const;
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        marginBottom: 24,
      }}
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
              borderBottomWidth: 2,
              borderBottomColor: selected ? colors.primary : "transparent",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 5,
              backgroundColor: "transparent",
              opacity: disabled ? 0.45 : 1,
            }}
          >
            <Text
              style={{
                color: selected ? colors.primary : colors.muted,
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

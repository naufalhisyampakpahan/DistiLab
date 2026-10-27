import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "../../src/theme";
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11 },
        headerTitleStyle: { fontSize: 17 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "DistiLab",
          tabBarLabel: "Hitung",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calculator-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Studi",
          tabBarLabel: "Studi",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="methodology"
        options={{
          title: "Referensi",
          tabBarLabel: "Referensi",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen name="result" options={{ href: null, title: "DistiLab" }} />
    </Tabs>
  );
}

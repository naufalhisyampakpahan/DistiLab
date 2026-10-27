import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProvider } from "../src/state/AppContext";
import { colors } from "../src/theme";
export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          headerTitleStyle: { fontSize: 17 },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, title: "DistiLab" }}
        />
        <Stack.Screen name="methods" options={{ title: "Pilih metode" }} />
        <Stack.Screen name="process" options={{ title: "Proses distilasi" }} />
        <Stack.Screen
          name="verification"
          options={{ title: "Verifikasi penelitian" }}
        />
        <Stack.Screen
          name="compare"
          options={{ title: "Bandingkan skenario" }}
        />
        <Stack.Screen
          name="input"
          options={{ title: "Parameter perhitungan" }}
        />
        <Stack.Screen name="result" options={{ title: "Hasil perhitungan" }} />
        <Stack.Screen
          name="sensitivity"
          options={{ title: "Analisis sensitivitas" }}
        />
      </Stack>
    </AppProvider>
  );
}

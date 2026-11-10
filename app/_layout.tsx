import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProvider } from "../src/state/AppContext";
import { ThemeProvider, useTheme } from "../src/theme";
import { Appearance, Platform } from "react-native";
import { useEffect } from "react";
import * as SystemUI from "expo-system-ui";
export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppProvider>
        <Navigation />
      </AppProvider>
    </ThemeProvider>
  );
}
function Navigation() {
  const { colors } = useTheme();
  const { mode } = useTheme();
  useEffect(() => {
    if (Platform.OS !== "web") {
      Appearance.setColorScheme(mode);
      void SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
    }
  }, [mode, colors]);

  return (
    <>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
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
          options={{ headerShown: false, title: "Beranda" }}
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
    </>
  );
}

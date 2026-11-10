import React from "react";
import { Text, Pressable } from "react-native";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeProvider, useTheme, darkColors } from "../src/theme";
import { THEME_KEY } from "../src/theme/ThemeContext";
import { useStyles } from "../src/components/ui";
jest.mock("@expo/vector-icons/Ionicons", () => "Icon");
function Probe() {
  const { mode, colors, ready, toggleTheme, error } = useTheme();
  const styles = useStyles();
  return (
    <>
      <Text>{ready ? "ready" : "loading"}</Text>
      <Pressable testID="switch" disabled={!ready} onPress={toggleTheme}>
        <Text>{mode}</Text>
      </Pressable>
      <Text testID="surface" style={styles.panel}>
        {colors.background}
      </Text>
      <Text>{error}</Text>
    </>
  );
}
beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});
test("switches palette and shared styles, persists theme, restores after restart without touching studies", async () => {
  await AsyncStorage.setItem("distilab.studies.v1", "keep");
  const first = render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );
  await waitFor(() => expect(first.getByText("ready")).toBeTruthy());
  fireEvent.press(first.getByTestId("switch"));
  expect(first.getByText("dark")).toBeTruthy();
  expect(first.getByTestId("surface").props.style.backgroundColor).toBe(
    darkColors.surface,
  );
  await waitFor(() =>
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(THEME_KEY, "dark"),
  );
  first.unmount();
  const second = render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );
  await waitFor(() => expect(second.getByText("dark")).toBeTruthy());
  expect(await AsyncStorage.getItem("distilab.studies.v1")).toBe("keep");
  fireEvent.press(second.getByTestId("switch"));
  await waitFor(() =>
    expect(AsyncStorage.setItem).toHaveBeenLastCalledWith(THEME_KEY, "light"),
  );
});
test("shows a storage failure while leaving the selected mode usable", async () => {
  const view = render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );
  await waitFor(() => expect(view.getByText("ready")).toBeTruthy());
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error("disk"));
  await act(async () => {
    fireEvent.press(view.getByTestId("switch"));
  });
  expect(view.getByText("dark")).toBeTruthy();
  expect(
    view.getByText("Tampilan berubah, tetapi pilihannya belum tersimpan."),
  ).toBeTruthy();
});

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { darkColors, lightColors, type ThemeColors } from "./palette";

export type ThemeMode = "light" | "dark";
export const THEME_KEY = "distilab.appearance.v1";
type ThemeValue = {
  mode: ThemeMode;
  colors: ThemeColors;
  ready: boolean;
  error: string;
  toggleTheme: () => void;
};
const ThemeContext = createContext<ThemeValue>({
  mode: "light",
  colors: lightColors,
  ready: true,
  error: "",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: React.PropsWithChildren) {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const saveQueue = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(THEME_KEY)
      .then((value) => {
        if (active && (value === "light" || value === "dark")) setMode(value);
      })
      .catch(() => {
        if (active) setError("Pilihan tampilan belum dapat dimuat.");
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  const value = useMemo<ThemeValue>(
    () => ({
      mode,
      ready,
      error,
      colors: mode === "dark" ? darkColors : lightColors,
      toggleTheme: () => {
        if (!ready) return;
        const next = mode === "dark" ? "light" : "dark";
        setMode(next);
        setError("");
        saveQueue.current = saveQueue.current
          .catch(() => {})
          .then(() => AsyncStorage.setItem(THEME_KEY, next))
          .catch(() =>
            setError("Tampilan berubah, tetapi pilihannya belum tersimpan."),
          );
      },
    }),
    [mode, ready, error],
  );
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
export function useTheme() {
  return useContext(ThemeContext);
}

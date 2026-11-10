import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { KeyboardTypeOptions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme, type ThemeColors } from "../theme";

export function Screen({
  children,
  scrollRef,
  topInset = false,
}: React.PropsWithChildren<{
  scrollRef?: React.RefObject<ScrollView | null>;
  topInset?: boolean;
}>) {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <SafeAreaView
      style={styles.safe}
      edges={
        topInset
          ? ["top", "left", "right", "bottom"]
          : ["left", "right", "bottom"]
      }
    >
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.content}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Heading({
  title,
  description,
  eyebrow,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
}) {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={{ gap: 8, marginBottom: 24 }}>
      {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {description && <Text style={styles.body}>{description}</Text>}
    </View>
  );
}
export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}
export function Note({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View
      accessibilityLiveRegion={error ? "assertive" : "polite"}
      style={[styles.note, error && styles.errorNote]}
    >
      <Text style={[styles.noteText, error && { color: colors.error }]}>
        {children}
      </Text>
    </View>
  );
}
export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  disabled = false,
  busy = false,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "quiet" | "danger";
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  disabled?: boolean;
  busy?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useStyles();

  const bg =
    variant === "primary"
      ? colors.button
      : variant === "danger"
        ? colors.error
        : colors.surface;
  const fg =
    variant === "primary" || variant === "danger"
      ? colors.onButton
      : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderColor:
            variant === "quiet"
              ? "transparent"
              : bg === colors.surface
                ? colors.border
                : bg,
          opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
        },
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        icon && <Ionicons name={icon} size={18} color={fg} />
      )}
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}
export function Field({
  label,
  symbol,
  value,
  onChange,
  help,
  error,
  optional = false,
  numeric = true,
  editable = true,
  compact = false,
}: {
  label: string;
  symbol?: string;
  value: string;
  onChange: (v: string) => void;
  help?: string;
  error?: string;
  optional?: boolean;
  numeric?: boolean;
  editable?: boolean;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useStyles();

  const keyboard: KeyboardTypeOptions = numeric ? "decimal-pad" : "default";
  return (
    <View
      style={[
        styles.field,
        compact && {
          flex: 1,
          minWidth: 90,
          padding: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: error ? colors.error : colors.border,
          backgroundColor: colors.surface,
        },
      ]}
    >
      <View
        style={[
          styles.labelRow,
          compact && {
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 2,
          },
        ]}
      >
        <Text
          style={[styles.label, compact && { fontSize: 12, flex: undefined }]}
        >
          {label}
          {optional ? " (opsional)" : ""}
        </Text>
        {symbol && (
          <Text
            style={[
              styles.symbol,
              compact && { fontSize: 11, color: colors.muted },
            ]}
          >
            {compact ? symbol.split(" · ")[0] : symbol}
          </Text>
        )}
      </View>
      <TextInput
        accessibilityLabel={label}
        editable={editable}
        value={value}
        onChangeText={onChange}
        style={[
          styles.input,
          compact && {
            minHeight: 32,
            paddingHorizontal: 0,
            paddingVertical: 2,
            borderWidth: 0,
            fontSize: 18,
            fontWeight: "600",
          },
          error && { borderColor: colors.error },
        ]}
        keyboardType={keyboard}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={
          numeric ? (compact ? "—" : "Masukkan nilai") : "Nama studi"
        }
        placeholderTextColor={colors.muted}
        returnKeyType="done"
        selectTextOnFocus
      />
      {help && <Text style={styles.caption}>{help}</Text>}
      {error && (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.caption, { color: colors.error }]}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
export function Metric({
  label,
  value,
  unit,
  detail,
}: {
  label: string;
  value: string;
  unit?: string;
  detail?: string;
}) {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.metric}>
      <Text style={styles.caption}>{label}</Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <Text selectable style={styles.metricValue}>
          {value}
        </Text>
        {unit && <Text style={styles.caption}>{unit}</Text>}
      </View>
      {detail && <Text style={styles.caption}>{detail}</Text>}
    </View>
  );
}
export function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.row}>
      <Text style={[styles.body, { flex: 1 }]}>{label}</Text>
      <Text selectable style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}
export function Empty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.empty}>
      <Ionicons name="document-text-outline" size={32} color={colors.muted} />
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={[styles.body, { textAlign: "center" }]}>{description}</Text>
    </View>
  );
}
const make_styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flexGrow: 1, paddingBottom: 24 },
    content: { width: "100%", maxWidth: 720, alignSelf: "center", padding: 24 },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.text,
      lineHeight: 36,
    },
    eyebrow: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1.5,
      color: colors.accent,
    },
    body: { fontSize: 15, lineHeight: 23, color: colors.muted },
    section: { marginBottom: 28, gap: 12 },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      lineHeight: 25,
    },
    note: {
      backgroundColor: colors.subtle,
      borderRadius: 13,
      padding: 14,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    errorNote: {
      backgroundColor: colors.errorLight,
      borderLeftColor: colors.error,
    },
    noteText: { fontSize: 13, lineHeight: 20, color: colors.primary },
    button: {
      minHeight: 48,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    buttonText: { fontSize: 14, fontWeight: "600" },
    field: { gap: 6, marginBottom: 14 },
    labelRow: {
      flexDirection: "row",
      gap: 8,
      alignItems: "baseline",
      justifyContent: "space-between",
    },
    label: { fontSize: 14, fontWeight: "500", color: colors.text, flex: 1 },
    symbol: { fontSize: 14, color: colors.primary, fontWeight: "600" },
    input: {
      minHeight: 48,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 13,
      paddingVertical: 12,
      fontSize: 17,
      color: colors.text,
    },
    caption: { fontSize: 12, lineHeight: 18, color: colors.muted },
    metric: { flex: 1, minWidth: 140, gap: 4, paddingVertical: 14 },
    metricValue: {
      fontSize: 32,
      fontWeight: "600",
      color: colors.primary,
      fontVariant: ["tabular-nums"],
    },
    row: {
      flexDirection: "row",
      gap: 16,
      justifyContent: "space-between",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowValue: {
      flexShrink: 1,
      fontSize: 15,
      fontWeight: "500",
      color: colors.text,
      fontVariant: ["tabular-nums"],
      maxWidth: "60%",
    },
    empty: { paddingVertical: 32, gap: 12, alignItems: "center" },
    panel: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 16,
    },
    actions: { gap: 10 },
    horizontal: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
    link: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "500",
      textDecorationLine: "underline",
    },
    tableHeader: { fontSize: 12, color: colors.muted, fontWeight: "600" },
    tableCell: {
      fontSize: 12,
      color: colors.text,
      fontVariant: ["tabular-nums"],
    },
  });

export function useStyles() {
  const { colors } = useTheme();
  return React.useMemo(() => make_styles(colors), [colors]);
}

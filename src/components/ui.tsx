import React, { useState } from "react";
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
import { colors } from "../theme";

export function Screen({
  children,
  scrollRef,
  footer,
}: React.PropsWithChildren<{
  scrollRef?: React.RefObject<ScrollView | null>;
  footer?: React.ReactNode;
}>) {
  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
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
        {footer && (
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.surface,
            }}
          >
            <View style={[styles.content, { paddingVertical: 10 }]}>
              {footer}
            </View>
          </View>
        )}
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
  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "danger"
        ? colors.error
        : colors.surface;
  const fg =
    variant === "primary" || variant === "danger"
      ? colors.surface
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
}) {
  const [focused, setFocused] = useState(false);
  const keyboard: KeyboardTypeOptions = numeric ? "decimal-pad" : "default";
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label}
          {optional ? " (opsional)" : ""}
        </Text>
        {symbol && <Text style={styles.symbol}>{symbol}</Text>}
      </View>
      <TextInput
        accessibilityLabel={label}
        editable={editable}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          focused && {
            borderColor: colors.accent,
            backgroundColor: colors.accentLight,
          },
          !editable && { backgroundColor: colors.subtle, color: colors.muted },
          error && { borderColor: colors.error },
        ]}
        keyboardType={keyboard}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={numeric ? "Masukkan nilai" : "Nama studi"}
        placeholderTextColor="#939AA5"
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
  return (
    <View style={styles.row}>
      <Text style={[styles.body, { flex: 1 }]}>{label}</Text>
      <Text selectable style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}
export function Disclosure({
  title,
  children,
}: React.PropsWithChildren<{ title: string }>) {
  const [open, setOpen] = useState(false);
  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingVertical: 8,
        marginBottom: 12,
        gap: 12,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((previous) => !previous)}
        style={{
          minHeight: 48,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Text style={[styles.sectionTitle, { flex: 1 }]}>{title}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.primary}
        />
      </Pressable>
      {open && children}
    </View>
  );
}

export function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
      >
        {options.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: value === option.value }}
            onPress={() => onChange(option.value)}
            style={[
              styles.button,
              {
                flexGrow: 1,
                backgroundColor:
                  value === option.value ? colors.accentLight : colors.surface,
                borderColor:
                  value === option.value ? colors.accent : colors.border,
              },
            ]}
          >
            <Ionicons
              name={
                value === option.value ? "radio-button-on" : "radio-button-off"
              }
              color={value === option.value ? colors.accent : colors.muted}
              size={18}
            />
            <Text
              style={[
                styles.buttonText,
                { color: colors.primary, flexShrink: 1 },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
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
  return (
    <View style={styles.empty}>
      <Ionicons name="document-text-outline" size={32} color={colors.muted} />
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={[styles.body, { textAlign: "center" }]}>{description}</Text>
    </View>
  );
}
export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: 24 },
  content: { width: "100%", maxWidth: 800, alignSelf: "center", padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 31,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: colors.accent,
  },
  body: { fontSize: 15, lineHeight: 24, color: colors.muted },
  section: { marginBottom: 28, gap: 12 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 25,
  },
  note: {
    backgroundColor: colors.subtle,
    borderRadius: 6,
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
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "center",
  },
  field: { gap: 6, marginBottom: 14 },
  labelRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
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
    borderRadius: 6,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 17,
    color: colors.text,
  },
  caption: { fontSize: 13, lineHeight: 20, color: colors.muted },
  metric: { flex: 1, minWidth: 140, gap: 4, paddingVertical: 14 },
  metricValue: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.primary,
    fontVariant: ["tabular-nums"],
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: 8,
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
    maxWidth: "100%",
    textAlign: "right",
  },
  empty: { paddingVertical: 32, gap: 12, alignItems: "center" },
  panel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
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

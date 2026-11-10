import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Button, Note, Screen, useStyles } from "../../src/components/ui";
import { useApp } from "../../src/state/AppContext";
import { useTheme } from "../../src/theme";
import { fmt } from "../../src/utils/format";

export default function Home() {
  const app = useApp();
  const { colors, mode, ready, error, toggleTheme } = useTheme();
  const styles = useStyles();
  const last = app.studies[0];
  const active = Object.entries(app.fields).some(
    ([key, value]) => key !== "q" && value.trim() !== "",
  );
  return (
    <Screen topInset>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 36,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 11,
            flex: 1,
          }}
        >
          <View
            style={{
              backgroundColor: colors.button,
              borderRadius: 13,
              padding: 10,
            }}
          >
            <Ionicons name="flask-outline" color={colors.onButton} size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 24, fontWeight: "700", color: colors.text }}
            >
              DistiLab
            </Text>
            <Text style={{ fontSize: 9, lineHeight: 15, color: colors.muted }}>
              LABORATORIUM DISTILASI
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            mode === "light" ? "Aktifkan mode gelap" : "Aktifkan mode terang"
          }
          accessibilityState={{ disabled: !ready }}
          disabled={!ready}
          onPress={toggleTheme}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            minHeight: 44,
            paddingHorizontal: 12,
            borderRadius: 13,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons
            name={mode === "light" ? "moon-outline" : "sunny-outline"}
            size={22}
            color={colors.accent}
          />
          <Text style={{ color: colors.text, fontWeight: "600", fontSize: 13 }}>
            {mode === "light" ? "Gelap" : "Terang"}
          </Text>
        </Pressable>
      </View>
      {error ? <Note error>{error}</Note> : null}
      <Text
        accessibilityRole="header"
        style={{
          color: colors.text,
          fontSize: 29,
          lineHeight: 40,
          fontWeight: "700",
          marginBottom: 14,
        }}
      >
        Simulasi distilasi,{"\n"}lebih mudah.
      </Text>
      <Text style={[styles.body, { marginBottom: 30 }]}>
        Pahami proses, atur parameter, lalu bandingkan hasil pemisahannya.
      </Text>
      <View
        style={{
          backgroundColor: colors.hero,
          padding: 20,
          borderRadius: 22,
          gap: 18,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1, gap: 10 }}>
            <Text
              style={{
                fontSize: 20,
                lineHeight: 28,
                fontWeight: "600",
                color: colors.heroText,
              }}
            >
              Mulai eksplorasimu
            </Text>
            <Text
              style={{ fontSize: 14, lineHeight: 22, color: colors.heroMuted }}
            >
              Dari campuran hingga kebutuhan tahap kolom.
            </Text>
          </View>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              width: 44,
              height: 80,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: "#80BDB1",
              backgroundColor: "#2C5B67",
              paddingHorizontal: 7,
              justifyContent: "space-evenly",
            }}
          >
            {[0, 1, 2, 3].map((n) => (
              <View key={n} style={{ height: 2, backgroundColor: "#9FD8C7" }} />
            ))}
          </View>
        </View>
        <Button
          label="Mulai simulasi"
          icon="arrow-forward-outline"
          disabled={!app.ready}
          onPress={() => {
            app.newCase("research");
            router.push("/process");
          }}
        />
      </View>
      <Text
        style={[
          styles.caption,
          { textAlign: "center", marginTop: 14, marginBottom: 28 },
        ]}
      >
        McCabe–Thiele · Fenske–Underwood–Gilliland
      </Text>
      <Text
        accessibilityRole="header"
        style={[styles.sectionTitle, { fontSize: 16, marginBottom: 16 }]}
      >
        Tiga langkah sederhana
      </Text>
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 22 }}>
        {[
          ["01", "Proses", "Kenali kolom"],
          ["02", "Data", "Atur kondisi"],
          ["03", "Hasil", "Baca analisis"],
        ].map(([n, title, detail]) => (
          <View
            key={n}
            style={{
              flex: 1,
              padding: 12,
              gap: 5,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 18,
            }}
          >
            <Text
              style={{ fontSize: 11, fontWeight: "700", color: colors.accent }}
            >
              {n}
            </Text>
            <Text
              style={{ fontSize: 15, fontWeight: "600", color: colors.text }}
            >
              {title}
            </Text>
            <Text style={{ fontSize: 11, lineHeight: 17, color: colors.muted }}>
              {detail}
            </Text>
          </View>
        ))}
      </View>
      {active && (
        <Button
          label="Lanjutkan kasus aktif"
          variant="quiet"
          icon="git-branch-outline"
          disabled={!app.ready}
          onPress={() => router.push("/process")}
        />
      )}
      {app.storageError ? (
        <Note error>{app.storageError}</Note>
      ) : last ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Buka studi ${last.name}`}
          onPress={() => {
            app.restore(last);
            router.push("/result");
          }}
          style={[styles.panel, { marginTop: 16, gap: 5 }]}
        >
          <Text style={styles.caption}>STUDI TERAKHIR</Text>
          <Text style={styles.sectionTitle}>{last.name}</Text>
          <Text
            style={{ color: colors.primary, fontSize: 20, fontWeight: "600" }}
          >
            {fmt(last.result.N, 2)} tahap teoritis
          </Text>
        </Pressable>
      ) : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginTop: 18,
          marginBottom: 8,
        }}
      >
        <Ionicons name="wifi-outline" color={colors.accent} size={22} />
        <Text style={styles.caption}>Siap dipakai tanpa internet</Text>
      </View>
    </Screen>
  );
}

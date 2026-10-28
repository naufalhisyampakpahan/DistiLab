import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { fenske } from "../src/calculations";
import { calculateWithProfile } from "../src/research/profile";
import { StageExplorer } from "../src/components/StageExplorer";
import { RefluxExplorer } from "../src/components/RefluxExplorer";
import { WorkflowNav } from "../src/components/WorkflowNav";
import {
  Button,
  Empty,
  Field,
  Heading,
  Metric,
  Note,
  Row,
  Screen,
  Section,
  styles,
} from "../src/components/ui";
import { FUGGraph } from "../src/features/fug/FUGGraph";
import { StageTable } from "../src/features/mccabe-thiele/StageTable";
import { useApp } from "../src/state/AppContext";
import { colors } from "../src/theme";
import { ASSUMPTIONS, ENGINE_VERSION } from "../src/types";
import { calculationCSV } from "../src/utils/csv";
import { shareCSV } from "../src/utils/export";
import { dateTime, exact, fmt, methodName } from "../src/utils/format";
export default function Result() {
  const app = useApp(),
    r = app.result;
  const [tab, setTab] = useState<"summary" | "chart" | "steps" | "explore">(
      "summary",
    ),
    [selectedStage, setSelectedStage] = useState(1),
    [name, setName] = useState(""),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setSelectedStage(1);
    setError("");
    setNotice("");
  }, [r]);
  const comparison = useMemo(() => {
    if (!r) return null;
    try {
      return {
        result: calculateWithProfile(
          r.method === "mccabe" ? "fug" : "mccabe",
          r.input,
          app.profile,
        ),
        error: "",
      };
    } catch (e) {
      return {
        result: null,
        error: e instanceof Error ? e.message : "Perbandingan gagal.",
      };
    }
  }, [r, app.profile]);
  if (!r)
    return (
      <Screen>
        <Empty
          title="Hasil belum tersedia"
          description="Isi parameter dan jalankan perhitungan untuk melihat hasil."
        />
        <Button
          label="Buka parameter"
          onPress={() => router.replace("/input")}
        />
      </Screen>
    );
  const action = async (fn: () => Promise<void>, success: string) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
      setNotice(success);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tindakan belum berhasil.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <Heading
        eyebrow={methodName(r.method)}
        title="Hasil perhitungan"
        description={`${dateTime(app.computedAt)} · mesin ${app.resultEngineVersion} · ${app.profile === "research" ? "profil penelitian q=1" : "profil umum"}`}
      />
      <WorkflowNav active="result" />
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          marginBottom: 20,
        }}
      >
        {(
          [
            ["summary", "Ringkasan"],
            ["chart", "Grafik"],
            ["steps", "Perhitungan"],
            ["explore", "Eksplorasi"],
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === key }}
            onPress={() => setTab(key)}
            style={{
              flex: 1,
              minWidth: 75,
              minHeight: 48,
              alignItems: "center",
              justifyContent: "center",
              borderBottomWidth: 2,
              borderBottomColor: tab === key ? colors.accent : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: tab === key ? "600" : "400",
                color: tab === key ? colors.primary : colors.muted,
              }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      {tab === "summary" && (
        <>
          <View style={[styles.panel, { marginBottom: 24 }]}>
            <View style={styles.horizontal}>
              <Metric
                label="Tahap teoritis · N"
                value={fmt(r.N, 4)}
                unit="tahap"
              />
              <Metric
                label="Tahap yang diperlukan"
                value={String(r.Nceil)}
                unit="tahap"
              />
            </View>
            <Text style={styles.caption}>
              Termasuk 1 reboiler kesetimbangan; total condenser tidak dihitung.
              Kebutuhan tray teoritis bulat: {Math.max(0, r.Nceil - 1)}.
            </Text>
          </View>
          <Section title="Batas & kondisi operasi">
            <Row label="Refluks minimum · Rmin" value={fmt(r.Rmin, 6)} />
            <Row label="Refluks operasi · R" value={fmt(r.input.R)} />
            {r.method === "fug" ? (
              <>
                <Row label="Tahap minimum · Nmin" value={fmt(r.Nmin, 6)} />
                <Row label="Akar Underwood · θ" value={fmt(r.theta, 8)} />
                <Row label="Gilliland · X" value={fmt(r.X, 8)} />
                <Row label="Gilliland · Y" value={fmt(r.Y, 8)} />
              </>
            ) : (
              <>
                <Row
                  label="Perkiraan tahap umpan"
                  value={
                    r.feedStage === null
                      ? "Tidak terjadi perpindahan bagian"
                      : `${r.feedStage} dari puncak`
                  }
                />
                <Row
                  label="Titik pinch · (x, y)"
                  value={`(${fmt(r.pinch.x)}, ${fmt(r.pinch.y)})`}
                />
              </>
            )}
            <Row
              label="Status numerik"
              value={`Konvergen · ${r.convergence.iterations} iterasi`}
            />
            <Row
              label="Toleransi algoritma"
              value={String(r.convergence.tolerance)}
            />
          </Section>
          {r.balance && (
            <Section title="Neraca massa">
              <Row
                label="Umpan · F"
                value={`${fmt(r.input.F ?? 0)} kmol/jam`}
              />
              <Row
                label="Distilat · D"
                value={`${fmt(r.balance.D)} kmol/jam`}
              />
              <Row
                label="Produk bawah · B"
                value={`${fmt(r.balance.B)} kmol/jam`}
              />
              <Row
                label="Residual neraca total"
                value={r.balance.totalResidual.toExponential(3)}
              />
              <Row
                label="Residual komponen ringan"
                value={r.balance.componentResidual.toExponential(3)}
              />
            </Section>
          )}
          <Section title="Perbandingan pada input yang sama">
            {app.resultEngineVersion !== ENGINE_VERSION && (
              <Note>
                Hasil dasar tersimpan dari mesin {app.resultEngineVersion};
                pembanding dihitung sekarang dengan mesin {ENGINE_VERSION}.
                Hitung ulang kasus untuk membandingkan kedua metode pada versi
                mesin yang sama.
              </Note>
            )}
            {comparison?.result ? (
              <>
                <View style={styles.horizontal}>
                  <Metric
                    label="McCabe–Thiele"
                    value={fmt(
                      r.method === "mccabe" ? r.N : comparison.result.N,
                    )}
                    unit="tahap"
                  />
                  <Metric
                    label="FUG"
                    value={fmt(r.method === "fug" ? r.N : comparison.result.N)}
                    unit="tahap"
                  />
                </View>
                <Note>
                  Kedua metode menggunakan pendekatan berbeda. Selisih hasil
                  bukan galat eksperimen; keduanya belum dibandingkan dengan
                  data eksperimen.
                </Note>
              </>
            ) : (
              <Note>{comparison?.error}</Note>
            )}
          </Section>
          <Section title="Parameter yang digunakan">
            {(["zF", "xD", "xB", "q", "alpha", "R"] as const).map((key) => (
              <Row
                key={key}
                label={key === "alpha" ? "α" : key}
                value={exact(r.input[key])}
              />
            ))}
            <Row
              label="F (kmol/jam)"
              value={r.input.F === undefined ? "Tidak diisi" : exact(r.input.F)}
            />
          </Section>
        </>
      )}
      {tab === "chart" && (
        <Section
          title={
            r.method === "mccabe"
              ? "Kesetimbangan & tahap"
              : "Kurva tahap operasi"
          }
        >
          {r.method === "mccabe" ? (
            <StageExplorer
              result={r}
              selectedStage={selectedStage}
              onStageSelect={setSelectedStage}
            />
          ) : (
            <FUGGraph result={r} />
          )}
        </Section>
      )}
      {tab === "steps" && (
        <>
          <Section title="Persamaan & substitusi">
            <Note>{`y = αx / [1 + (α − 1)x]\nα = ${fmt(r.input.alpha)}; x = y / [α − (α − 1)y]\nD/F = (zF − xB)/(xD − xB) = ${fmt((r.input.zF - r.input.xB) / (r.input.xD - r.input.xB), 6)}`}</Note>
            {r.method === "mccabe" ? (
              <>
                <Text
                  selectable
                  style={styles.body}
                >{`Rectifying: y = ${fmt(r.rectifying.slope, 6)}x + ${fmt(r.rectifying.intercept, 6)}\nStripping: y = ${fmt(r.stripping.slope, 6)}x + (${fmt(r.stripping.intercept, 6)})\nq-line (bentuk stabil): qx + (1−q)y = zF\n${exact(r.input.q)}x + (${exact(1 - r.input.q)})y = ${exact(r.input.zF)}\nPerpotongan: (${fmt(r.intersection.x, 6)}, ${fmt(r.intersection.y, 6)})`}</Text>
                {r.RminPinch !== undefined && (
                  <Row
                    label="R dari feed pinch (mentah)"
                    value={fmt(r.RminPinch, 6)}
                  />
                )}
                {r.Rflow !== undefined && (
                  <Row
                    label="Batas R dari aliran stripping"
                    value={fmt(r.Rflow, 6)}
                  />
                )}
                <Text style={styles.caption}>
                  Rmin fisik = max(0, Rpinch, Rflow). Langkah terakhir
                  diinterpolasi secara linear pada arah horizontal; nilai
                  pecahan merupakan konvensi grafis.
                </Text>
              </>
            ) : (
              <>
                <Text
                  selectable
                  style={styles.body}
                >{`Fenske:\nNmin = ln[(xD/(1−xD))((1−xB)/xB)] / ln α\n= ln[(${fmt(r.input.xD)}/${fmt(1 - r.input.xD)})(${fmt(1 - r.input.xB)}/${fmt(r.input.xB)})] / ln ${fmt(r.input.alpha)}\n= ${fmt(r.Nmin, 8)}\n\nUnderwood:\nαzF/(α−θ) + (1−zF)/(1−θ) = 1−q\n${fmt(r.input.alpha * r.input.zF)}/(${fmt(r.input.alpha)}−θ) + ${fmt(1 - r.input.zF)}/(1−θ) = ${fmt(1 - r.input.q)}\n1 < θ < α; bisection → θ = ${fmt(r.theta, 8)}\nRmin = αxD/(α−θ) + (1−xD)/(1−θ) − 1\n= ${fmt(r.Rmin, 8)}\n\nGilliland–Molokanov:\nX = (R−Rmin)/(R+1) = ${fmt(r.X, 8)}\nY = 1−exp{[(1+54.4X)/(11+117.2X)]·[(X−1)/√X]}\nY = ${fmt(r.Y, 8)}\nN = (Nmin+Y)/(1−Y) = ${fmt(r.N, 8)}`}</Text>
              </>
            )}
          </Section>
          {r.method === "mccabe" && (
            <Section title="Langkah per tahap">
              <Row
                label="Nmin Fenske (pemeriksaan total reflux)"
                value={fmt(fenske(r.input), 6)}
              />
              <Text style={styles.caption}>
                Fraksi tahap McCabe memakai interpolasi linear komposisi. Pada
                refluks sangat tinggi, nilai desimalnya tidak wajib persis sama
                dengan Fenske yang memakai logaritma; kebutuhan tahap bulat
                mengikuti konvensi yang sama.
              </Text>
              <StageTable
                result={r}
                selectedStage={selectedStage}
                onStageSelect={setSelectedStage}
              />
            </Section>
          )}
        </>
      )}
      {tab === "explore" && (
        <Section title="Eksplorasi refluks">
          <RefluxExplorer
            result={r}
            profile={app.profile}
            onApply={(input) => {
              app.loadInput(input, r.method, {
                profile: app.profile,
                projectId: app.projectId,
                parentStudyId: app.parentStudyId,
              });
              router.push("/input");
            }}
          />
        </Section>
      )}
      <Section title="Asumsi & batasan">
        {ASSUMPTIONS.map((a) => (
          <Text key={a} style={styles.caption}>
            • {a}
          </Text>
        ))}
        <Text style={styles.caption}>
          FUG dibatasi pada feed pinch di antara xB dan xD. Model tidak mencakup
          azeotrop atau volatilitas berubah. Angka ini merupakan tahap teoritis;
          verifikasi eksperimen tetap diperlukan.
        </Text>
      </Section>
      {tab === "explore" ? (
        <Note>
          Untuk menyimpan atau mengekspor pratinjau, pilih Jadikan skenario
          baru, lalu hitung dan simpan di Data. Hasil dasar tetap tersedia pada
          Ringkasan.
        </Note>
      ) : (
        <>
          <View style={[styles.actions, { marginBottom: 24 }]}>
            <Button
              label="Analisis sensitivitas"
              icon="analytics-outline"
              onPress={() => router.push("/sensitivity")}
            />
            <Button
              variant="secondary"
              label="Ubah parameter"
              icon="create-outline"
              onPress={() => router.push("/input")}
            />
          </View>
          <Section title="Simpan & ekspor">
            <Field
              numeric={false}
              label="Nama studi"
              value={name}
              onChange={setName}
            />
            <Button
              label="Simpan studi"
              icon="save-outline"
              busy={busy}
              onPress={() =>
                void action(
                  () => app.save(name),
                  "Studi tersimpan. Buka kembali melalui Riwayat.",
                )
              }
            />
            <Button
              variant="secondary"
              label="Ekspor hasil CSV"
              icon="share-outline"
              disabled={busy}
              onPress={() =>
                void action(
                  () =>
                    shareCSV(
                      calculationCSV(r, {
                        name,
                        createdAt: app.computedAt,
                        engineVersion: app.resultEngineVersion,
                      }),
                      "distilab-hasil",
                    ),
                  "File CSV siap dibagikan atau diunduh.",
                )
              }
            />
            {notice && <Note>{notice}</Note>}
            {error && <Note error>{error}</Note>}
          </Section>
        </>
      )}
    </Screen>
  );
}

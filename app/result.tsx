import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { fenske } from "../src/calculations";
import { calculateWithProfile } from "../src/research/profile";
import { StageExplorer } from "../src/components/StageExplorer";
import { RefluxExplorer } from "../src/components/RefluxExplorer";
import { WorkflowNav } from "../src/components/WorkflowNav";
import { CalculationWalkthrough } from "../src/components/CalculationWalkthrough";
import {
  Button,
  Disclosure,
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
import { dateTime, exact, fmt } from "../src/utils/format";
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
    setTab("summary");
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
        <Button label="Buka parameter" onPress={() => router.replace("/")} />
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
        title={`Hasil · ${r.method === "mccabe" ? "McCabe–Thiele" : "FUG"}`}
      />
      <WorkflowNav active="result" />
      {tab !== "summary" && (
        <Button
          label="Kembali ke ringkasan"
          variant="quiet"
          onPress={() => setTab("summary")}
        />
      )}
      {tab === "summary" && (
        <>
          <View
            style={[
              {
                marginBottom: 24,
                gap: 6,
              },
            ]}
          >
            <Text
              selectable
              style={{
                fontSize: 36,
                fontWeight: "700",
                color: colors.text,
                fontVariant: ["tabular-nums"],
              }}
            >
              {r.Nceil}
              <Text style={{ fontSize: 18 }}> tahap teoritis bulat</Text>
            </Text>
            <Text style={styles.body}>
              N hasil model ≈ {fmt(r.N, 4)} · pembulatan ke atas.
            </Text>
            <Text style={styles.caption}>
              Setara {Math.max(0, r.Nceil - 1)} tray teoritis + 1 reboiler.
              Kondensor total tidak dihitung. Jumlah tray aktual memerlukan
              efisiensi tray, yang belum dimodelkan.
            </Text>
          </View>
          <View style={{ marginBottom: 16 }}>
            <Row label="Refluks operasi · R" value={fmt(r.input.R, 4)} />
            <Row label="Refluks minimum · Rmin" value={fmt(r.Rmin, 4)} />
            <Text style={styles.caption}>
              Perhitungan konvergen pada model yang dipilih. Ini bukan jaminan
              kelayakan kolom nyata.
            </Text>
          </View>
          <Section title="Informasi utama">
            {r.method === "fug" ? (
              <>
                <Row label="Tahap minimum · Nmin" value={fmt(r.Nmin, 6)} />
                <Text style={styles.body}>
                  FUG memperkirakan jumlah tahap dengan korelasi; posisi tahap
                  umpan tidak dihitung oleh metode ini.
                </Text>
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
              </>
            )}
          </Section>
          <Section
            title={
              r.method === "mccabe" ? "Diagram x–y" : "Kurva tahap operasi"
            }
          >
            <Button
              label="Perbesar grafik"
              variant="quiet"
              onPress={() => setTab("chart")}
            />
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
          <View style={{ gap: 8, marginBottom: 20 }}>
            <Button
              label="Perhitungan"
              variant="secondary"
              onPress={() => setTab("steps")}
            />
            <Button
              label="Eksplorasi"
              variant="quiet"
              onPress={() => setTab("explore")}
            />
          </View>
          {r.balance && (
            <Section title="Neraca massa">
              <Row
                label="Umpan · F"
                value={`${fmt(r.input.F ?? 0, 2)} kmol/jam`}
              />
              <Row
                label="Distilat · D"
                value={`${fmt(r.balance.D, 2)} kmol/jam`}
              />
              <Row
                label="Produk bawah · B"
                value={`${fmt(r.balance.B, 2)} kmol/jam`}
              />
              <Text style={styles.caption}>
                F = D + B. Komposisi dinyatakan sebagai fraksi mol, bukan
                persen.
              </Text>
            </Section>
          )}
          {!r.balance && (
            <Note>
              Laju umpan F tidak diisi. Karena itu, aliran distilat D dan produk
              bawah B tidak ditampilkan.
            </Note>
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
                <View>
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
          <Disclosure title="Parameter yang digunakan · presisi penuh">
            {(["zF", "xD", "xB", "q", "alpha", "R"] as const).map((key) => (
              <Row
                key={key}
                label={inputLabels[key]}
                value={exact(r.input[key])}
              />
            ))}
            <Row
              label="F (kmol/jam)"
              value={r.input.F === undefined ? "Tidak diisi" : exact(r.input.F)}
            />
          </Disclosure>
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
            <CalculationWalkthrough result={r} />
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
      <Disclosure title="Detail numerik & ketelitian">
        <Text
          style={styles.caption}
        >{`${dateTime(app.computedAt)} · mesin ${app.resultEngineVersion} · ${app.profile === "research" ? "profil penelitian q=1" : "profil umum"}`}</Text>
        <Note>
          Angka ringkasan dibulatkan agar mudah dibaca. Nilai mesin berikut dan
          ekspor mempertahankan presisi penuh; galat pembulatan tampilan tidak
          dipakai untuk menghitung ulang hasil.
        </Note>
        <Row label="N sebelum pembulatan" value={exact(r.N)} />
        <Row label="Rmin sebelum pembulatan" value={exact(r.Rmin)} />
        <Row
          label="Status numerik"
          value={`Konvergen · ${r.convergence.iterations} iterasi`}
        />
        <Row
          label="Toleransi algoritma"
          value={exact(r.convergence.tolerance)}
        />
        {r.method === "fug" ? (
          <>
            <Row label="Akar Underwood · θ" value={exact(r.theta)} />
            <Row label="Gilliland · X" value={exact(r.X)} />
            <Row label="Gilliland · Y" value={exact(r.Y)} />
          </>
        ) : (
          <>
            <Row
              label="Titik pinch · (x; y)"
              value={`(${exact(r.pinch.x)}; ${exact(r.pinch.y)})`}
            />
            {r.RminPinch !== undefined && (
              <Row
                label="Rpinch (sebelum batas fisik)"
                value={exact(r.RminPinch)}
              />
            )}
            {r.Rflow !== undefined && (
              <Row label="Batas aliran · Rflow" value={exact(r.Rflow)} />
            )}
          </>
        )}
        {r.balance && (
          <>
            <Row
              label="Residual neraca total · kmol/jam"
              value={exact(r.balance.totalResidual)}
            />
            <Row
              label="Residual komponen ringan · kmol/jam"
              value={exact(r.balance.componentResidual)}
            />
          </>
        )}
      </Disclosure>
      <Disclosure title="Asumsi & batasan model">
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
      </Disclosure>
      {tab === "explore" ? (
        <Note>
          Untuk menyimpan atau mengekspor pratinjau, pilih Jadikan skenario
          baru, lalu hitung dan simpan di Data. Hasil dasar tetap tersedia pada
          Ringkasan.
        </Note>
      ) : (
        <>
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
                  "Studi tersimpan. Buka kembali melalui Studi.",
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
          <View style={[styles.actions, { marginBottom: 24 }]}>
            <Button
              variant="secondary"
              label="Analisis sensitivitas"
              icon="analytics-outline"
              onPress={() => router.push("/sensitivity")}
            />
            <Button
              variant="quiet"
              label="Ubah parameter"
              icon="create-outline"
              onPress={() => router.replace("/")}
            />
          </View>
        </>
      )}
    </Screen>
  );
}
const inputLabels = {
  zF: "Komposisi umpan · zF",
  xD: "Komposisi distilat · xD",
  xB: "Komposisi produk bawah · xB",
  q: "Kondisi termal umpan · q",
  alpha: "Volatilitas relatif · α",
  R: "Rasio refluks · R",
};

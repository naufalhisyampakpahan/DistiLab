import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import {
  Button,
  Empty,
  Field,
  Heading,
  Note,
  Screen,
  styles,
} from "../../src/components/ui";
import { useApp } from "../../src/state/AppContext";
import { calculationCSV } from "../../src/utils/csv";
import { shareCSV } from "../../src/utils/export";
import { dateTime, fmt, methodName } from "../../src/utils/format";
import { projectKey, projectTitle } from "../../src/storage/scenarios";
export default function History() {
  const app = useApp();
  const [search, setSearch] = useState(""),
    [confirm, setConfirm] = useState<string | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState<string | null>(null),
    [selected, setSelected] = useState<string[]>([]);
  const filtered = app.studies.filter((s) =>
    `${s.name} ${methodName(s.result.method)} ${projectTitle(s, app.studies)} ${s.caseId ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <Screen>
      <Heading
        title="Proyek dan skenario"
        description="Simpan kasus awal, gandakan sebagai skenario, lalu pilih dua hasil untuk dibandingkan. Data lama tetap tersedia."
      />
      {app.storageError && (
        <View style={{ gap: 12, marginBottom: 16 }}>
          <Note error>{app.storageError}</Note>
          <Button
            variant="secondary"
            label="Coba baca riwayat lagi"
            onPress={() => void app.refresh()}
          />
        </View>
      )}
      {error && <Note error>{error}</Note>}
      {notice && <Note>{notice}</Note>}
      <Field
        numeric={false}
        label="Cari studi, proyek, ID kasus, atau metode"
        value={search}
        onChange={setSearch}
      />
      {app.studies.length >= 2 && (
        <View style={{ gap: 10, marginBottom: 20 }}>
          <Note>
            {
              selected.filter((id) =>
                app.studies.some((study) => study.id === id),
              ).length
            }
            /2 skenario dipilih. Pilih A dan B pada kartu studi; Δ akan
            menunjukkan B − A.
          </Note>
          <Button
            label="Bandingkan dua skenario"
            icon="git-compare-outline"
            disabled={
              selected.length !== 2 ||
              selected.some(
                (id) => !app.studies.some((study) => study.id === id),
              )
            }
            onPress={() =>
              router.push({
                pathname: "/compare",
                params: { left: selected[0], right: selected[1] },
              })
            }
          />
        </View>
      )}
      {filtered.length === 0 ? (
        <Empty
          title={
            app.studies.length === 0
              ? "Belum ada studi"
              : "Tidak ada hasil pencarian"
          }
          description={
            app.studies.length === 0
              ? "Simpan hasil perhitungan untuk meninjau dan menggandakan parameternya."
              : "Ubah kata pencarian untuk menemukan studi."
          }
        />
      ) : (
        filtered.map((study) => (
          <View
            key={study.id}
            style={[styles.panel, { marginBottom: 16, gap: 8 }]}
          >
            <Text style={styles.sectionTitle}>{study.name}</Text>
            <Text style={styles.caption}>
              Proyek: {projectTitle(study, app.studies)} ·{" "}
              {
                app.studies.filter(
                  (item) => projectKey(item) === projectKey(study),
                ).length
              }{" "}
              skenario
            </Text>
            <Text style={styles.caption}>
              {study.profile === "research"
                ? "Profil penelitian · q=1"
                : study.profile === "general"
                  ? "Profil umum"
                  : "Studi versi lama · profil umum"}
              {study.caseId ? ` · ${study.caseId}` : ""}
              {study.parentStudyId ? " · salinan skenario" : ""}
            </Text>
            <Text style={styles.caption}>
              {methodName(study.result.method)} · {dateTime(study.createdAt)}
            </Text>
            <Text style={{ fontSize: 24, color: "#254E70", fontWeight: "600" }}>
              {fmt(study.result.N)}{" "}
              <Text style={styles.caption}>
                tahap · {study.result.Nceil} setelah pembulatan
              </Text>
            </Text>
            <Text style={styles.caption}>
              R = {fmt(study.result.input.R, 2)} · α ={" "}
              {fmt(study.result.input.alpha, 2)} · mesin {study.engineVersion}
            </Text>
            <Button
              variant="secondary"
              label={`Buka ${study.name}`}
              onPress={() => {
                app.restore(study);
                router.push("/result");
              }}
            />
            {app.studies.length >= 2 && (
              <Button
                variant={selected.includes(study.id) ? "primary" : "secondary"}
                label={
                  selected.includes(study.id)
                    ? `${selected.indexOf(study.id) === 0 ? "A" : "B"} dipilih · Lepas ${study.name}`
                    : `Pilih untuk perbandingan: ${study.name}`
                }
                disabled={!selected.includes(study.id) && selected.length >= 2}
                onPress={() =>
                  setSelected((prev) =>
                    prev.includes(study.id)
                      ? prev.filter((id) => id !== study.id)
                      : prev.length < 2
                        ? [...prev, study.id]
                        : prev,
                  )
                }
              />
            )}
            <View style={styles.horizontal}>
              <Button
                variant="quiet"
                label="Gandakan parameter"
                icon="copy-outline"
                onPress={() => {
                  app.restore(study, true);
                  router.push("/input");
                }}
              />
              <Button
                variant="quiet"
                label="Ekspor CSV"
                icon="share-outline"
                disabled={busy !== null}
                onPress={() => {
                  setBusy(study.id);
                  setError("");
                  setNotice("");
                  void shareCSV(
                    calculationCSV(study.result, {
                      name: study.name,
                      createdAt: study.createdAt,
                      engineVersion: study.engineVersion,
                    }),
                    "distilab-studi",
                  )
                    .then(() =>
                      setNotice("CSV studi siap dibagikan atau diunduh."),
                    )
                    .catch((e) =>
                      setError(
                        e instanceof Error ? e.message : "Ekspor gagal.",
                      ),
                    )
                    .finally(() => setBusy(null));
                }}
              />
            </View>
            {confirm === study.id ? (
              <View style={{ gap: 8 }}>
                <Note error>
                  Hapus studi “{study.name}” dari perangkat ini?
                </Note>
                <View style={styles.horizontal}>
                  <Button
                    variant="danger"
                    label="Hapus studi ini"
                    busy={busy === study.id}
                    onPress={() => {
                      setBusy(study.id);
                      setError("");
                      void app
                        .remove(study.id)
                        .then(() => {
                          setConfirm(null);
                          setSelected((prev) =>
                            prev.filter((id) => id !== study.id),
                          );
                          setNotice("Studi telah dihapus.");
                        })
                        .catch((e) =>
                          setError(
                            e instanceof Error
                              ? e.message
                              : "Penghapusan gagal.",
                          ),
                        )
                        .finally(() => setBusy(null));
                    }}
                  />
                  <Button
                    variant="secondary"
                    label="Batal"
                    disabled={busy !== null}
                    onPress={() => setConfirm(null)}
                  />
                </View>
              </View>
            ) : (
              <Button
                variant="quiet"
                label="Hapus"
                icon="trash-outline"
                disabled={busy !== null}
                onPress={() => setConfirm(study.id)}
              />
            )}
          </View>
        ))
      )}
      <Button
        variant="quiet"
        label="Perhitungan Baru"
        icon="add-outline"
        onPress={() => router.push("/methods")}
      />
    </Screen>
  );
}

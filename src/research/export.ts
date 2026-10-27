import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { ResearchRun } from "./runner";
import { researchXLSX } from "./xlsx";

export async function shareResearchXLSX(run: ResearchRun): Promise<void> {
  const bytes = researchXLSX(run);
  const filename = `DistiLab-${run.id}.xlsx`;
  const mimeType =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (Platform.OS === "web") {
    if (
      typeof document === "undefined" ||
      typeof URL.createObjectURL !== "function"
    )
      throw new Error("Unduhan tidak tersedia pada lingkungan ini.");
    const blob = new Blob([new Uint8Array(bytes).buffer], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    try {
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
    } finally {
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    return;
  }
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("Berbagi file belum tersedia pada perangkat ini.");
  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true });
  file.write(bytes);
  await Sharing.shareAsync(file.uri, {
    mimeType,
    dialogTitle: "Ekspor paket verifikasi DistiLab",
    UTI: "org.openxmlformats.spreadsheetml.sheet",
  });
}

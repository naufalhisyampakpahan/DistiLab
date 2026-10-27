import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

export function csvFilename(name: string): string {
  const safe = name
    .replace(/\.csv$/i, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${safe || "distilab"}.csv`;
}

export async function shareCSV(csv: string, name: string): Promise<void> {
  const filename = csvFilename(name);
  // BOM lets spreadsheet software recognize Indonesian labels and mathematical symbols as UTF-8.
  const content = `\uFEFF${csv}`;
  if (Platform.OS === "web") {
    if (
      typeof document === "undefined" ||
      typeof URL.createObjectURL !== "function"
    ) {
      throw new Error(
        "Unduhan CSV tidak tersedia di lingkungan ini. Buka DistiLab di browser atau Android.",
      );
    }
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    try {
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
    } finally {
      anchor.remove();
      // Allow the browser to consume the URL before releasing it.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    return;
  }
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("Berbagi file belum tersedia pada perangkat ini.");
  const file = new File(Paths.cache, `${Date.now()}-${filename}`);
  try {
    file.create({ overwrite: true });
    file.write(content);
    await Sharing.shareAsync(file.uri, {
      mimeType: "text/csv",
      dialogTitle: "Ekspor data DistiLab",
      UTI: "public.comma-separated-values-text",
    });
  } catch (error) {
    throw new Error(
      `CSV belum dapat diekspor: ${error instanceof Error ? error.message : "periksa ruang penyimpanan dan coba lagi"}`,
    );
  }
}

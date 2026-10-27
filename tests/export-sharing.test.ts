import { File } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { csvFilename, shareCSV } from "../src/utils/export";

const mockCreate = jest.fn();
const mockWrite = jest.fn();
jest.mock("expo-file-system", () => ({
  Paths: { cache: "file:///cache" },
  File: jest.fn().mockImplementation(() => ({
    uri: "file:///cache/export.csv",
    create: mockCreate,
    write: mockWrite,
  })),
}));
jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => undefined),
}));
jest.mock("react-native", () => ({ Platform: { OS: "android" } }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(Sharing.isAvailableAsync).mockResolvedValue(true);
  (Platform as unknown as { OS: string }).OS = "android";
});

test("native sharing writes UTF-8 CSV to cache and uses CSV MIME metadata", async () => {
  await shareCSV("N,10\r\n", "Studi / demonstrasi.csv");
  expect(File).toHaveBeenCalledWith(
    "file:///cache",
    expect.stringMatching(/Studi-demonstrasi\.csv$/),
  );
  expect(mockWrite).toHaveBeenCalledWith("\uFEFFN,10\r\n");
  expect(Sharing.shareAsync).toHaveBeenCalledWith(
    "file:///cache/export.csv",
    expect.objectContaining({ mimeType: "text/csv" }),
  );
});

test("file names cannot escape the cache directory", () => {
  expect(csvFilename("../../bad\\name.csv")).toBe("bad-name.csv");
  expect(csvFilename("")).toBe("distilab.csv");
});

test("unavailable sharing reports failure before creating a file", async () => {
  jest.mocked(Sharing.isAvailableAsync).mockResolvedValue(false);
  await expect(shareCSV("test", "study")).rejects.toThrow("Berbagi file");
  expect(File).not.toHaveBeenCalled();
});

test("web export downloads a Blob without calling unsupported native file APIs", async () => {
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  );
  const originalCreate = Object.getOwnPropertyDescriptor(
    URL,
    "createObjectURL",
  );
  const originalRevoke = Object.getOwnPropertyDescriptor(
    URL,
    "revokeObjectURL",
  );
  const anchor = {
    href: "",
    download: "",
    click: jest.fn(),
    remove: jest.fn(),
  };
  const append = jest.fn();
  const createURL = jest.fn(() => "blob:distilab-test");
  const revoke = jest.fn();
  jest.useFakeTimers();
  (Platform as unknown as { OS: string }).OS = "web";
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { createElement: () => anchor, body: { appendChild: append } },
  });
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: createURL,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: revoke,
  });
  try {
    await shareCSV("N,10\r\n", "web-study");
    expect(anchor.download).toBe("web-study.csv");
    expect(anchor.href).toBe("blob:distilab-test");
    expect(anchor.click).toHaveBeenCalledTimes(1);
    expect(anchor.remove).toHaveBeenCalledTimes(1);
    expect(append).toHaveBeenCalledWith(anchor);
    expect(File).not.toHaveBeenCalled();
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    expect(revoke).toHaveBeenCalledWith("blob:distilab-test");
  } finally {
    if (originalDocument)
      Object.defineProperty(globalThis, "document", originalDocument);
    else Reflect.deleteProperty(globalThis, "document");
    if (originalCreate)
      Object.defineProperty(URL, "createObjectURL", originalCreate);
    else Reflect.deleteProperty(URL, "createObjectURL");
    if (originalRevoke)
      Object.defineProperty(URL, "revokeObjectURL", originalRevoke);
    else Reflect.deleteProperty(URL, "revokeObjectURL");
    jest.useRealTimers();
  }
});

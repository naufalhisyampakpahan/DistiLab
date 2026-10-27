import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  BinaryInput,
  CalculationResult,
  CalculationProfile,
  Method,
  Point,
  Study,
} from "../types";

export const STORAGE_KEYS = {
  studies: "@distilab/studies:v1",
  draft: "@distilab/draft:v1",
} as const;

export interface Draft {
  method: Method;
  fields: Record<string, string>;
  profile?: CalculationProfile;
  projectId?: string;
  parentStudyId?: string;
  caseId?: string;
  protocolVersion?: string;
}

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: "corrupt" | "unavailable" | "invalid",
  ) {
    super(message);
    this.name = "StorageError";
  }
}

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const positive = (value: unknown): value is number =>
  finite(value) && value > 0;
const nonnegative = (value: unknown): value is number =>
  finite(value) && value >= 0;
const unit = (value: unknown): value is number =>
  finite(value) && value >= -1e-9 && value <= 1 + 1e-9;
const text = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const point = (value: unknown): value is Point =>
  object(value) && unit(value.x) && unit(value.y);
const line = (value: unknown): boolean =>
  object(value) && finite(value.slope) && finite(value.intercept);

function input(value: unknown): value is BinaryInput {
  return (
    object(value) &&
    unit(value.zF) &&
    unit(value.xD) &&
    unit(value.xB) &&
    value.xB > 0 &&
    value.xD < 1 &&
    value.xD > value.zF &&
    value.zF > value.xB &&
    finite(value.q) &&
    value.q >= 0 &&
    value.q <= 1 &&
    finite(value.alpha) &&
    value.alpha > 1 &&
    nonnegative(value.R) &&
    (value.F === undefined || positive(value.F))
  );
}

function result(value: unknown): value is CalculationResult {
  if (
    !object(value) ||
    !input(value.input) ||
    !positive(value.N) ||
    !Number.isInteger(value.Nceil) ||
    value.Nceil !== Math.ceil(value.N) ||
    !nonnegative(value.Rmin) ||
    !object(value.convergence) ||
    value.convergence.converged !== true ||
    !Number.isInteger(value.convergence.iterations) ||
    !nonnegative(value.convergence.iterations) ||
    !positive(value.convergence.tolerance)
  )
    return false;
  if (
    value.balance !== undefined &&
    (!object(value.balance) ||
      !positive(value.balance.D) ||
      !positive(value.balance.B) ||
      !finite(value.balance.totalResidual) ||
      !finite(value.balance.componentResidual))
  )
    return false;
  if (value.method === "fug") {
    return (
      positive(value.Nmin) &&
      value.N >= value.Nmin &&
      finite(value.theta) &&
      value.theta > 1 &&
      value.theta < value.input.alpha &&
      unit(value.X) &&
      unit(value.Y) &&
      (value.underwoodRawRmin === undefined || finite(value.underwoodRawRmin))
    );
  }
  if (
    value.method !== "mccabe" ||
    !point(value.pinch) ||
    !point(value.intersection) ||
    !(value.RminPinch === undefined || finite(value.RminPinch)) ||
    !(value.Rflow === undefined || nonnegative(value.Rflow)) ||
    !line(value.rectifying) ||
    !line(value.stripping) ||
    !Array.isArray(value.qLine) ||
    value.qLine.length < 2 ||
    !value.qLine.every(point) ||
    !Array.isArray(value.equilibriumCurve) ||
    value.equilibriumCurve.length < 2 ||
    !value.equilibriumCurve.every(point) ||
    !Array.isArray(value.staircase) ||
    value.staircase.length < 2 ||
    !value.staircase.every(point) ||
    !Array.isArray(value.stages) ||
    value.stages.length < 1 ||
    !(
      value.feedStage === null ||
      (Number.isInteger(value.feedStage) && positive(value.feedStage))
    )
  )
    return false;
  return value.stages.every(
    (stage, i) =>
      object(stage) &&
      stage.number === i + 1 &&
      point(stage.start) &&
      point(stage.equilibrium) &&
      point(stage.end) &&
      (stage.section === "rectifying" || stage.section === "stripping") &&
      positive(stage.fraction) &&
      stage.fraction <= 1,
  );
}

export function isStudy(value: unknown): value is Study {
  return (
    object(value) &&
    text(value.id) &&
    text(value.name) &&
    typeof value.createdAt === "string" &&
    Number.isFinite(Date.parse(value.createdAt)) &&
    text(value.engineVersion) &&
    result(value.result) &&
    metadata(value) &&
    (value.parentStudyId === undefined || value.parentStudyId !== value.id) &&
    (value.profile !== "research" ||
      (value.result.input.q === 1 && positive(value.result.input.F)))
  );
}

function metadata(value: Record<string, unknown>): boolean {
  return (
    (value.profile === undefined ||
      value.profile === "general" ||
      value.profile === "research") &&
    (value.projectId === undefined || text(value.projectId)) &&
    (value.parentStudyId === undefined || text(value.parentStudyId)) &&
    (value.caseId === undefined || text(value.caseId)) &&
    (value.protocolVersion === undefined || text(value.protocolVersion))
  );
}

function isDraft(value: unknown): value is Draft {
  return (
    object(value) &&
    (value.method === "mccabe" || value.method === "fug") &&
    object(value.fields) &&
    Object.values(value.fields).every((field) => typeof field === "string") &&
    metadata(value)
  );
}

// A single queue makes read-modify-write operations atomic within this app session.
// A rejected operation must not prevent a later operation from running.
let writeQueue: Promise<void> = Promise.resolve();
function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const pending = writeQueue.then(operation);
  writeQueue = pending.then(
    () => undefined,
    () => undefined,
  );
  return pending;
}

async function read(key: string): Promise<unknown | null> {
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(key);
  } catch {
    throw new StorageError(
      "Penyimpanan lokal tidak dapat dibaca. Silakan coba lagi.",
      "unavailable",
    );
  }
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new StorageError(
      "Data lokal rusak dan tetap dipertahankan. Data tersebut belum dapat dibuka atau ditimpa.",
      "corrupt",
    );
  }
}

async function write(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new StorageError(
      "Data belum tersimpan. Periksa ruang penyimpanan lalu coba lagi.",
      "unavailable",
    );
  }
}

async function readStudies(): Promise<Study[]> {
  const saved = await read(STORAGE_KEYS.studies);
  if (saved === null) return [];
  if (
    !object(saved) ||
    saved.version !== 1 ||
    !Array.isArray(saved.studies) ||
    !saved.studies.every(isStudy) ||
    new Set(saved.studies.map((study) => study.id)).size !==
      saved.studies.length
  ) {
    throw new StorageError(
      "Format riwayat lokal tidak valid. Data asli tetap dipertahankan dan tidak ditimpa.",
      "corrupt",
    );
  }
  return saved.studies.sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export async function loadStudies(): Promise<Study[]> {
  await writeQueue;
  return readStudies();
}

export function saveStudy(study: Study): Promise<void> {
  // Snapshot the caller's object before waiting, so later UI edits cannot change the saved record.
  if (!isStudy(study))
    return Promise.reject(
      new StorageError(
        "Hasil studi tidak valid dan tidak dapat disimpan.",
        "invalid",
      ),
    );
  const snapshot = JSON.parse(JSON.stringify(study)) as Study;
  return enqueue(async () => {
    const studies = await readStudies();
    const updated = studies.filter((item) => item.id !== snapshot.id);
    updated.push(snapshot);
    updated.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    await write(STORAGE_KEYS.studies, { version: 1, studies: updated });
  });
}

export function deleteStudy(id: string): Promise<void> {
  if (!text(id))
    return Promise.reject(
      new StorageError("Identitas studi tidak valid.", "invalid"),
    );
  return enqueue(async () => {
    const studies = await readStudies();
    await write(STORAGE_KEYS.studies, {
      version: 1,
      studies: studies.filter((item) => item.id !== id),
    });
  });
}

export async function loadDraft(): Promise<Draft | null> {
  await writeQueue;
  const saved = await read(STORAGE_KEYS.draft);
  if (saved === null) return null;
  if (!object(saved) || saved.version !== 1 || !isDraft(saved.draft)) {
    throw new StorageError(
      "Parameter terakhir tidak dapat dibaca. Data asli tetap dipertahankan.",
      "corrupt",
    );
  }
  return saved.draft;
}

export function saveDraft(draft: Draft): Promise<void> {
  if (!isDraft(draft))
    return Promise.reject(
      new StorageError("Format parameter terakhir tidak valid.", "invalid"),
    );
  const snapshot: Draft = {
    method: draft.method,
    fields: { ...draft.fields },
    profile: draft.profile,
    projectId: draft.projectId,
    parentStudyId: draft.parentStudyId,
    caseId: draft.caseId,
    protocolVersion: draft.protocolVersion,
  };
  return enqueue(async () => {
    // Refuse to overwrite a corrupt draft just as we refuse to overwrite a corrupt history.
    const saved = await read(STORAGE_KEYS.draft);
    if (
      saved !== null &&
      (!object(saved) || saved.version !== 1 || !isDraft(saved.draft))
    ) {
      throw new StorageError(
        "Parameter lokal rusak dan tidak ditimpa.",
        "corrupt",
      );
    }
    await write(STORAGE_KEYS.draft, { version: 1, draft: snapshot });
  });
}

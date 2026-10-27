import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  calculateWithProfile,
  validateResearchInput,
} from "../research/profile";
import { validateInput } from "../validation";
import { BLANK_FIELDS, inputFields, parseFields } from "../utils/draft";
import type { Fields } from "../utils/draft";
export { inputFields } from "../utils/draft";
export type { Fields } from "../utils/draft";
import {
  deleteStudy,
  loadDraft,
  loadStudies,
  saveDraft,
  saveStudy,
} from "../storage";
import {
  BinaryInput,
  CalculationResult,
  DEMO_INPUT,
  ENGINE_VERSION,
  Method,
  Study,
  CalculationProfile,
} from "../types";
const blank = BLANK_FIELDS;
export interface CaseOptions {
  profile?: CalculationProfile;
  projectId?: string;
  parentStudyId?: string;
  caseId?: string;
  protocolVersion?: string;
  sourceEngineVersion?: string;
  sourceComputedAt?: string;
}
type CaseLineage = Pick<
  CaseOptions,
  "projectId" | "parentStudyId" | "caseId" | "protocolVersion"
>;
interface AppState {
  method: Method;
  fields: Fields;
  result: CalculationResult | null;
  computedAt: string;
  resultEngineVersion: string;
  studies: Study[];
  ready: boolean;
  storageError: string;
  profile: CalculationProfile;
  projectId?: string;
  parentStudyId?: string;
  caseId?: string;
  setProfile: (profile: CalculationProfile) => void;
  newCase: (profile?: CalculationProfile) => void;
  loadInput: (
    input: BinaryInput,
    method?: Method,
    options?: CaseOptions,
  ) => void;
  adoptResult: (result: CalculationResult, options?: CaseOptions) => void;
  setMethod: (m: Method) => void;
  setField: (key: keyof Fields, value: string) => void;
  demo: () => void;
  compute: () => CalculationResult;
  restore: (s: Study, duplicate?: boolean) => void;
  save: (name: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}
const AppContext = createContext<AppState | null>(null);
export function AppProvider({ children }: React.PropsWithChildren) {
  const [method, setMethodState] = useState<Method>("mccabe"),
    [fields, setFields] = useState<Fields>(blank),
    [result, setResult] = useState<CalculationResult | null>(null),
    [computedAt, setComputedAt] = useState(""),
    [studies, setStudies] = useState<Study[]>([]),
    [ready, setReady] = useState(false),
    [storageError, setStorageError] = useState(""),
    [profile, setProfileState] = useState<CalculationProfile>("general"),
    [lineage, setLineage] = useState<CaseLineage>({}),
    [resultEngineVersion, setResultEngineVersion] = useState(ENGINE_VERSION);
  const mounted = useRef(true);
  const workingRevision = useRef(0);
  const refresh = useCallback(async () => {
    try {
      const saved = await loadStudies();
      if (mounted.current) {
        setStudies(saved);
        setStorageError("");
      }
    } catch (e) {
      if (mounted.current)
        setStorageError(
          e instanceof Error ? e.message : "Riwayat gagal dibaca.",
        );
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    void (async () => {
      await refresh();
      try {
        const draft = await loadDraft();
        if (draft && mounted.current) {
          setMethodState(draft.method);
          setProfileState(draft.profile ?? "general");
          setLineage({
            projectId: draft.projectId,
            parentStudyId: draft.parentStudyId,
            caseId: draft.caseId,
            protocolVersion: draft.protocolVersion,
          });
          setFields({
            ...blank,
            ...Object.fromEntries(
              Object.keys(blank).map((key) => [key, draft.fields[key] ?? ""]),
            ),
          } as Fields);
        }
      } catch (e) {
        if (mounted.current)
          setStorageError(
            e instanceof Error ? e.message : "Parameter terakhir gagal dibaca.",
          );
      } finally {
        if (mounted.current) setReady(true);
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, [refresh]);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      void saveDraft({ method, fields, profile, ...lineage }).catch((e) => {
        if (mounted.current)
          setStorageError(
            e instanceof Error ? e.message : "Parameter gagal disimpan.",
          );
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [fields, method, profile, lineage, ready]);
  const invalidate = () => {
    workingRevision.current += 1;
    setResult(null);
    setComputedAt("");
  };
  const setProfile = (next: CalculationProfile) => {
    if (next === profile) return;
    setProfileState(next);
    if (next === "research")
      setFields((previous) => ({
        ...previous,
        q: "1",
        F: previous.F || "100",
      }));
    setLineage((previous) => ({
      ...previous,
      caseId: undefined,
      protocolVersion: undefined,
    }));
    invalidate();
  };
  const newCase = (next: CalculationProfile = "research") => {
    setMethodState("mccabe");
    setProfileState(next);
    setFields(
      next === "research" ? { ...blank, q: "1", F: "100" } : { ...blank },
    );
    setLineage({});
    invalidate();
  };
  const loadInput = (
    input: BinaryInput,
    nextMethod: Method = method,
    options: CaseOptions = {},
  ) => {
    const nextProfile =
      options.profile ??
      (input.q === 1 && input.F !== undefined ? profile : "general");
    setFields(inputFields(input));
    setMethodState(nextMethod);
    setProfileState(nextProfile);
    setLineage({
      projectId: options.projectId,
      parentStudyId: options.parentStudyId,
      caseId: options.caseId,
      protocolVersion: options.protocolVersion,
    });
    invalidate();
  };
  const adoptResult = (
    calculated: CalculationResult,
    options: CaseOptions = {},
  ) => {
    const nextProfile = options.profile ?? profile;
    validateInput(calculated.input);
    if (nextProfile === "research") validateResearchInput(calculated.input);
    if (
      options.sourceComputedAt !== undefined &&
      !Number.isFinite(Date.parse(options.sourceComputedAt))
    )
      throw new Error("Waktu sumber hasil tidak valid.");
    loadInput(calculated.input, calculated.method, {
      ...options,
      profile: nextProfile,
    });
    setResult(calculated);
    setComputedAt(options.sourceComputedAt ?? new Date().toISOString());
    setResultEngineVersion(options.sourceEngineVersion ?? ENGINE_VERSION);
  };
  const setMethod = (m: Method) => {
    setMethodState(m);
    invalidate();
  };
  const setField = (key: keyof Fields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (fields[key] !== value)
      setLineage((previous) => ({
        ...previous,
        caseId: undefined,
        protocolVersion: undefined,
      }));
    invalidate();
  };
  const demo = () => {
    setFields(
      inputFields(
        profile === "research" ? { ...DEMO_INPUT, F: 100 } : DEMO_INPUT,
      ),
    );
    setLineage({});
    invalidate();
  };
  const compute = () => {
    const p = parseFields(fields);
    const calculated = calculateWithProfile(method, p, profile);
    workingRevision.current += 1;
    setResult(calculated);
    setResultEngineVersion(ENGINE_VERSION);
    setComputedAt(new Date().toISOString());
    return calculated;
  };
  const restore = (study: Study, duplicate = false) => {
    workingRevision.current += 1;
    setMethodState(study.result.method);
    setProfileState(study.profile ?? "general");
    setLineage({
      projectId: study.projectId ?? study.id,
      parentStudyId: study.id,
      caseId: study.caseId,
      protocolVersion: study.protocolVersion,
    });
    setFields(inputFields(study.result.input));
    setResult(duplicate ? null : study.result);
    setComputedAt(study.createdAt);
    setResultEngineVersion(study.engineVersion);
  };
  const save = async (name: string) => {
    if (!result) throw new Error("Jalankan perhitungan sebelum menyimpan.");
    if (!name.trim()) throw new Error("Isi nama studi.");
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const revision = workingRevision.current;
    const study: Study = {
      id,
      name: name.trim(),
      createdAt: computedAt,
      engineVersion: resultEngineVersion,
      result,
      profile,
      projectId: lineage.projectId ?? id,
      parentStudyId: lineage.parentStudyId,
      caseId: lineage.caseId,
      protocolVersion: lineage.protocolVersion,
    };
    await saveStudy(study);
    await refresh();
    if (mounted.current && workingRevision.current === revision) {
      setLineage((previous) => ({
        ...previous,
        projectId: study.projectId ?? study.id,
        parentStudyId: study.id,
      }));
    }
  };
  const remove = async (id: string) => {
    await deleteStudy(id);
    await refresh();
  };
  return (
    <AppContext.Provider
      value={{
        method,
        fields,
        result,
        computedAt,
        resultEngineVersion,
        studies,
        ready,
        storageError,
        profile,
        projectId: lineage.projectId,
        parentStudyId: lineage.parentStudyId,
        caseId: lineage.caseId,
        setProfile,
        newCase,
        loadInput,
        adoptResult,
        setMethod,
        setField,
        demo,
        compute,
        restore,
        save,
        remove,
        refresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export function useApp(): AppState {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppProvider belum tersedia.");
  return context;
}

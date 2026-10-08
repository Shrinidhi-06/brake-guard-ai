import { useSyncExternalStore } from "react";
import { SEED_INSPECTIONS } from "@/lib/mock/data";
import type { Inspection } from "@/types";

/**
 * Local data layer (demo). Persists to localStorage.
 * Replace the bodies of these functions with Lovable Cloud / Postgres calls later.
 */
const KEY = "autosentinel.inspections.v1";
const SETTINGS_KEY = "autosentinel.settings.v1";

let saved: Inspection[] = [];
let loaded = false;
const listeners = new Set<() => void>();
let snapshot: Inspection[] = SEED_INSPECTIONS;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    saved = JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    saved = [];
  }
  snapshot = [...saved, ...SEED_INSPECTIONS];
}

function emit() {
  snapshot = [...saved, ...SEED_INSPECTIONS];
  try {
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    /* quota (large data urls) — keep in memory */
  }
  listeners.forEach((l) => l());
}

export function saveInspection(i: Inspection) {
  load();
  saved = [i, ...saved];
  emit();
}

export function clearSavedInspections() {
  load();
  saved = [];
  emit();
}

export function nextComponentId() {
  load();
  return `BD-${10285 + saved.length}`;
}
export function nextInspectionId() {
  load();
  return `INS-${2041 + saved.length}`;
}

export function useInspections() {
  return useSyncExternalStore(
    (cb) => {
      load();
      listeners.add(cb);
      cb();
      return () => listeners.delete(cb);
    },
    () => {
      load();
      return snapshot;
    },
    () => SEED_INSPECTIONS,
  );
}

export function useSavedCount() {
  const all = useInspections();
  return all.length - SEED_INSPECTIONS.length;
}

export interface Settings {
  threshold: number;
  autoAnalysis: boolean;
  saveHistory: boolean;
  highRiskAlerts: boolean;
  line: string;
  interval: string;
}
export const DEFAULT_SETTINGS: Settings = {
  threshold: 80,
  autoAnalysis: false,
  saveHistory: true,
  highRiskAlerts: true,
  line: "line-a",
  interval: "1000",
};
export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
export function persistSettings(s: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

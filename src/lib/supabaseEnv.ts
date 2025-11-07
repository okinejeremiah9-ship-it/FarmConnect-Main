import type { SupabaseClientOptions } from "@supabase/supabase-js";

type EnvRecord = Record<string, string | undefined>;

type SupabaseConfig = {
  url: string;
  anonKey: string;
};

const URL_ENV_KEYS = [
  "VITE_SUPABASE_URL",
  "PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
];

const ANON_KEY_ENV_KEYS = [
  "VITE_SUPABASE_ANON_KEY",
  "PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_ANON_KEY",
];

const globalAny: Record<string, unknown> | undefined =
  typeof globalThis !== "undefined" ? (globalThis as Record<string, unknown>) : undefined;

const processEnv = ((): EnvRecord | undefined => {
  if (!globalAny) {
    return undefined;
  }
  const processCandidate = globalAny.process as { env?: unknown } | undefined;
  if (!processCandidate || typeof processCandidate.env !== "object") {
    return undefined;
  }
  return processCandidate.env as EnvRecord;
})();

const runtimeEnvSources: EnvRecord[] = [
  (import.meta.env ?? {}) as EnvRecord,
  ...(processEnv ? [processEnv] : []),
  ...collectRuntimeEnvCandidates(["__ENV__", "__env__", "__supabase", "__SUPABASE", "__SUPABASE_CONFIG__", "env"]),
];

function collectRuntimeEnvCandidates(keys: string[]): EnvRecord[] {
  if (!globalAny) {
    return [];
  }

  return keys
    .map((key) => globalAny[key])
    .filter((value): value is EnvRecord =>
      typeof value === "object" && value !== null,
    );
}

function selectEnvValue(keys: string[]): string | undefined {
  for (const source of runtimeEnvSources) {
    for (const key of keys) {
      const raw = source?.[key];
      if (isMeaningful(raw)) {
        return raw.trim();
      }
    }
  }
  return undefined;
}

function isMeaningful(value: string | undefined): value is string {
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed !== "undefined" && trimmed !== "null";
}

function formatMissingEnvMessage(missingUrl: boolean, missingAnonKey: boolean): string {
  const missingParts: string[] = [];

  if (missingUrl) {
    missingParts.push(
      `Supabase project URL (checked keys: ${URL_ENV_KEYS.join(", ")})`,
    );
  }
  if (missingAnonKey) {
    missingParts.push(
      `Supabase anon key (checked keys: ${ANON_KEY_ENV_KEYS.join(", ")})`,
    );
  }

  return `Supabase configuration missing: ${missingParts.join(
    " and ",
  )}. Add the values to your environment (see .env.example).`;
}

export function resolveSupabaseConfig(): SupabaseConfig {
  const url = selectEnvValue(URL_ENV_KEYS);
  const anonKey = selectEnvValue(ANON_KEY_ENV_KEYS);

  if (!url || !anonKey) {
    const message = formatMissingEnvMessage(!url, !anonKey);
    console.error("[Supabase]", message, {
      triedUrlKeys: URL_ENV_KEYS,
      triedAnonKeyKeys: ANON_KEY_ENV_KEYS,
    });
    throw new Error(message);
  }

  return { url, anonKey };
}

export type { SupabaseConfig, SupabaseClientOptions };

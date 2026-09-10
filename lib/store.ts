import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createDefaultState } from "./plan";
import { isAppState, mergeWithDefaults } from "./state";
import type { AppState, StatePayload, StorageBackend } from "./types";

const STORE_NAME = "training-app";
const STATE_KEY = "app-state";
const LOCAL_DIR = path.join(process.cwd(), ".data");
const LOCAL_FILE = path.join(LOCAL_DIR, "app-state.json");

type BlobLike = {
  get: (key: string, options: { type: "json" }) => Promise<unknown>;
  setJSON: (key: string, value: unknown) => Promise<unknown>;
};

function blobsCredentials() {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token =
    process.env.NETLIFY_BLOBS_TOKEN ||
    process.env.NETLIFY_AUTH_TOKEN ||
    process.env.NETLIFY_TOKEN;
  if (siteID && token) return { siteID, token };
  return null;
}

function canUseAutoContext() {
  return Boolean(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT);
}

async function getBlobStore(): Promise<BlobLike | null> {
  try {
    const { getStore } = await import("@netlify/blobs");
    const credentials = blobsCredentials();
    if (credentials) {
      return getStore({
        name: STORE_NAME,
        siteID: credentials.siteID,
        token: credentials.token,
        consistency: "strong",
      });
    }
    if (canUseAutoContext()) {
      return getStore({ name: STORE_NAME, consistency: "strong" });
    }
  } catch {
    return null;
  }
  return null;
}

async function readLocal(): Promise<AppState | null> {
  try {
    const raw = JSON.parse(await readFile(LOCAL_FILE, "utf8"));
    const state = mergeWithDefaults(raw);
    if (!isAppState(raw)) await writeLocal(state);
    return state;
  } catch {
    return null;
  }
}

async function writeLocal(state: AppState) {
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(LOCAL_FILE, JSON.stringify(state, null, 2), "utf8");
}

export async function loadState(): Promise<StatePayload> {
  const store = await getBlobStore();
  if (store) {
    try {
      const raw = await store.get(STATE_KEY, { type: "json" });
      if (!raw) {
        return { state: createDefaultState(), storage: "netlify-blobs" };
      }
      const state = mergeWithDefaults(raw);
      if (!isAppState(raw)) {
        await store.setJSON(STATE_KEY, state);
      }
      return { state, storage: "netlify-blobs" };
    } catch (error) {
      console.warn("Netlify Blobs odczyt nieudany, fallback do pliku lokalnego.", error);
    }
  }

  const local = await readLocal();
  return {
    state: local ?? createDefaultState(),
    storage: "local-file",
  };
}

export async function saveState(input: unknown): Promise<StatePayload> {
  const state = mergeWithDefaults(input);
  const store = await getBlobStore();

  if (store) {
    try {
      await store.setJSON(STATE_KEY, state);
      return { state, storage: "netlify-blobs" };
    } catch (error) {
      console.warn("Netlify Blobs zapis nieudany, fallback do pliku lokalnego.", error);
    }
  }

  await writeLocal(state);
  return { state, storage: "local-file" };
}

export function describeStorage(storage: StorageBackend) {
  return storage === "netlify-blobs"
    ? "Netlify Blobs"
    : "plik lokalny (.data) — ustaw NETLIFY_SITE_ID i NETLIFY_AUTH_TOKEN albo wrzuć na Netlify";
}

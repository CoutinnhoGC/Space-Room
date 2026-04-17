import type { MuralMessage } from "../types/api";

const MURAL_KEY = "spaceroom.mural";
const MURAL_EVENT = "spaceroom:mural-updated";

function readStore() {
  const raw = window.localStorage.getItem(MURAL_KEY);
  if (!raw) {
    return [] as MuralMessage[];
  }

  try {
    return JSON.parse(raw) as MuralMessage[];
  } catch {
    window.localStorage.removeItem(MURAL_KEY);
    return [] as MuralMessage[];
  }
}

function writeStore(messages: MuralMessage[]) {
  window.localStorage.setItem(MURAL_KEY, JSON.stringify(messages.slice(0, 50)));
  window.dispatchEvent(new CustomEvent(MURAL_EVENT));
}

export function getMuralMessages(institutionId?: number | null) {
  if (!institutionId) {
    return [] as MuralMessage[];
  }

  return readStore()
    .filter((item) => item.institutionId === institutionId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addMuralMessage(institutionId: number, message: string, authorName: string) {
  const messages = readStore();
  messages.unshift({
    id: `mural-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    institutionId,
    message,
    authorName,
    createdAt: new Date().toISOString(),
  });
  writeStore(messages);
}

export function removeMuralMessage(id: string) {
  writeStore(readStore().filter((item) => item.id !== id));
}

export function subscribeToMural(callback: () => void) {
  const storageHandler = (event: StorageEvent) => {
    if (event.key === MURAL_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", storageHandler);
  window.addEventListener(MURAL_EVENT, callback);

  return () => {
    window.removeEventListener("storage", storageHandler);
    window.removeEventListener(MURAL_EVENT, callback);
  };
}
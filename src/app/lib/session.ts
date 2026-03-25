import type { Usuario } from "../types/api";

const SESSION_KEY = "spaceroom.currentUser";
const SESSION_EVENT = "spaceroom:session-updated";

export function getCurrentUser(): Usuario | null {
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Usuario;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function setCurrentUser(user: Usuario | null) {
  if (user) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }

  window.dispatchEvent(new CustomEvent(SESSION_EVENT));
}

export function subscribeToSessionUpdates(callback: () => void) {
  const storageHandler = (event: StorageEvent) => {
    if (event.key === SESSION_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", storageHandler);
  window.addEventListener(SESSION_EVENT, callback);

  return () => {
    window.removeEventListener("storage", storageHandler);
    window.removeEventListener(SESSION_EVENT, callback);
  };
}

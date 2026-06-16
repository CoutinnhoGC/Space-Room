import type { AuthSession, Usuario } from "../types/api";

const SESSION_KEY = "spaceroom.session";
const SESSION_EVENT = "spaceroom:session-updated";

export function getCurrentSession(): AuthSession | null {
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function getCurrentUser(): Usuario | null {
  return getCurrentSession()?.usuario ?? null;
}

export function getAccessToken(): string | null {
  return getCurrentSession()?.accessToken ?? null;
}

export function setAuthenticatedSession(session: AuthSession | null) {
  if (session) {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    window.sessionStorage.removeItem(SESSION_KEY);
  }

  window.dispatchEvent(new CustomEvent(SESSION_EVENT));
}

export function setCurrentUser(user: Usuario | null) {
  const currentSession = getCurrentSession();
  if (!currentSession || !user) {
    setAuthenticatedSession(null);
    return;
  }

  setAuthenticatedSession({
    ...currentSession,
    usuario: user,
  });
}

export function clearCurrentSession() {
  setAuthenticatedSession(null);
}

export function subscribeToSessionUpdates(callback: () => void) {
  window.addEventListener(SESSION_EVENT, callback);

  return () => {
    window.removeEventListener(SESSION_EVENT, callback);
  };
}

import type { AppNotification, NotificationPreferences, NotificationType, Usuario } from "../types/api";

const NOTIFICATIONS_KEY = "spaceroom.notifications";
const PREFERENCES_KEY = "spaceroom.notificationPreferences";
const STORE_EVENT = "spaceroom:notifications-updated";

function readJson<T>(key: string, fallback: T): T {
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(STORE_EVENT));
}

function getNotificationTypePreferenceKey(type: NotificationType): keyof NotificationPreferences {
  switch (type) {
    case "RESERVA_CRIADA":
      return "novasReservas";
    case "RESERVA_ATUALIZADA":
      return "alteracoesReserva";
    case "ESPACO_CRIADO":
      return "novosEspacos";
  }
}

export function getDefaultNotificationPreferences(): NotificationPreferences {
  return {
    novasReservas: true,
    alteracoesReserva: true,
    novosEspacos: true,
  };
}

export function getNotificationPreferences(userId?: number | null): NotificationPreferences {
  if (!userId) {
    return getDefaultNotificationPreferences();
  }

  const stored = readJson<Record<string, NotificationPreferences>>(PREFERENCES_KEY, {});
  return stored[String(userId)] ?? getDefaultNotificationPreferences();
}

export function setNotificationPreferences(userId: number, preferences: NotificationPreferences) {
  const stored = readJson<Record<string, NotificationPreferences>>(PREFERENCES_KEY, {});
  stored[String(userId)] = preferences;
  writeJson(PREFERENCES_KEY, stored);
}

export function subscribeToNotificationStore(callback: () => void) {
  const storageHandler = (event: StorageEvent) => {
    if (event.key === NOTIFICATIONS_KEY || event.key === PREFERENCES_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", storageHandler);
  window.addEventListener(STORE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", storageHandler);
    window.removeEventListener(STORE_EVENT, callback);
  };
}

export function createNotification(input: Omit<AppNotification, "id" | "createdAt" | "readByUserIds">) {
  const notifications = readJson<AppNotification[]>(NOTIFICATIONS_KEY, []);
  const notification: AppNotification = {
    ...input,
    id: `${input.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    readByUserIds: input.actorUserId ? [input.actorUserId] : [],
  };

  notifications.unshift(notification);
  writeJson(NOTIFICATIONS_KEY, notifications.slice(0, 100));

  return notification;
}

export function getNotificationsForUser(user: Usuario | null | undefined) {
  const notifications = readJson<AppNotification[]>(NOTIFICATIONS_KEY, []);
  const preferences = getNotificationPreferences(user?.idUsuario);

  return notifications.filter((notification) => {
    const matchesInstitution = user?.adminPlataforma === true || notification.institutionId === user?.idInstituicao;
    const preferenceKey = getNotificationTypePreferenceKey(notification.type);
    return matchesInstitution && preferences[preferenceKey];
  });
}

export function getUnreadNotificationCount(user: Usuario | null | undefined) {
  if (!user?.idUsuario) {
    return 0;
  }

  return getNotificationsForUser(user).filter((item) => !item.readByUserIds?.includes(user.idUsuario)).length;
}

export function markNotificationAsRead(notificationId: string, userId: number) {
  const notifications = readJson<AppNotification[]>(NOTIFICATIONS_KEY, []);
  const updated = notifications.map((notification) => {
    if (notification.id !== notificationId) {
      return notification;
    }

    const readByUserIds = new Set(notification.readByUserIds ?? []);
    readByUserIds.add(userId);
    return { ...notification, readByUserIds: [...readByUserIds] };
  });

  writeJson(NOTIFICATIONS_KEY, updated);
}

export function markAllNotificationsAsRead(userId: number) {
  const notifications = readJson<AppNotification[]>(NOTIFICATIONS_KEY, []);
  const updated = notifications.map((notification) => {
    const readByUserIds = new Set(notification.readByUserIds ?? []);
    readByUserIds.add(userId);
    return { ...notification, readByUserIds: [...readByUserIds] };
  });

  writeJson(NOTIFICATIONS_KEY, updated);
}

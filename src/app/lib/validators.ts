export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function requireFields(fields: Record<string, string | number | undefined | null>) {
  const invalid = Object.entries(fields).find(([, value]) => {
    if (typeof value === "number") {
      return Number.isNaN(value);
    }

    return !String(value ?? "").trim();
  });

  return invalid ? `Preencha o campo "${invalid[0]}".` : null;
}

export function validatePositiveId(id: number | undefined | null, label: string) {
  if (!id || id <= 0) {
    return `${label} invalido(a).`;
  }

  return null;
}

export const MIN_RESERVATION_MINUTES = 30;

export function getTodayInputDate() {
  const today = new Date();
  const offsetDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

export function sanitizeFullName(value: string) {
  return value.replace(/[^\p{L}\s-]/gu, "").replace(/\s{2,}/g, " ");
}

export function validateFullName(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return "Informe o nome completo.";
  }

  if (!/^[\p{L}]+(?:[ -][\p{L}]+)*$/u.test(normalized)) {
    return "O nome completo deve conter apenas letras, acentos, espaços e hífen.";
  }

  if (!normalized.includes(" ")) {
    return "Informe nome e sobrenome.";
  }

  return null;
}

export function validateReservationInterval(start: string, end: string) {
  if (!start || !end) {
    return "Informe data e horário de início e fim.";
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Datas informadas são inválidas.";
  }

  if (start.slice(0, 10) < getTodayInputDate()) {
    return "Não é permitido realizar reservas em datas passadas.";
  }

  if (endDate <= startDate) {
    return "O horário final deve ser maior que o inicial.";
  }

  const durationMinutes = (endDate.getTime() - startDate.getTime()) / 60000;
  if (durationMinutes < MIN_RESERVATION_MINUTES) {
    return `A reserva deve ter duração mínima de ${MIN_RESERVATION_MINUTES} minutos.`;
  }

  return null;
}

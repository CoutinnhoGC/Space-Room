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

export function validateReservationInterval(start: string, end: string) {
  if (!start || !end) {
    return "Informe data e horario de inicio e fim.";
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Datas informadas sao invalidas.";
  }

  if (endDate <= startDate) {
    return "O horario final deve ser maior que o inicial.";
  }

  return null;
}

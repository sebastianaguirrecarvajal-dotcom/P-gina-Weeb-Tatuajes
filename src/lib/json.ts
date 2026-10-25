// Helpers para los campos que guardamos como JSON serializado (SQLite no tiene
// arrays nativos). Mantienen la lectura/escritura segura y tipada.

export function parseStringArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function stringifyArray(value: unknown): string {
  if (!Array.isArray(value)) return "[]";
  return JSON.stringify(value.filter((x) => typeof x === "string" && x.trim() !== ""));
}

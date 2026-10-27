export function fmt(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return "—";
  if (value !== 0 && Math.abs(value) < 0.5 * Math.pow(10, -digits))
    return value.toExponential(digits).replace(".", ",");
  if (value !== 1 && Math.abs(value - 1) < 0.5 * Math.pow(10, -digits))
    return exact(value);
  if (Math.abs(value) >= 1e7)
    return value.toExponential(digits).replace(".", ",");
  return value.toLocaleString("id-ID", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}
export function exact(value: number): string {
  return Number.isFinite(value) ? String(value).replace(".", ",") : "—";
}
export function dateTime(value: string): string {
  return new Date(value).toLocaleString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
export function methodName(method: "mccabe" | "fug"): string {
  return method === "mccabe" ? "McCabe–Thiele" : "Fenske–Underwood–Gilliland";
}

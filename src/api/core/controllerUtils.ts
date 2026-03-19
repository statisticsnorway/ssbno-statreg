// Ensures a route param is always a string.
// - If Express gives an array → take first value
// - If undefined/null → return empty string
// - Otherwise → cast to string
export function param(value: unknown): string {
  return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '')
}

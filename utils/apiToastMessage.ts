/** BE hay trả `message: "OK"` — ưu tiên copy tiếng Việt cho UX. */
export function resolveApiToastMessage(apiMessage: string | undefined, fallback: string): string {
  const trimmed = apiMessage?.trim();
  if (!trimmed) return fallback;
  if (/^ok$/i.test(trimmed)) return fallback;
  return trimmed;
}

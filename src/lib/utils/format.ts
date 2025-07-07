export function formatDate(iso: string, locale = "fi-FI") {
  return new Date(iso).toLocaleString(locale, {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}min`;
}

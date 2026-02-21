export const formatDate = (iso: string, locale = "fi-FI"): string =>
  new Date(iso).toLocaleString(locale, {
    dateStyle: "long",
    timeStyle: "short",
  });

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}min`;
};

/** Converts an exercise title to a URL slug. Must match the matching logic in [exercise]/+page.server.ts. */
export const formatVolume = (kg: number): string =>
	`${kg.toLocaleString('fi-FI')} kg`;

export const slugify = (title: string): string =>
  title.replace(/\s+/g, "-").toLowerCase();

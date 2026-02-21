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

/** Formats a volume number (kg) into a localized string with 'kg' suffix. */
export const formatVolume = (kg: number): string =>
	`${kg.toLocaleString('fi-FI')} kg`;

export const slugify = (title: string): string =>
  title.replace(/\s+/g, "-").toLowerCase();

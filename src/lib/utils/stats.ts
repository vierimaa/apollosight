/**
 * Compute average kg change per week using a least-squares linear regression
 * over all entries. More robust than first-vs-last because it considers every
 * data point and is not skewed by day-to-day fluctuations on the boundary dates.
 *
 * @param entries  Array of objects with `date_int` (days since epoch) and `weight_kg`.
 * @returns        kg/week slope, or null if fewer than 2 entries or all dates are identical.
 */
export const calcWeeklyRate = (
	entries: { date_int: number; weight_kg: number }[]
): number | null => {
	if (entries.length < 2) return null;
	const n = entries.length;
	let sumX = 0;
	let sumY = 0;
	let sumXY = 0;
	let sumX2 = 0;
	for (const entry of entries) {
		sumX += entry.date_int;
		sumY += entry.weight_kg;
		sumXY += entry.date_int * entry.weight_kg;
		sumX2 += entry.date_int * entry.date_int;
	}
	const denominator = n * sumX2 - sumX * sumX;
	if (denominator === 0) return null;
	return ((n * sumXY - sumX * sumY) / denominator) * 7;
};

/**
 * Utility functions for humanizing prediction labels.
 */

export type LabelMap = Record<string, string>

/**
 * Humanize a raw prediction label.
 * 
 * - If input is "class_163", extracts index 163 and maps it if available
 * - If input is "163", maps it directly
 * - If input already looks like words (no "class_" prefix, no pure numbers), returns title-case version
 * - Falls back to raw if mapping fails
 * 
 * @param raw - Raw label string (e.g., "class_163", "163", "golden retriever")
 * @param map - Optional mapping of class_id -> human name
 * @returns Human-readable label string
 */
export function humanizeLabel(raw: string, map?: LabelMap): string {
  if (!raw) return raw
  
  // If it's already human-readable (no "class_" prefix, contains letters), return title-case
  if (!/^class_\d+$/i.test(raw) && !/^\d+$/.test(raw)) {
    // Title-case: capitalize first letter of each word
    return raw
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  }
  
  // Extract numeric index
  const match = raw.match(/^class_(\d+)$/i)
  const index = match ? parseInt(match[1], 10) : (raw.match(/^\d+$/) ? parseInt(raw, 10) : null)
  
  if (index !== null && map && map[index.toString()]) {
    return map[index.toString()]
  }
  
  // Fallback to raw
  return raw
}

/**
 * Format a prediction for display.
 * 
 * @param label - Prediction label (human-readable or raw)
 * @param prob - Probability (0-1)
 * @param rawLabel - Optional raw label (for transparency display)
 * @param map - Optional label mapping (for fallback)
 * @returns Formatted prediction with name, raw, and percentage
 */
export function formatPrediction(
  label: string,
  prob: number,
  rawLabel?: string,
  map?: LabelMap
): { name: string; raw: string; pct: string } {
  const humanName = humanizeLabel(label, map)
  const raw = rawLabel || label
  const pct = (prob * 100).toFixed(1)
  
  return { name: humanName, raw, pct }
}

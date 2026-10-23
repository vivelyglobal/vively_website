/**
 * Shortens campaign target regions based on user guidelines:
 * - mix global = mix
 * - japan = JP
 * - south eastasia = SEA
 * - Chinese speaker = CN/TW/HK
 * - etc make it short
 */
export function formatTargetShort(target?: string, nationality?: string): string {
  const raw = (nationality || target || 'Mix').trim();
  const lower = raw.toLowerCase();

  // Mix / Global (User: "if mix global = mix")
  if (lower.includes('mix') || lower.includes('global')) {
    return 'Mix';
  }
  // Japan (User: "japan = JP")
  if (lower.includes('japan') || lower === 'jp') {
    return 'JP';
  }
  // South East Asia (User: "south eastasia = SEA")
  if (
    lower.includes('south east') ||
    lower.includes('southeast') ||
    lower.includes('south eastasia') ||
    lower.includes('sea') ||
    lower.includes('indonesia') ||
    lower.includes('thailand') ||
    lower.includes('vietnam') ||
    lower.includes('philippines') ||
    lower.includes('malaysia') ||
    lower.includes('singapore')
  ) {
    return 'SEA';
  }
  // Chinese speaker (User: "Chinese speaker = CN/TW/HK")
  if (
    lower.includes('chinese') ||
    lower.includes('china') ||
    lower.includes('taiwan') ||
    lower.includes('hong kong') ||
    lower.includes('cn/tw/hk') ||
    lower.includes('mandarin')
  ) {
    return 'CN/TW/HK';
  }
  // Middle East
  if (lower.includes('middle east') || lower === 'me') {
    return 'ME';
  }
  // Korea / Seoul
  if (lower.includes('seoul foreign') || lower.includes('foreign')) {
    return 'KR Expat';
  }
  if (lower.includes('korea') || lower.includes('seoul') || lower === 'kr') {
    return 'KR';
  }
  // United States / North America
  if (lower.includes('united states') || lower.includes('usa') || lower === 'us' || lower.includes('america')) {
    return 'US';
  }
  // Europe
  if (lower.includes('europe') || lower === 'eu' || lower.includes('uk')) {
    return 'EU';
  }

  // Fallback: keep short
  if (raw.length > 8) {
    return raw.slice(0, 6).trim();
  }
  return raw;
}

/**
 * Format slots number
 */
export function formatSlotsShort(slots: number | string): string {
  return `${slots}`;
}

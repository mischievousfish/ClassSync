const PII_PATTERNS: RegExp[] = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /(?:\+?\d[\d .()-]{7,}\d)/g,
  /(?:https?:\/\/)?(?:www\.)?(?:facebook|instagram|zalo)\.com\/[^\s]+/gi,
];

export interface SanitizedText {
  value: string;
  replacements: number;
}

export function sanitizePii(input: string): SanitizedText {
  let value = input;
  let replacements = 0;
  for (const pattern of PII_PATTERNS) {
    value = value.replace(pattern, () => {
      replacements += 1;
      return '[REDACTED_PII]';
    });
  }
  return { value, replacements };
}

export function sanitizePromptParts(parts: Record<string, string | undefined>): Record<string, string | undefined> {
  return Object.fromEntries(Object.entries(parts).map(([key, value]) => [key, value === undefined ? undefined : sanitizePii(value).value]));
}

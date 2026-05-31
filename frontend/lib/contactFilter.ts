const PATTERNS: RegExp[] = [
  /\b[\w.+%-]{2,}@[\w-]{2,}\.[a-z]{2,}\b/i,
  /(\+?54[\s.-]?)?(\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{4}/,
  /@[a-zA-Z0-9_.]{3,30}\b/,
  /\b(instagram|insta|\bIG\b|facebook|\bFB\b|twitter|tiktok|telegram|whatsapp|snapchat)\b/i,
  /\bhttps?:\/\/\S+/i,
  /\bwww\.[a-z0-9-]{2,}\.[a-z]{2,}/i,
  /\bwa\.me\b/i,
];

export function hasContactInfo(text: string): boolean {
  return PATTERNS.some(p => p.test(text));
}

export const CONTACT_WARNING = 'No se pueden brindar datos de contacto en las consultas públicas.';

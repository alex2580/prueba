// ── Datos de contacto ────────────────────────────────────────────
const CONTACT_PATTERNS: RegExp[] = [
  /\b[\w.+%-]{2,}@[\w-]{2,}\.[a-z]{2,}\b/i,
  /(\+?54[\s.-]?)?(\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{4}/,
  /@[a-zA-Z0-9_.]{3,30}\b/,
  /\b(instagram|insta|facebook|twitter|tiktok|telegram|whatsapp|snapchat)\b/i,
  /\bhttps?:\/\/\S+/i,
  /\bwww\.[a-z0-9-]{2,}\.[a-z]{2,}/i,
  /\bwa\.me\b/i,
];

// ── Malas palabras ───────────────────────────────────────────────
const BAD_WORDS: RegExp[] = [
  /\bput[ao]s?\b/i, /\bconch[ao]s?\b/i, /\bforro[as]?\b/i, /\bbolud[ao]s?\b/i,
  /\bhijodeput[ao]s?\b/i, /\bcabrón\b/i, /\bcabron(es|a)?\b/i, /\bpend[eo]jo[as]?\b/i,
  /\bculer[ao]s?\b/i, /\bchingad[ao]s?\b/i, /\bcoño[s]?\b/i, /\bcarajo[s]?\b/i,
  /\bgil[es]?\b/i, /\bimbécil(es)?\b/i, /\bestúpid[ao]s?\b/i, /\bidiot[ao]s?\b/i,
  /\bcerdo[as]?\b/i, /\bvagabund[ao]s?\b/i, /\bmierda[s]?\b/i, /\bmaldito[as]?\b/i,
  /\bpelotud[ao]s?\b/i, /\bortiva[s]?\b/i,
];

// ── Contenido sexual ─────────────────────────────────────────────
const SEXUAL_PATTERNS: RegExp[] = [
  /\bsex[ou]\b/i, /\bporn[oa]\b/i, /\bpene[s]?\b/i, /\bvagina[s]?\b/i,
  /\bcul[oa]s?\b/i, /\bteta[s]?\b/i, /\bpech[oa]s?\b/i, /\bdesnud[ao]s?\b/i,
  /\berótic[ao]s?\b/i, /\bmastu[rb]/i, /\bprostitu[tc]/i, /\bescort[s]?\b/i,
  /\bcogid[ao]s?\b/i, /\bcoger\b/i, /\bfollad[ao]s?\b/i, /\bfollar\b/i,
  /\bcojid[ao]s?\b/i, /\bfornicac/i,
];

// ── Contenido político ───────────────────────────────────────────
const POLITICAL_PATTERNS: RegExp[] = [
  /\bkirchner(ismo|ista)?\b/i, /\bperonismo\b/i, /\bperonista[s]?\b/i,
  /\bmacr(ismo|ista)?\b/i, /\bmilei\b/i, /\bla\s?libertad\s?avanza\b/i,
  /\bunión\s?por\s?la\s?patria\b/i, /\bjuntos?\s?(por el)?\s?cambio\b/i,
  /\bfrente\s?de\s?todos\b/i, /\bpj\b/i, /\bucr\b/i,
  /\bviva\s+\w+\b/i, /\bmuera\s+\w+\b/i, /\babajo\s+\w+\b/i,
  /\bvoto\s+(a|por)\b/i, /\belecciones?\b/i, /\bfascis(mo|ta)\b/i,
  /\bcomunis(mo|ta)\b/i, /\bsocialis(mo|ta)\b/i,
  /\bcorrupt[ao]s?\b/i, /\bladrón\b/i, /\bladrones\b/i,
];

// ── Evaluación ───────────────────────────────────────────────────
export type ViolationType = 'contact' | 'badword' | 'sexual' | 'political' | null;

export function detectViolation(text: string): ViolationType {
  if (CONTACT_PATTERNS.some(p => p.test(text))) return 'contact';
  if (BAD_WORDS.some(p => p.test(text)))        return 'badword';
  if (SEXUAL_PATTERNS.some(p => p.test(text)))  return 'sexual';
  if (POLITICAL_PATTERNS.some(p => p.test(text))) return 'political';
  return null;
}

export function hasContactInfo(text: string): boolean {
  return CONTACT_PATTERNS.some(p => p.test(text));
}

export function getViolationMessage(type: ViolationType): string {
  switch (type) {
    case 'contact':   return 'No se pueden brindar datos de contacto en las consultas públicas.';
    case 'badword':   return 'El mensaje contiene lenguaje inapropiado y no puede enviarse.';
    case 'sexual':    return 'El mensaje contiene contenido sexual y no puede enviarse.';
    case 'political': return 'Los mensajes con contenido político no están permitidos en la plataforma.';
    default:          return 'El mensaje contiene contenido no permitido.';
  }
}

export const CONTACT_WARNING = getViolationMessage('contact');

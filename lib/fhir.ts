/** Helpers for reading loosely-typed FHIR JSON, whether generated here or loaded from a server. */

export const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/** Resource types that have a detail page, and the route segment of that page. */
const ROUTES: Record<string, string> = {
  Patient: 'patients',
  Practitioner: 'practitioners',
  Organization: 'organisations',
  Encounter: 'encounters',
  Observation: 'observations',
  DiagnosticReport: 'reports',
  CareTeam: 'careteams',
  HealthcareService: 'healthcareservices',
  Condition: 'conditions',
};

/** Type and id of a literal reference: "Patient/1", an absolute URL, or a versioned form of either. */
export function parseReference(reference: unknown): { type: string; id: string } | undefined {
  if (typeof reference !== 'string') return undefined;
  const match = /(?:^|\/)([A-Z][A-Za-z]+)\/([A-Za-z0-9\-.]{1,64})(?:\/_history\/[^/]+)?$/.exec(reference);
  return match ? { type: match[1], id: match[2] } : undefined;
}

/** Detail page of a resource, or undefined when the app has no page for its type. */
export function resourcePath(resourceType: unknown, id: unknown): string | undefined {
  // resourceType comes from loaded JSON, so guard against inherited keys such as "constructor".
  const route = typeof resourceType === 'string' && Object.hasOwn(ROUTES, resourceType) ? ROUTES[resourceType] : undefined;
  return route && typeof id === 'string' && id ? `/tool/${route}/${id}` : undefined;
}

export function referencePath(reference: unknown): string | undefined {
  const parsed = parseReference(reference);
  return resourcePath(parsed?.type, parsed?.id);
}

/** Display name from the first HumanName of a Patient, Practitioner or similar resource. */
export function humanName(resource: unknown, fallback = 'Unnamed'): string {
  const name = isRecord(resource) && Array.isArray(resource.name) ? resource.name[0] : undefined;
  if (!isRecord(name)) return fallback;
  if (typeof name.text === 'string' && name.text) return name.text;
  const parts = [...(Array.isArray(name.given) ? name.given : []), name.family];
  return parts.filter(part => typeof part === 'string' && part).join(' ') || fallback;
}

/** Text of a CodeableConcept: its text, else the display or code of its first coding. */
export function conceptText(concept: unknown): string | undefined {
  if (!isRecord(concept)) return undefined;
  if (typeof concept.text === 'string' && concept.text) return concept.text;
  const coding = Array.isArray(concept.coding) ? concept.coding[0] : undefined;
  if (!isRecord(coding)) return undefined;
  if (typeof coding.display === 'string' && coding.display) return coding.display;
  return typeof coding.code === 'string' ? coding.code : undefined;
}

/** "low - high unit" for an Observation.referenceRange, or its one-sided bound. */
export function referenceRangeText(range: unknown): string {
  if (!isRecord(range)) return '';
  const { low, high } = range;
  const lowValue = isRecord(low) ? low.value : undefined;
  const highValue = isRecord(high) ? high.value : undefined;
  const bound = isRecord(high) ? high : isRecord(low) ? low : undefined;
  const unit = bound && typeof bound.unit === 'string' ? ` ${bound.unit}` : '';
  if (lowValue !== undefined && highValue !== undefined) return `${lowValue} - ${highValue}${unit}`;
  if (lowValue !== undefined) return `>= ${lowValue}${unit}`;
  if (highValue !== undefined) return `<= ${highValue}${unit}`;
  return typeof range.text === 'string' ? range.text : '';
}

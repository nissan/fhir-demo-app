import { isRecord } from '../lib/fhir';
import { generateBundles } from './fhir-generators';

/** A resource as loaded; bundles can come from any server, so only resourceType is relied on. */
export type StoredResource = { resourceType: string; id?: string; [key: string]: unknown };
type BundlesUpdate = unknown[] | Record<string, unknown> | ((current: unknown[]) => unknown[]);

const COUNTED_TYPES = [
  'Patient', 'Practitioner', 'Organization', 'DiagnosticReport', 'Encounter',
  'Observation', 'CareTeam', 'HealthcareService', 'Condition',
];

// Seeded, so the server render and the browser start from identical data.
let bundles: unknown[] = generateBundles();
let resourceCounts: Record<string, number> = {};
let listeners: (() => void)[] = [];

const isResource = (value: unknown): value is StoredResource => isRecord(value) && typeof value.resourceType === 'string';

const getResources = (resourceType: string): StoredResource[] =>
  bundles.flatMap((bundle) => {
    const entries: unknown[] = isRecord(bundle) && Array.isArray(bundle.entry) ? bundle.entry : [];
    return entries.flatMap((entry) => {
      const resource = isRecord(entry) ? entry.resource : undefined;
      if (!isResource(resource)) return [];
      if (resource.resourceType === resourceType) return [resource];
      // Bundles fetched from a server can carry resolved references as nested resources.
      return Object.values(resource).filter(isResource).filter(nested => nested.resourceType === resourceType);
    });
  });

const recount = () => {
  resourceCounts = Object.fromEntries(COUNTED_TYPES.map(resourceType => [resourceType, getResources(resourceType).length]));
};
recount();

export const getBundles = () => bundles;
export const getPatients = () => getResources('Patient');
export const getPractitioners = () => getResources('Practitioner');
export const getOrganizations = () => getResources('Organization');
export const getOrganisations = getOrganizations;
export const getLocations = () => getResources('Location');
export const getReports = () => getResources('DiagnosticReport');
export const getEncounters = () => getResources('Encounter');
export const getObservations = () => getResources('Observation');
export const getCareTeams = () => getResources('CareTeam');
export const getHealthcareServices = () => getResources('HealthcareService');
export const getConditions = () => getResources('Condition');

export const getReportById = (id: string) => getReports().find(report => report.id === id);

/** Replaces the loaded bundles with one bundle, a list, or the result of updating the current list. */
export const setBundles = (update: BundlesUpdate) => {
  const next = typeof update === 'function' ? update(bundles) : update;
  bundles = Array.isArray(next) ? next : [next];
  recount();
  listeners.forEach(listener => listener());
};

export const addListener = (listener: () => void) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(each => each !== listener);
  };
};

export const getResourceCounts = () => resourceCounts;

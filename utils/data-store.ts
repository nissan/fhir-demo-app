import { generateBundle } from './fhir-generators';

// Generate a fixed number of bundles
let bundles: any[] = Array.from({ length: 3 }, generateBundle);

// Add a new object to keep track of resource counts
let resourceCounts: { [key: string]: number } = {};

export const getBundles = () => bundles;

const extractResources = (bundle: any, resourceType: string) => {
  const resources = bundle?.entry?.filter((entry: any) => entry.resource.resourceType === resourceType)
    .map((entry: any) => entry.resource) || [];
  
  // Also check for nested resources
  bundle?.entry?.forEach((entry: any) => {
    if (entry.resource.resourceType !== resourceType) {
      Object.values(entry.resource).forEach((value: any) => {
        if (value && typeof value === 'object' && value.resourceType === resourceType) {
          resources.push(value);
        }
      });
    }
  });

  return resources;
};

const getResourcesFromBundles = (resourceType: string) => {
  const resources = bundles.flatMap(bundle => extractResources(bundle, resourceType));
  resourceCounts[resourceType] = resources.length;
  return resources;
};

export const getPatients = () => getResourcesFromBundles('Patient');
export const getPractitioners = () => getResourcesFromBundles('Practitioner');
export const getOrganizations = () => getResourcesFromBundles('Organization');
export const getReports = () => getResourcesFromBundles('DiagnosticReport');
export const getEncounters = () => getResourcesFromBundles('Encounter');
export const getObservations = () => getResourcesFromBundles('Observation');
export const getCareTeams = () => getResourcesFromBundles('CareTeam');
export const getHealthcareServices = () => getResourcesFromBundles('HealthcareService');
export const getConditions = () => getResourcesFromBundles('Condition');

export const getReportById = (id: string) => {
  const allReports = getReports();
  return allReports.find((report: any) => report.id === id);
};

let listeners: (() => void)[] = [];

export const setBundles = (newBundles: any) => {
  if (Array.isArray(newBundles)) {
    bundles = newBundles;
  } else {
    bundles = [newBundles];
  }
  
  // Reset resource counts
  resourceCounts = {};
  
  // Recalculate resource counts
  getPatients();
  getPractitioners();
  getOrganizations();
  getReports();
  getEncounters();
  getObservations();
  getCareTeams();
  getHealthcareServices();
  getConditions();
  
  // Notify all listeners that the data has changed
  listeners.forEach(listener => listener());
};

export const addListener = (listener: () => void) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};

// Add a new function to get resource counts
export const getResourceCounts = () => resourceCounts;

let organizations: any[] = [];

// Add this line to provide an alias for getOrganizations
export const getOrganisations = getOrganizations;

/**
 * Deterministic synthetic FHIR R4 (4.0.1) data for the demo.
 *
 * The same seed always produces the same bundle, so the server render, the browser and a
 * page reload agree on resource ids and detail pages stay deep-linkable.
 * Codes, units and invariants are checked with the HL7 FHIR Validator (README, "Synthetic data").
 */
import { Faker, base, en } from '@faker-js/faker';
import { Buffer } from 'buffer';

export type FhirResource = { resourceType: string; id: string };
export type Bundle = FhirResource & { type: string; timestamp: string; entry: { fullUrl: string; resource: FhirResource }[] };

/** A resource with a human-readable label, used as Reference.display. */
type Labelled = FhirResource & ({ name: string } | { name: { text: string }[] } | { code: { text: string } });
type Named = FhirResource & { name: string };
type Code = readonly [code: string, display: string];
type Coding = { system: string; code: string; display: string };
type Concept = { coding: Coding[]; text: string };
type Reference = { reference: string; display?: string };
type Person = { sex: 'female' | 'male'; given: string; family: string };
type Staff = { resource: Labelled; role: Code; prescriber: boolean };
type Provider = Named & { address: object[] };
/** The parts of a Patient that a report prints. */
type Subject = Labelled & { gender: string; birthDate: string; identifier: { value: string }[] };
type Visit = {
  resource: FhirResource & { reasonCode: Concept[]; diagnosis: { condition: Reference; use: Concept; rank: number }[] };
  start: Date;
  end?: Date;
};
type Body = { heightCm: number; weightKg: number };
type Weighted<T> = { weight: number; value: T }[];

interface Measure {
  code: Code;
  /** Short name used for CodeableConcept.text and the PDF report. */
  text: string;
  unit: string;
  ucum: string;
  /** Bounds that values are drawn from. */
  span: readonly [number, number];
  /** Reference range; absent where "normal" depends on the person (height, weight). */
  normal?: readonly [low: number | undefined, high: number | undefined];
  digits: number;
}

export const DEFAULT_SEED = 20241028;
/**
 * Base of every entry.fullUrl, against which relative references resolve (Bundle reference
 * resolution), and of the identifier namespaces. A name the app owns, not a served endpoint.
 */
export const FHIR_BASE_URL = 'https://fhir-demo-app.vercel.app/fhir';
/** Fixed "now" for generated dates, so output does not depend on the wall clock. */
const REFERENCE_DATE = new Date('2026-11-01T09:00:00.000Z');

const SNOMED = 'http://snomed.info/sct';
const LOINC = 'http://loinc.org';
const UCUM = 'http://unitsofmeasure.org';
const BCP47 = 'urn:ietf:bcp:47';
const HL7 = 'http://terminology.hl7.org/CodeSystem';
const DAY = 24 * 60;

const LANGUAGES: Code[] = [['en-US', 'English (United States)'], ['es', 'Spanish'], ['fr', 'French'], ['vi', 'Vietnamese']];
const MARITAL_STATUSES: Code[] = [['M', 'Married'], ['S', 'Never Married'], ['D', 'Divorced'], ['W', 'Widowed']];
const DEPARTMENTS = ['Cardiology', 'Emergency', 'Internal Medicine', 'Pathology'];
const PROVISION_CONDITIONS: Code[] = [['free', 'Free'], ['disc', 'Discounts Available'], ['cost', 'Fees apply']];
const REFERRAL_METHODS: Code[] = [['phone', 'Phone'], ['fax', 'Fax'], ['elec', 'Secure Messaging']];

const PHYSICIAN: Code = ['309343006', 'Physician'];
const QUALIFICATIONS: Record<'MD' | 'DO' | 'NP' | 'PA' | 'RN', { code: Code; role: Code; prefix?: string }> = {
  MD: { code: ['MD', 'Doctor of Medicine'], role: PHYSICIAN, prefix: 'Dr.' },
  DO: { code: ['DO', 'Doctor of Osteopathy'], role: PHYSICIAN, prefix: 'Dr.' },
  NP: { code: ['NP', 'Nurse Practitioner'], role: ['224571005', 'Nurse practitioner'] },
  PA: { code: ['PA', 'Physician Assistant'], role: ['449161006', 'Physician assistant'] },
  RN: { code: ['RN', 'Registered Nurse'], role: ['224535009', 'Registered nurse'] },
};

const ENCOUNTER_KINDS: Weighted<{ class: Code; site: number; minutes: readonly [number, number]; types: Code[] }> = [
  { weight: 6, value: { class: ['AMB', 'ambulatory'], site: 1, minutes: [15, 60], types: [['185349003', 'Encounter for check up (procedure)'], ['185345009', 'Encounter for symptom (procedure)'], ['390906007', 'Follow-up encounter (procedure)']] } },
  { weight: 2, value: { class: ['EMER', 'emergency'], site: 0, minutes: [60, 480], types: [['50849002', 'Emergency room admission (procedure)']] } },
  { weight: 2, value: { class: ['IMP', 'inpatient encounter'], site: 0, minutes: [DAY, 5 * DAY], types: [['32485007', 'Hospital admission (procedure)']] } },
];

const ACUTE_FINDINGS: Code[] = [
  ['195662009', 'Acute viral pharyngitis'], ['10509002', 'Acute bronchitis'], ['444814009', 'Viral sinusitis'],
  ['43878008', 'Streptococcal sore throat'], ['68566005', 'Urinary tract infectious disease'], ['233604007', 'Pneumonia'],
  ['37796009', 'Migraine'],
];
const CHRONIC_FINDINGS: Code[] = [
  ['59621000', 'Essential hypertension'], ['44054006', 'Diabetes mellitus type 2'], ['195967001', 'Asthma'],
  ['55822004', 'Hyperlipidemia'], ['35489007', 'Depressive disorder'], ['235595009', 'Gastroesophageal reflux disease'],
  ['396275006', 'Osteoarthritis'], ['49436004', 'Atrial fibrillation'], ['271737000', 'Anemia'], ['414916001', 'Obesity'],
];
const SEVERITIES: { code: Code; text: string }[] = [
  { code: ['255604002', 'Mild (qualifier value)'], text: 'Mild' },
  { code: ['6736007', 'Moderate (severity modifier)'], text: 'Moderate' },
  { code: ['24484000', 'Severe (severity modifier)'], text: 'Severe' },
];
const CONDITION_NOTES = [
  'Patient advised on self-management; review at next visit.',
  'Symptoms improving with current treatment.',
  'Referred for further assessment.',
  'Monitoring; no change to the management plan.',
];

/**
 * Condition status pairs that satisfy con-3, con-4 and con-5: entered-in-error carries no
 * clinicalStatus, and only inactive, remission or resolved conditions are abated.
 */
type ConditionState = { clinical?: Code; verification: Code; abated?: boolean };
const CONFIRMED: Code = ['confirmed', 'Confirmed'];
const ACTIVE: Code = ['active', 'Active'];
const ONGOING_STATES: Weighted<ConditionState> = [
  { weight: 6, value: { clinical: ACTIVE, verification: CONFIRMED } },
  { weight: 1, value: { clinical: ACTIVE, verification: ['provisional', 'Provisional'] } },
  { weight: 1, value: { clinical: ACTIVE, verification: ['differential', 'Differential'] } },
  { weight: 1, value: { clinical: ACTIVE, verification: ['unconfirmed', 'Unconfirmed'] } },
  { weight: 1, value: { clinical: ['recurrence', 'Recurrence'], verification: CONFIRMED } },
  { weight: 1, value: { clinical: ['relapse', 'Relapse'], verification: CONFIRMED } },
];
const ABATED_STATES: Weighted<ConditionState> = [
  { weight: 3, value: { clinical: ['resolved', 'Resolved'], verification: CONFIRMED, abated: true } },
  { weight: 1, value: { clinical: ['remission', 'Remission'], verification: CONFIRMED, abated: true } },
  { weight: 1, value: { clinical: ['inactive', 'Inactive'], verification: CONFIRMED, abated: true } },
];
const VOID_STATES: Weighted<ConditionState> = [
  { weight: 1, value: { clinical: ['inactive', 'Inactive'], verification: ['refuted', 'Refuted'] } },
  { weight: 1, value: { verification: ['entered-in-error', 'Entered in Error'] } },
];

const HEART_RATE: Measure = { code: ['8867-4', 'Heart rate'], text: 'Heart rate', unit: 'beats/minute', ucum: '/min', span: [48, 128], normal: [60, 100], digits: 0 };
const RESPIRATORY_RATE: Measure = { code: ['9279-1', 'Respiratory rate'], text: 'Respiratory rate', unit: 'breaths/minute', ucum: '/min', span: [10, 28], normal: [12, 20], digits: 0 };
const BODY_TEMPERATURE: Measure = { code: ['8310-5', 'Body temperature'], text: 'Body temperature', unit: '°C', ucum: 'Cel', span: [35.8, 39.6], normal: [36.1, 37.2], digits: 1 };
const OXYGEN_SATURATION: Measure = { code: ['2708-6', 'Oxygen saturation in Arterial blood'], text: 'Oxygen saturation', unit: '%', ucum: '%', span: [89, 100], normal: [95, undefined], digits: 0 };
const PULSE_OXIMETRY: Code = ['59408-5', 'Oxygen saturation in Arterial blood by Pulse oximetry'];
const BODY_HEIGHT: Measure = { code: ['8302-2', 'Body height'], text: 'Body height', unit: 'cm', ucum: 'cm', span: [150, 195], digits: 1 };
const BODY_WEIGHT: Measure = { code: ['29463-7', 'Body weight'], text: 'Body weight', unit: 'kg', ucum: 'kg', span: [45, 130], digits: 1 };
const BODY_MASS_INDEX: Measure = { code: ['39156-5', 'Body mass index (BMI) [Ratio]'], text: 'Body mass index', unit: 'kg/m2', ucum: 'kg/m2', span: [17, 40], normal: [18.5, 24.9], digits: 1 };
const BLOOD_PRESSURE: Code = ['85354-9', 'Blood pressure panel with all children optional'];
const SYSTOLIC: Measure = { code: ['8480-6', 'Systolic blood pressure'], text: 'Systolic blood pressure', unit: 'mmHg', ucum: 'mm[Hg]', span: [92, 172], normal: [90, 120], digits: 0 };
const DIASTOLIC: Measure = { code: ['8462-4', 'Diastolic blood pressure'], text: 'Diastolic blood pressure', unit: 'mmHg', ucum: 'mm[Hg]', span: [54, 104], normal: [60, 80], digits: 0 };

/** Each kind is also the id of the R4 core vital signs profile required for its LOINC code. */
const VITAL_KINDS = ['bp', 'heartrate', 'resprate', 'bodytemp', 'oxygensat', 'bodyheight', 'bodyweight', 'bmi'] as const;
type VitalKind = (typeof VITAL_KINDS)[number];

const LAB_PANELS: { code: Code; text: string; tests: Measure[] }[] = [
  {
    code: ['58410-2', 'CBC panel - Blood by Automated count'],
    text: 'Complete blood count',
    tests: [
      { code: ['718-7', 'Hemoglobin [Mass/volume] in Blood'], text: 'Hemoglobin', unit: 'g/dL', ucum: 'g/dL', span: [10.5, 18], normal: [12, 17.5], digits: 1 },
      { code: ['6690-2', 'Leukocytes [#/volume] in Blood by Automated count'], text: 'White blood cells', unit: '10*3/uL', ucum: '10*3/uL', span: [3, 14], normal: [4.5, 11], digits: 1 },
      { code: ['777-3', 'Platelets [#/volume] in Blood by Automated count'], text: 'Platelets', unit: '10*3/uL', ucum: '10*3/uL', span: [120, 480], normal: [150, 450], digits: 0 },
      { code: ['4544-3', 'Hematocrit [Volume Fraction] of Blood by Automated count'], text: 'Hematocrit', unit: '%', ucum: '%', span: [32, 54], normal: [36, 50], digits: 1 },
    ],
  },
  {
    code: ['51990-0', 'Basic metabolic panel - Blood'],
    text: 'Basic metabolic panel',
    tests: [
      { code: ['2339-0', 'Glucose [Mass/volume] in Blood'], text: 'Glucose', unit: 'mg/dL', ucum: 'mg/dL', span: [62, 190], normal: [70, 99], digits: 0 },
      { code: ['2947-0', 'Sodium [Moles/volume] in Blood'], text: 'Sodium', unit: 'mmol/L', ucum: 'mmol/L', span: [130, 150], normal: [136, 145], digits: 0 },
      { code: ['6298-4', 'Potassium [Moles/volume] in Blood'], text: 'Potassium', unit: 'mmol/L', ucum: 'mmol/L', span: [3, 5.8], normal: [3.5, 5.1], digits: 1 },
      { code: ['38483-4', 'Creatinine [Mass/volume] in Blood'], text: 'Creatinine', unit: 'mg/dL', ucum: 'mg/dL', span: [0.5, 1.9], normal: [0.6, 1.3], digits: 2 },
    ],
  },
  {
    code: ['57698-3', 'Lipid panel with direct LDL - Serum or Plasma'],
    text: 'Lipid panel',
    tests: [
      { code: ['2093-3', 'Cholesterol [Mass/volume] in Serum or Plasma'], text: 'Total cholesterol', unit: 'mg/dL', ucum: 'mg/dL', span: [130, 290], normal: [undefined, 200], digits: 0 },
      { code: ['2085-9', 'Cholesterol in HDL [Mass/volume] in Serum or Plasma'], text: 'HDL cholesterol', unit: 'mg/dL', ucum: 'mg/dL', span: [28, 90], normal: [40, undefined], digits: 0 },
      { code: ['18262-6', 'Cholesterol in LDL [Mass/volume] in Serum or Plasma by Direct assay'], text: 'LDL cholesterol', unit: 'mg/dL', ucum: 'mg/dL', span: [55, 210], normal: [undefined, 100], digits: 0 },
      { code: ['2571-8', 'Triglyceride [Mass/volume] in Serum or Plasma'], text: 'Triglycerides', unit: 'mg/dL', ucum: 'mg/dL', span: [45, 320], normal: [undefined, 150], digits: 0 },
    ],
  },
];

const SERVICES: { name: string; category: Code; type: Code; specialty: Code; allDay?: boolean }[] = [
  { name: 'General Practice Clinic', category: ['17', 'General Practice'], type: ['124', 'General Practice'], specialty: ['394814009', 'General practice'] },
  { name: 'Cardiology Service', category: ['27', 'Specialist Medical'], type: ['165', 'Cardiology'], specialty: ['394579002', 'Cardiology'] },
  { name: 'Emergency Department', category: ['14', 'Emergency Department'], type: ['117', 'Emergency Medical'], specialty: ['773568002', 'Emergency medicine'], allDay: true },
  { name: 'Pathology Collection Service', category: ['26', 'Specialist Clinical Pathology'], type: ['159', 'Pathology - General'], specialty: ['394915009', 'General pathology'] },
  { name: 'Mental Health Service', category: ['22', 'Mental Health'], type: ['490', 'General Mental Health Services'], specialty: ['394587001', 'Psychiatry'] },
  { name: 'Medical Imaging Service', category: ['30', 'Specialist Radiology/Imaging'], type: ['209', 'Diag. Radiology /Xray /CT /Fluoroscopy'], specialty: ['394914008', 'Radiology'] },
];

const coding = (system: string, [code, display]: Code): Coding => ({ system, code, display });
const concept = (system: string, code: Code, text: string = code[1]): Concept => ({ coding: [coding(system, code)], text });
const quantity = (value: number, measure: Measure) => ({ value, unit: measure.unit, system: UCUM, code: measure.ucum });
const identifier = (namespace: string, value: string) => ({ use: 'official', system: `${FHIR_BASE_URL}/sid/${namespace}`, value });
const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60_000);

/** Narrative generated from the structured data only (dom-6 best practice). */
const narrative = (...lines: string[]) => ({
  status: 'generated',
  div: `<div xmlns="http://www.w3.org/1999/xhtml">${lines
    .map(line => `<p>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
    .join('')}</div>`,
});

const label = (resource: Labelled): string => {
  if ('code' in resource) return resource.code.text;
  return typeof resource.name === 'string' ? resource.name : resource.name[0].text;
};
const reference = (resource: FhirResource | Labelled): Reference => ({
  reference: `${resource.resourceType}/${resource.id}`,
  ...(('name' in resource || 'code' in resource) && { display: label(resource) }),
});

const person = (f: Faker): Person => {
  const sex = f.person.sexType();
  return { sex, given: f.person.firstName(sex), family: f.person.lastName() };
};
const humanName = ({ given, family }: Person, prefix?: string) => ({
  use: 'official',
  text: [prefix, given, family].filter(Boolean).join(' '),
  family,
  given: [given],
  ...(prefix && { prefix: [prefix] }),
});
const phone = (f: Faker, use: 'home' | 'work' | 'mobile') => ({ system: 'phone', value: f.phone.number({ style: 'national' }), use });
const email = (f: Faker, { given, family }: Person, use: 'home' | 'work') => ({
  system: 'email',
  value: f.internet.email({ firstName: given, lastName: family, provider: 'example.org' }).toLowerCase(),
  use,
});
const address = (f: Faker, use: 'home' | 'work') => {
  const line = f.location.streetAddress();
  const city = f.location.city();
  const state = f.location.state({ abbreviated: true });
  const postalCode = f.location.zipCode('#####');
  return { use, type: use === 'home' ? 'physical' : 'both', text: `${line}, ${city}, ${state} ${postalCode}, US`, line: [line], city, state, postalCode, country: 'US' };
};
/** Initials on a coloured square, as an inline SVG photo. */
const avatar = (f: Faker, { given, family }: Person) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="${f.color.rgb()}"/><text x="50" y="50" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dominant-baseline="central">${given[0]}${family[0]}</text></svg>`;
  return { contentType: 'image/svg+xml', data: Buffer.from(svg).toString('base64'), title: `${given} ${family}` };
};

function organizations(f: Faker) {
  const name = `${f.location.city()} ${f.helpers.arrayElement(['General Hospital', 'Medical Center', 'Community Health', 'Regional Clinic'])}`;
  const site = address(f, 'work');
  const administrator = person(f);
  const provider = {
    resourceType: 'Organization',
    id: f.string.uuid(),
    text: narrative(name, 'Healthcare Provider'),
    identifier: [identifier('organization', `ORG-${f.string.numeric(6)}`)],
    active: true,
    type: [concept(`${HL7}/organization-type`, ['prov', 'Healthcare Provider'])],
    name,
    alias: [name.split(' ').map(word => word[0]).join('').toUpperCase()],
    telecom: [phone(f, 'work'), { system: 'email', value: `info@${f.internet.domainWord()}.example.org`, use: 'work' }],
    address: [site],
    contact: [{
      purpose: concept(`${HL7}/contactentity-type`, ['ADMIN', 'Administrative']),
      name: humanName(administrator),
      telecom: [phone(f, 'work'), email(f, administrator, 'work')],
    }],
  };
  const specialty = f.helpers.arrayElement(DEPARTMENTS);
  const department = {
    resourceType: 'Organization',
    id: f.string.uuid(),
    text: narrative(`${name} ${specialty} Department`, `Hospital Department of ${name}`),
    identifier: [identifier('organization', `ORG-${f.string.numeric(6)}`)],
    active: true,
    type: [concept(`${HL7}/organization-type`, ['dept', 'Hospital Department'])],
    name: `${name} ${specialty} Department`,
    alias: [specialty],
    telecom: [phone(f, 'work')],
    address: [site],
    partOf: reference(provider),
  };
  return { provider, department };
}

function locations(f: Faker, provider: Provider) {
  const sites: { suffix: string; type: Code; physicalType: Code }[] = [
    { suffix: 'Main Campus', type: ['HOSP', 'Hospital'], physicalType: ['bu', 'Building'] },
    { suffix: 'Outpatient Clinic', type: ['OF', 'Outpatient facility'], physicalType: ['wi', 'Wing'] },
  ];
  return sites.map(({ suffix, type, physicalType }) => {
    const name = `${provider.name} ${suffix}`;
    return {
      resourceType: 'Location',
      id: f.string.uuid(),
      text: narrative(name, type[1]),
      identifier: [identifier('location', `LOC-${f.string.numeric(5)}`)],
      status: 'active',
      name,
      mode: 'instance',
      type: [concept(`${HL7}/v3-RoleCode`, type)],
      telecom: [phone(f, 'work')],
      address: provider.address[0],
      physicalType: concept(`${HL7}/location-physical-type`, physicalType),
      managingOrganization: reference(provider),
    };
  });
}

function healthcareServices(f: Faker, providers: Named[], sites: Named[]) {
  return f.helpers.arrayElements(SERVICES, providers.length * 2).map((service, index) => {
    const provider = providers[index % providers.length];
    const hours = service.allDay
      ? { daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], allDay: true }
      : { daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'], allDay: false, availableStartTime: '08:00:00', availableEndTime: '17:00:00' };
    return {
      resourceType: 'HealthcareService',
      id: f.string.uuid(),
      text: narrative(service.name, `Provided by ${provider.name}`),
      identifier: [identifier('healthcare-service', `HCS-${f.string.numeric(5)}`)],
      active: true,
      providedBy: reference(provider),
      category: [concept(`${HL7}/service-category`, service.category)],
      type: [concept(`${HL7}/service-type`, service.type)],
      specialty: [concept(SNOMED, service.specialty)],
      location: [reference(sites[service.allDay ? 0 : index % sites.length])],
      name: service.name,
      comment: service.allDay ? 'Walk-in emergency care, open at all hours.' : 'Consultations by appointment; referrals accepted.',
      telecom: [phone(f, 'work')],
      serviceProvisionCode: [concept(`${HL7}/service-provision-conditions`, f.helpers.arrayElement(PROVISION_CONDITIONS))],
      communication: [concept(BCP47, LANGUAGES[0]), concept(BCP47, f.helpers.arrayElement(LANGUAGES.slice(1)))],
      referralMethod: [concept(`${HL7}/service-referral-method`, f.helpers.arrayElement(REFERRAL_METHODS))],
      appointmentRequired: !service.allDay,
      availableTime: [hours],
      ...(!service.allDay && { availabilityExceptions: 'Closed on public holidays.' }),
    };
  });
}

function practitioners(f: Faker, provider: Provider): Staff[] {
  const qualifications = [
    QUALIFICATIONS.MD,
    f.helpers.arrayElement([QUALIFICATIONS.DO, QUALIFICATIONS.NP, QUALIFICATIONS.PA]),
    QUALIFICATIONS.RN,
  ];
  return qualifications.map((qualification) => {
    const who = person(f);
    const name = humanName(who, qualification.prefix);
    const birthDate = f.date.birthdate({ mode: 'age', min: 28, max: 68 });
    const qualifiedOn = new Date(Date.UTC(birthDate.getUTCFullYear() + f.number.int({ min: 23, max: 27 }), 5, 30));
    const resource = {
      resourceType: 'Practitioner',
      id: f.string.uuid(),
      text: narrative(name.text, `${qualification.code[1]} at ${provider.name}`),
      identifier: [identifier('provider-number', `PRV-${f.string.numeric(7)}`)],
      active: true,
      name: [name],
      telecom: [phone(f, 'work'), email(f, who, 'work')],
      address: [provider.address[0]],
      gender: who.sex,
      birthDate: birthDate.toISOString().slice(0, 10),
      photo: [avatar(f, who)],
      qualification: [{
        identifier: [identifier('licence', `LIC-${f.string.numeric(6)}`)],
        code: concept(`${HL7}/v2-0360`, qualification.code),
        period: { start: qualifiedOn.toISOString().slice(0, 10) },
        issuer: { display: `${f.location.state()} Board of Health Professions` },
      }],
      communication: [concept(BCP47, LANGUAGES[0]), concept(BCP47, f.helpers.arrayElement(LANGUAGES.slice(1)))],
    };
    return { resource, role: qualification.role, prescriber: qualification !== QUALIFICATIONS.RN };
  });
}

function patient(f: Faker, provider: Named, generalPractitioner: Labelled) {
  const who = person(f);
  const name = humanName(who);
  const birthDate = f.date.birthdate({ mode: 'age', min: 18, max: 90 }).toISOString().slice(0, 10);
  const kin = { ...person(f), family: f.datatype.boolean(0.6) ? who.family : f.person.lastName() };
  return {
    resourceType: 'Patient',
    id: f.string.uuid(),
    text: narrative(name.text, `${who.sex}, born ${birthDate}`),
    identifier: [{
      ...identifier('mrn', f.string.numeric(8)),
      use: 'usual',
      type: concept(`${HL7}/v2-0203`, ['MR', 'Medical record number']),
      assigner: reference(provider),
    }],
    active: true,
    name: [name],
    telecom: [phone(f, 'mobile'), email(f, who, 'home')],
    gender: who.sex,
    birthDate,
    address: [address(f, 'home')],
    maritalStatus: concept(`${HL7}/v3-MaritalStatus`, f.helpers.arrayElement(MARITAL_STATUSES)),
    photo: [avatar(f, who)],
    contact: [{
      relationship: [concept(`${HL7}/v2-0131`, ['N', 'Next-of-Kin'])],
      name: humanName(kin),
      telecom: [phone(f, 'mobile')],
      gender: kin.sex,
    }],
    communication: [{ language: concept(BCP47, f.helpers.arrayElement(LANGUAGES)), preferred: true }],
    generalPractitioner: [reference(generalPractitioner)],
    managingOrganization: reference(provider),
  };
}

function encounter(f: Faker, subject: Labelled, attender: Staff, provider: Named, sites: Named[]): Visit {
  const kind = f.helpers.weightedArrayElement(ENCOUNTER_KINDS);
  const status = f.helpers.weightedArrayElement([
    { weight: 7, value: 'finished' },
    { weight: 2, value: 'in-progress' },
    ...(kind.class[0] === 'EMER' ? [{ weight: 2, value: 'triaged' }] : []),
  ]);
  // Open encounters started a few hours before the reference date; finished ones ended before it.
  const start = status === 'finished'
    ? f.date.between({ from: addMinutes(REFERENCE_DATE, -540 * DAY), to: addMinutes(REFERENCE_DATE, -8 * DAY) })
    : addMinutes(REFERENCE_DATE, -f.number.int({ min: 180, max: 1200 }));
  const end = status === 'finished' ? addMinutes(start, f.number.int({ min: kind.minutes[0], max: kind.minutes[1] })) : undefined;
  const period = { start: start.toISOString(), ...(end && { end: end.toISOString() }) };
  const type = f.helpers.arrayElement(kind.types);
  const reasonCode: Visit['resource']['reasonCode'] = [];
  const diagnosis: Visit['resource']['diagnosis'] = [];
  const resource = {
    resourceType: 'Encounter',
    id: f.string.uuid(),
    text: narrative(`${type[1]} for ${label(subject)}`, `${kind.class[1]}, ${status}, started ${period.start}`),
    identifier: [identifier('encounter', `ENC-${f.string.numeric(7)}`)],
    status,
    class: coding(`${HL7}/v3-ActCode`, kind.class),
    type: [concept(SNOMED, type)],
    subject: reference(subject),
    participant: [{
      type: [concept(`${HL7}/v3-ParticipationType`, ['ATND', 'attender'])],
      period,
      individual: reference(attender.resource),
    }],
    period,
    reasonCode,
    diagnosis,
    location: [{ location: reference(sites[kind.site]), status: end ? 'completed' : 'active', period }],
    serviceProvider: reference(provider),
  };
  return { resource, start, end };
}

function condition(f: Faker, subject: Labelled, visit: Visit, recorder: Labelled, finding: Code, primary: boolean) {
  // A diagnosis the encounter relies on is never void, and an open encounter has no abated conditions.
  const state = f.helpers.weightedArrayElement([...ONGOING_STATES, ...(visit.end ? ABATED_STATES : []), ...(primary ? [] : VOID_STATES)]);
  const onset = CHRONIC_FINDINGS.includes(finding)
    ? f.date.between({ from: addMinutes(visit.start, -12 * 365 * DAY), to: addMinutes(visit.start, -180 * DAY) })
    : f.date.between({ from: addMinutes(visit.start, -14 * DAY), to: addMinutes(visit.start, -DAY) });
  const abatement = state.abated && visit.end
    ? f.date.between({ from: visit.end, to: addMinutes(visit.end, 3 * DAY) })
    : undefined;
  const severity = f.helpers.arrayElement(SEVERITIES);
  const recordedDate = visit.start.toISOString();
  return {
    resourceType: 'Condition',
    id: f.string.uuid(),
    text: narrative(`${finding[1]} for ${label(subject)}`, `${state.clinical?.[1] ?? 'No clinical status'}, ${state.verification[1]}`),
    ...(state.clinical && { clinicalStatus: concept(`${HL7}/condition-clinical`, state.clinical) }),
    verificationStatus: concept(`${HL7}/condition-ver-status`, state.verification),
    category: [concept(`${HL7}/condition-category`, primary ? ['encounter-diagnosis', 'Encounter Diagnosis'] : ['problem-list-item', 'Problem List Item'])],
    severity: concept(SNOMED, severity.code, severity.text),
    code: concept(SNOMED, finding),
    subject: reference(subject),
    encounter: reference(visit.resource),
    onsetDateTime: onset.toISOString(),
    ...(abatement && { abatementDateTime: abatement.toISOString() }),
    recordedDate,
    recorder: reference(recorder),
    asserter: reference(recorder),
    note: [{ authorReference: reference(recorder), time: recordedDate, text: f.helpers.arrayElement(CONDITION_NOTES) }],
  };
}

/** Draws a value, keeping most results inside the reference range. */
function draw(f: Faker, measure: Measure): number {
  const [min, max] = f.datatype.boolean(0.7)
    ? [measure.normal?.[0] ?? measure.span[0], measure.normal?.[1] ?? measure.span[1]]
    : measure.span;
  return measure.digits === 0 ? f.number.int({ min, max }) : f.number.float({ min, max, fractionDigits: measure.digits });
}

const rangeText = ({ normal = [undefined, undefined], unit }: Measure) => {
  const [low, high] = normal;
  if (low !== undefined && high !== undefined) return `${low}-${high} ${unit}`;
  return low !== undefined ? `>= ${low} ${unit}` : `<= ${high} ${unit}`;
};
const flag = ({ normal = [undefined, undefined] }: Measure, value: number): Code => {
  const [low, high] = normal;
  if (low !== undefined && value < low) return ['L', 'Low'];
  return high !== undefined && value > high ? ['H', 'High'] : ['N', 'Normal'];
};

/** value[x] plus, where a reference range applies, the range and its interpretation. */
function result(measure: Measure, value: number) {
  if (!measure.normal) return { valueQuantity: quantity(value, measure) };
  const [low, high] = measure.normal;
  return {
    valueQuantity: quantity(value, measure),
    interpretation: [concept(`${HL7}/v3-ObservationInterpretation`, flag(measure, value))],
    referenceRange: [{
      ...(low !== undefined && { low: quantity(low, measure) }),
      ...(high !== undefined && { high: quantity(high, measure) }),
      type: concept(`${HL7}/referencerange-meaning`, ['normal', 'Normal Range']),
      text: rangeText(measure),
    }],
  };
}

function vitalSign(f: Faker, kind: VitalKind, subject: Labelled, visit: Visit, performer: Labelled, body: Body) {
  const effective = addMinutes(visit.start, f.number.int({ min: 5, max: 20 }));
  const issued = addMinutes(effective, f.number.int({ min: 1, max: 5 })).toISOString();
  const observation = (codes: Code[], text: string, summary: string) => ({
    resourceType: 'Observation',
    id: f.string.uuid(),
    meta: { profile: [`http://hl7.org/fhir/StructureDefinition/${kind}`] },
    text: narrative(`${text} for ${label(subject)}`, summary),
    status: visit.end ? 'final' : 'preliminary',
    category: [concept(`${HL7}/observation-category`, ['vital-signs', 'Vital Signs'])],
    code: { coding: codes.map(code => coding(LOINC, code)), text },
    subject: reference(subject),
    encounter: reference(visit.resource),
    effectiveDateTime: effective.toISOString(),
    issued,
    performer: [reference(performer)],
  });

  if (kind === 'bp') {
    const systolic = draw(f, SYSTOLIC);
    const diastolic = Math.min(draw(f, DIASTOLIC), systolic - 25);
    const raised = flag(SYSTOLIC, systolic)[0] === 'H' || flag(DIASTOLIC, diastolic)[0] === 'H';
    return {
      ...observation([BLOOD_PRESSURE], 'Blood pressure', `${systolic}/${diastolic} mmHg`),
      interpretation: [concept(`${HL7}/v3-ObservationInterpretation`, raised ? ['H', 'High'] : ['N', 'Normal'])],
      component: [
        { code: concept(LOINC, SYSTOLIC.code), ...result(SYSTOLIC, systolic) },
        { code: concept(LOINC, DIASTOLIC.code), ...result(DIASTOLIC, diastolic) },
      ],
    };
  }

  const readings: Record<Exclude<VitalKind, 'bp'>, () => [Measure, number]> = {
    heartrate: () => [HEART_RATE, draw(f, HEART_RATE)],
    resprate: () => [RESPIRATORY_RATE, draw(f, RESPIRATORY_RATE)],
    bodytemp: () => [BODY_TEMPERATURE, draw(f, BODY_TEMPERATURE)],
    oxygensat: () => [OXYGEN_SATURATION, draw(f, OXYGEN_SATURATION)],
    bodyheight: () => [BODY_HEIGHT, body.heightCm],
    bodyweight: () => [BODY_WEIGHT, body.weightKg],
    bmi: () => [BODY_MASS_INDEX, Math.round((body.weightKg / (body.heightCm / 100) ** 2) * 10) / 10],
  };
  const [measure, value] = readings[kind]();
  return {
    ...observation(kind === 'oxygensat' ? [measure.code, PULSE_OXIMETRY] : [measure.code], measure.text, `${value} ${measure.unit}`),
    ...result(measure, value),
  };
}

/** Minimal single-page PDF 1.4 (standard fonts, WinAnsi text), so a report has a real presentedForm. */
function pdf(title: string, details: string[], table: string[], footer: string[]): string {
  const literal = (value: string) => value.replace(/[^\x20-\x7e\xa0-\xff]/g, '?').replace(/[\\()]/g, '\\$&');
  const operations: string[] = [];
  let y = 742;
  const write = (font: string, size: number, lines: string[], leading: number) => {
    for (const line of lines) {
      operations.push(`BT /${font} ${size} Tf 50 ${y} Td (${literal(line)}) Tj ET`);
      y -= leading;
    }
    y -= leading / 2;
  };
  write('F2', 16, [title], 24);
  write('F1', 10, details, 14);
  write('F3', 9, table, 13);
  write('F1', 10, footer, 14);

  const stream = operations.join('\n');
  const font = (name: string) => `<< /Type /Font /Subtype /Type1 /BaseFont /${name} /Encoding /WinAnsiEncoding >>`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /Contents 7 0 R >>',
    font('Helvetica'),
    font('Helvetica-Bold'),
    font('Courier'),
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    `<< /Title (${literal(title)}) /Producer (fhir-demo-app synthetic data) >>`,
  ];
  // Every character is a single Latin-1 byte, so string offsets are byte offsets.
  let file = '%PDF-1.4\n';
  const offsets = objects.map((object, index) => {
    const offset = file.length;
    file += `${index + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const xref = file.length;
  file += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  file += offsets.map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  file += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info ${objects.length} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(file, 'latin1').toString('base64');
}

function diagnosticReport(f: Faker, subject: Subject, visit: Visit, laboratory: Named, interpreter: Labelled) {
  const panel = f.helpers.arrayElement(LAB_PANELS);
  const status = visit.end
    ? f.helpers.weightedArrayElement([{ weight: 9, value: 'final' }, { weight: 1, value: 'amended' }])
    : f.helpers.weightedArrayElement([{ weight: 2, value: 'preliminary' }, { weight: 1, value: 'partial' }, { weight: 1, value: 'registered' }]);
  const collected = addMinutes(visit.start, f.number.int({ min: 20, max: 40 })).toISOString();
  const issued = addMinutes(new Date(collected), f.number.int({ min: 30, max: 90 })).toISOString();
  // A registered report has no results yet and a partial one has only some of them.
  const tests = status === 'registered' ? [] : status === 'partial' ? panel.tests.slice(0, 2) : panel.tests;

  const measured = tests.map(test => ({ test, value: draw(f, test) }));
  const observations = measured.map(({ test, value }) => ({
    resourceType: 'Observation',
    id: f.string.uuid(),
    text: narrative(`${test.text} for ${label(subject)}`, `${value} ${test.unit} (reference ${rangeText(test)})`),
    status: visit.end ? 'final' : 'preliminary',
    category: [concept(`${HL7}/observation-category`, ['laboratory', 'Laboratory'])],
    code: concept(LOINC, test.code, test.text),
    subject: reference(subject),
    encounter: reference(visit.resource),
    effectiveDateTime: collected,
    issued,
    performer: [reference(laboratory)],
    ...result(test, value),
  }));

  const abnormal = measured.filter(({ test, value }) => flag(test, value)[0] !== 'N');
  const conclusion = abnormal.length
    ? `Outside the reference range: ${abnormal.map(({ test, value }) => `${test.text} ${flag(test, value)[1].toLowerCase()} (${value} ${test.unit})`).join('; ')}.`
    : 'All results are within the reference ranges.';
  const title = `${panel.text} report`;
  const resource = {
    resourceType: 'DiagnosticReport',
    id: f.string.uuid(),
    text: narrative(`${title} for ${label(subject)}`, `${status}, collected ${collected}`),
    identifier: [identifier('diagnostic-report', `RPT-${f.string.numeric(7)}`)],
    status,
    category: [concept(`${HL7}/v2-0074`, ['LAB', 'Laboratory'])],
    code: concept(LOINC, panel.code, panel.text),
    subject: reference(subject),
    encounter: reference(visit.resource),
    effectiveDateTime: collected,
    ...(tests.length > 0 && {
      issued,
      performer: [reference(laboratory)],
      resultsInterpreter: [reference(interpreter)],
      result: observations.map(reference),
      conclusion,
      presentedForm: [{
        contentType: 'application/pdf',
        language: 'en-US',
        data: pdf(
          title,
          [
            `Patient: ${label(subject)} (${subject.gender}, born ${subject.birthDate}), MRN ${subject.identifier[0].value}`,
            `Laboratory: ${laboratory.name}`,
            `Interpreted by: ${label(interpreter)}`,
            `Collected: ${collected}   Reported: ${issued}   Status: ${status}`,
          ],
          [
            `${'Test'.padEnd(22)}${'Result'.padStart(8)}  ${'Unit'.padEnd(10)}${'Reference range'.padEnd(22)}Flag`,
            '-'.repeat(66),
            ...measured.map(({ test, value }) =>
              `${test.text.padEnd(22)}${String(value).padStart(8)}  ${test.unit.padEnd(10)}${rangeText(test).padEnd(22)}${flag(test, value)[0]}`),
          ],
          [conclusion, 'Synthetic data generated for demonstration. Not for clinical use.'],
        ),
        title,
        creation: issued,
      }],
    }),
  };
  return { resource, observations };
}

function careTeam(f: Faker, subject: Labelled, staff: Staff[], provider: Named, problems: Labelled[], since: Date) {
  const status = f.helpers.weightedArrayElement([
    { weight: 6, value: 'active' },
    { weight: 1, value: 'proposed' },
    { weight: 1, value: 'suspended' },
    { weight: 1, value: 'inactive' },
  ]);
  const start = since.toISOString();
  const name = `${label(subject)} Care Team`;
  return {
    resourceType: 'CareTeam',
    id: f.string.uuid(),
    text: narrative(name, `${status}, managed by ${provider.name}`),
    identifier: [identifier('care-team', `CT-${f.string.numeric(6)}`)],
    status,
    category: [concept(LOINC, ['LA28865-6', 'Longitudinal care-coordination focused care team'])],
    name,
    subject: reference(subject),
    period: { start, ...(status === 'inactive' && { end: addMinutes(REFERENCE_DATE, -DAY).toISOString() }) },
    participant: f.helpers.arrayElements(staff, { min: 2, max: staff.length }).map(member => ({
      role: [concept(SNOMED, member.role)],
      member: reference(member.resource),
      onBehalfOf: reference(provider),
      period: { start },
    })),
    ...(problems.length > 0 && { reasonReference: problems.map(reference) }),
    managingOrganization: [reference(provider)],
    telecom: [phone(f, 'work')],
    note: [{ time: start, text: 'Coordinates ongoing care and follow-up between visits.' }],
  };
}

/** One collection Bundle: a provider organisation, its staff and the records of five patients. */
export function generateBundle(seed: number = DEFAULT_SEED): Bundle {
  const f = new Faker({ locale: [en, base] });
  f.seed(seed);
  f.setDefaultRefDate(REFERENCE_DATE);

  const { provider, department } = organizations(f);
  const sites = locations(f, provider);
  const services = healthcareServices(f, [provider, department], sites);
  const staff = practitioners(f, provider);
  const prescribers = staff.filter(member => member.prescriber);
  const nurse = staff[staff.length - 1].resource;

  const patients: FhirResource[] = [];
  const encounters: FhirResource[] = [];
  const conditions: FhirResource[] = [];
  const observations: FhirResource[] = [];
  const reports: FhirResource[] = [];
  const careTeams: FhirResource[] = [];

  for (let index = 0; index < 5; index++) {
    const subject = patient(f, provider, staff[0].resource);
    const heightCm = f.number.float({ min: subject.gender === 'male' ? 162 : 150, max: subject.gender === 'male' ? 195 : 180, fractionDigits: 1 });
    const body: Body = { heightCm, weightKg: Math.round(f.number.float({ min: 19, max: 36 }) * (heightCm / 100) ** 2 * 10) / 10 };
    const diagnosed = new Set<Code>();
    const problems: Labelled[] = [];
    let firstSeen = REFERENCE_DATE;
    patients.push(subject);

    for (let visitIndex = 0; visitIndex < 2; visitIndex++) {
      const attender = f.helpers.arrayElement(prescribers);
      const visit = encounter(f, subject, attender, visitIndex === 0 ? provider : department, sites);
      if (visit.start < firstSeen) firstSeen = visit.start;
      encounters.push(visit.resource);

      const diagnoses = f.datatype.boolean(0.5) ? 2 : 1;
      for (let rank = 1; rank <= diagnoses; rank++) {
        const primary = rank === 1;
        const candidates = (primary ? [...ACUTE_FINDINGS, ...CHRONIC_FINDINGS] : CHRONIC_FINDINGS).filter(finding => !diagnosed.has(finding));
        const finding = f.helpers.arrayElement(candidates);
        diagnosed.add(finding);
        const diagnosis = condition(f, subject, visit, attender.resource, finding, primary);
        conditions.push(diagnosis);
        if (primary) {
          visit.resource.reasonCode.push(diagnosis.code);
          visit.resource.diagnosis.push({
            condition: reference(diagnosis),
            use: concept(`${HL7}/diagnosis-role`, visit.end ? ['DD', 'Discharge diagnosis'] : ['AD', 'Admission diagnosis']),
            rank,
          });
        } else if (diagnosis.clinicalStatus?.coding[0].code === 'active') {
          problems.push(diagnosis);
        }
      }

      for (const kind of f.helpers.arrayElements(VITAL_KINDS, 3)) {
        observations.push(vitalSign(f, kind, subject, visit, nurse, body));
      }
      if (visitIndex === 0 || f.datatype.boolean(0.3)) {
        const report = diagnosticReport(f, subject, visit, provider, staff[0].resource);
        reports.push(report.resource);
        observations.push(...report.observations);
      }
    }
    careTeams.push(careTeam(f, subject, staff, provider, problems, firstSeen));
  }

  const resources: FhirResource[] = [
    ...patients, ...staff.map(member => member.resource), provider, department, ...sites, ...services,
    ...encounters, ...conditions, ...observations, ...reports, ...careTeams,
  ];
  return {
    resourceType: 'Bundle',
    id: f.string.uuid(),
    type: 'collection',
    timestamp: REFERENCE_DATE.toISOString(),
    entry: resources.map(resource => ({
      fullUrl: `${FHIR_BASE_URL}/${resource.resourceType}/${resource.id}`,
      resource,
    })),
  };
}

/** The demo data set: `count` bundles derived from consecutive seeds. */
export function generateBundles(seed: number = DEFAULT_SEED, count: number = 3): Bundle[] {
  return Array.from({ length: count }, (_, index) => generateBundle(seed + index));
}

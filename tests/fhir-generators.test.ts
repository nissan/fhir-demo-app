import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FHIR_BASE_URL, generateBundle, generateBundles } from '../utils/fhir-generators';

type Coding = { system?: string; code?: string; display?: string };
type Concept = { coding: Coding[] };
type Quantity = { value: number; system: string; code: string };
type Reference = { reference: string };
type Measured = {
  valueQuantity?: Quantity;
  interpretation?: Concept[];
  referenceRange?: { low?: Quantity; high?: Quantity }[];
};
type Resource = {
  resourceType: string;
  id: string;
  subject?: Reference;
  encounter?: Reference;
  // Condition
  clinicalStatus?: Concept;
  verificationStatus?: Concept;
  category?: Concept[];
  abatementDateTime?: string;
  // Observation
  code?: Concept;
  component?: (Measured & { code: Concept })[];
  // DiagnosticReport
  status?: string;
  result?: Reference[];
  presentedForm?: { contentType: string; data: string }[];
} & Measured;
type Entry = { fullUrl: string; resource: Resource };

const SEEDS = [1, 2, 20241028, 20241029, 20241030];
const UCUM = 'http://unitsofmeasure.org';

// A JSON round trip gives the test exactly what a browser or a FHIR client would receive.
const entriesOf = (seed: number): Entry[] => JSON.parse(JSON.stringify(generateBundle(seed))).entry;
const resourcesOf = (seed: number, resourceType: string) =>
  entriesOf(seed).map(entry => entry.resource).filter(resource => resource.resourceType === resourceType);
const code = (concept: Concept | undefined) => concept?.coding[0].code;

/** Every object nested anywhere in a value. */
function objects(value: unknown): Record<string, unknown>[] {
  if (typeof value !== 'object' || value === null) return [];
  const nested = Object.values(value).flatMap(objects);
  return Array.isArray(value) ? nested : [value as Record<string, unknown>, ...nested];
}

test('the same seed always generates the same data, so ids survive a reload', () => {
  assert.equal(JSON.stringify(generateBundle(7)), JSON.stringify(generateBundle(7)));
  assert.notEqual(JSON.stringify(generateBundle(7)), JSON.stringify(generateBundle(8)));
  assert.equal(JSON.stringify(generateBundles()), JSON.stringify(generateBundles()));
});

test('a collection bundle carries no search total (bdl-1)', () => {
  const bundle = generateBundle(1);
  assert.equal(bundle.type, 'collection');
  assert.equal('total' in bundle, false);
});

test('every reference resolves to an entry of the same bundle', () => {
  for (const seed of SEEDS) {
    const entries = entriesOf(seed);
    const fullUrls = new Set(entries.map(entry => entry.fullUrl));
    assert.equal(fullUrls.size, entries.length, 'fullUrls are unique');
    for (const { fullUrl, resource } of entries) {
      assert.equal(fullUrl, `${FHIR_BASE_URL}/${resource.resourceType}/${resource.id}`);
      for (const node of objects(resource)) {
        if (typeof node.reference !== 'string') continue;
        assert.ok(fullUrls.has(`${FHIR_BASE_URL}/${node.reference}`), `${resource.resourceType} points at missing ${node.reference}`);
      }
    }
  }
});

test('every coding names its system, code and display', () => {
  for (const seed of SEEDS) {
    for (const node of objects(entriesOf(seed))) {
      if (!Array.isArray(node.coding)) continue;
      for (const coding of node.coding as Coding[]) {
        assert.ok(coding.system && coding.code && coding.display, `incomplete coding ${JSON.stringify(coding)}`);
      }
    }
  }
});

test('no date lies after the bundle timestamp', () => {
  for (const seed of SEEDS) {
    const { timestamp } = generateBundle(seed);
    for (const node of objects(entriesOf(seed))) {
      for (const value of Object.values(node)) {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value)) continue;
        assert.ok(value <= timestamp, `${value} is after ${timestamp}`);
      }
    }
  }
});

test('condition statuses satisfy con-3, con-4 and con-5', () => {
  for (const seed of SEEDS) {
    for (const condition of resourcesOf(seed, 'Condition')) {
      const clinical = code(condition.clinicalStatus);
      const verification = code(condition.verificationStatus);
      if (verification === 'entered-in-error') {
        assert.equal(clinical, undefined, 'con-5: no clinicalStatus when entered in error');
      } else if (code(condition.category?.[0]) === 'problem-list-item') {
        assert.ok(clinical, 'con-3: problem list items carry a clinicalStatus');
      }
      if (condition.abatementDateTime) {
        assert.ok(['inactive', 'resolved', 'remission'].includes(clinical ?? ''), `con-4: abated but ${clinical}`);
      }
    }
  }
});

test('measurements use UCUM and flag values outside their reference range', () => {
  for (const seed of SEEDS) {
    for (const observation of resourcesOf(seed, 'Observation')) {
      const measured: Measured[] = observation.component ?? [observation];
      for (const { valueQuantity, interpretation, referenceRange } of measured) {
        assert.ok(valueQuantity, `${code(observation.code)} has no value`);
        assert.equal(valueQuantity.system, UCUM);
        assert.ok(valueQuantity.code);
        if (!referenceRange) continue;
        const [{ low, high }] = referenceRange;
        const expected = low && valueQuantity.value < low.value ? 'L' : high && valueQuantity.value > high.value ? 'H' : 'N';
        assert.equal(code(interpretation?.[0]), expected);
        assert.equal((low ?? high)?.code, valueQuantity.code, 'range and value share a unit');
      }
    }
  }
});

test('blood pressure is a panel with systolic and diastolic components in mm[Hg]', () => {
  const panels = SEEDS.flatMap(seed => resourcesOf(seed, 'Observation')).filter(observation => code(observation.code) === '85354-9');
  assert.ok(panels.length > 0);
  for (const panel of panels) {
    assert.deepEqual(panel.component?.map(component => code(component.code)), ['8480-6', '8462-4']);
    assert.deepEqual(panel.component?.map(component => component.valueQuantity?.code), ['mm[Hg]', 'mm[Hg]']);
  }
});

test('a diagnostic report only lists results of its own patient and encounter', () => {
  for (const seed of SEEDS) {
    const observations = new Map(resourcesOf(seed, 'Observation').map(observation => [`Observation/${observation.id}`, observation]));
    for (const report of resourcesOf(seed, 'DiagnosticReport')) {
      assert.equal(report.status === 'registered', report.result === undefined, 'only a registered report has no results');
      for (const { reference } of report.result ?? []) {
        const observation = observations.get(reference);
        assert.equal(observation?.subject?.reference, report.subject?.reference);
        assert.equal(observation?.encounter?.reference, report.encounter?.reference);
      }
    }
  }
});

test('the presented form is a well-formed PDF', () => {
  const forms = SEEDS.flatMap(seed => resourcesOf(seed, 'DiagnosticReport')).flatMap(report => report.presentedForm ?? []);
  assert.ok(forms.length > 0);
  for (const form of forms) {
    assert.equal(form.contentType, 'application/pdf');
    const file = Buffer.from(form.data, 'base64').toString('latin1');
    assert.ok(file.startsWith('%PDF-1.4\n') && file.endsWith('%%EOF\n'));

    const xref = Number(/startxref\n(\d+)\n%%EOF\n$/.exec(file)?.[1]);
    assert.ok(file.startsWith('xref\n', xref), 'startxref points at the cross-reference table');
    const offsets = Array.from(file.slice(xref).matchAll(/^(\d{10}) 00000 n $/gm), match => Number(match[1]));
    assert.equal(offsets.length, 8);
    offsets.forEach((offset, index) => assert.ok(file.startsWith(`${index + 1} 0 obj\n`, offset), `object ${index + 1} offset`));

    const stream = /<< \/Length (\d+) >>\nstream\n([\s\S]*)\nendstream/.exec(file);
    assert.equal(stream?.[2].length, Number(stream?.[1]), 'stream length');
  }
});

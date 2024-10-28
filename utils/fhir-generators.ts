import { faker } from '@faker-js/faker';
import { Buffer } from 'buffer';

// Add this near the top of the file
type FHIRResource = {
  resourceType: string;
  id: string;
  [key: string]: any;
};

export const generatePatient = () => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  // Generate a random color for the avatar
  const color = faker.internet.color();
  // Create a simple SVG avatar with the patient's initials
  const initials = `${firstName[0]}${lastName[0]}`;
  const svgAvatar = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="${color}" />
      <text x="50" y="50" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text>
    </svg>
  `;
  const base64Avatar = Buffer.from(svgAvatar).toString('base64');

  return {
    resourceType: "Patient",
    id: faker.string.uuid(),
    name: [{ 
      use: 'official',
      family: lastName,
      given: [firstName]
    }],
    gender: faker.helpers.arrayElement(['male', 'female', 'other']),
    birthDate: faker.date.birthdate().toISOString().split('T')[0],
    address: [{
      use: 'home',
      type: 'physical',
      line: [faker.location.streetAddress()],
      city: faker.location.city(),
      state: faker.location.state(),
      postalCode: faker.location.zipCode(),
      country: faker.location.country()
    }],
    telecom: [{
      system: 'phone',
      value: faker.phone.number(),
      use: 'home'
    }],
    photo: [{
      contentType: 'image/svg+xml',
      data: base64Avatar
    }]
  };
};

export const generatePractitioner = () => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  // Generate a random color for the avatar
  const color = faker.internet.color();
  // Create a simple SVG avatar with the practitioner's initials
  const initials = `${firstName[0]}${lastName[0]}`;
  const svgAvatar = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="${color}" />
      <text x="50" y="50" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text>
    </svg>
  `;
  const base64Avatar = Buffer.from(svgAvatar).toString('base64');

  return {
    resourceType: "Practitioner",
    id: faker.string.uuid(),
    name: [{ 
      use: 'official',
      family: lastName,
      given: [firstName]
    }],
    gender: faker.helpers.arrayElement(['male', 'female', 'other']),
    birthDate: faker.date.birthdate().toISOString().split('T')[0],
    qualification: [{
      code: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v2-0360",
          code: faker.helpers.arrayElement(['MD', 'DO', 'RN', 'NP', 'PA'])
        }]
      },
      period: {
        start: faker.date.past().toISOString().split('T')[0]
      },
      issuer: {
        display: faker.company.name() + " Medical School"
      }
    }],
    photo: [{
      contentType: 'image/svg+xml',
      data: base64Avatar
    }]
  };
};

export const generateOrganisation = () => ({
  resourceType: "Organization",
  id: faker.string.uuid(),
  name: faker.company.name(),
  alias: [faker.company.catchPhrase()],
  type: [{
    coding: [{
      system: "http://terminology.hl7.org/CodeSystem/organization-type",
      code: faker.helpers.arrayElement(['prov', 'dept', 'team', 'govt', 'ins', 'pay', 'edu', 'reli', 'crs', 'cg'])
    }]
  }],
  telecom: [{
    system: 'phone',
    value: faker.phone.number(),
    use: 'work'
  }, {
    system: 'email',
    value: faker.internet.email(),
    use: 'work'
  }],
  address: [{
    use: 'work',
    type: 'both',
    line: [faker.location.streetAddress()],
    city: faker.location.city(),
    state: faker.location.state(),
    postalCode: faker.location.zipCode(),
    country: faker.location.country()
  }]
});

export const generateEncounter = (patient: any, practitioners: any[], organizations: any[]) => ({
  resourceType: "Encounter",
  id: faker.string.uuid(),
  status: faker.helpers.arrayElement(['planned', 'arrived', 'triaged', 'in-progress', 'onleave', 'finished', 'cancelled']),
  class: {
    system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    code: faker.helpers.arrayElement(['AMB', 'EMER', 'IMP', 'ACUTE', 'NONAC', 'OBSENC', 'PRENC', 'SS']),
    display: 'ambulatory'
  },
  subject: {
    reference: `Patient/${patient.id}`
  },
  participant: [
    {
      individual: {
        reference: `Practitioner/${faker.helpers.arrayElement(practitioners).id}`
      }
    }
  ],
  serviceProvider: {
    reference: `Organization/${faker.helpers.arrayElement(organizations).id}`
  }
});

export const generateObservation = (encounter: any) => {
  const loincCodes = [
    { code: "8867-4", display: "Heart rate" },
    { code: "8480-6", display: "Systolic blood pressure" },
    { code: "8462-4", display: "Diastolic blood pressure" },
    { code: "8310-5", display: "Body temperature" },
    { code: "9279-1", display: "Respiratory rate" },
    { code: "8302-2", display: "Body height" },
    { code: "29463-7", display: "Body weight" },
    { code: "39156-5", display: "Body mass index" },
    { code: "59408-5", display: "Oxygen saturation" },
    { code: "8478-0", display: "Mean blood pressure" }
  ];

  const selectedCode = faker.helpers.arrayElement(loincCodes);

  return {
    resourceType: "Observation",
    id: faker.string.uuid(),
    status: faker.helpers.arrayElement(['registered', 'preliminary', 'final', 'amended']),
    category: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/observation-category",
        code: "vital-signs",
        display: "Vital Signs"
      }]
    }],
    code: {
      coding: [{
        system: "http://loinc.org",
        code: selectedCode.code,
        display: selectedCode.display
      }],
      text: selectedCode.display
    },
    subject: {
      reference: encounter.subject.reference
    },
    encounter: {
      reference: `Encounter/${encounter.id}`
    },
    effectiveDateTime: faker.date.recent().toISOString(),
    issued: faker.date.recent().toISOString(),
    performer: [{
      reference: faker.helpers.arrayElement(encounter.participant.map((p: { individual: { reference: string } }) => p.individual.reference))
    }],
    valueQuantity: {
      value: faker.number.float({ min: 60, max: 100, fractionDigits: 1 }),
      unit: "beats/minute",
      system: "http://unitsofmeasure.org",
      code: "/min"
    }
  };
};

export const generateCondition = (encounter: any) => ({
  resourceType: "Condition",
  id: faker.string.uuid(),
  clinicalStatus: {
    coding: [{
      system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
      code: faker.helpers.arrayElement(["active", "recurrence", "relapse", "inactive", "remission", "resolved"])
    }]
  },
  verificationStatus: {
    coding: [{
      system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
      code: faker.helpers.arrayElement(["unconfirmed", "provisional", "differential", "confirmed", "refuted", "entered-in-error"])
    }]
  },
  category: [{
    coding: [{
      system: "http://terminology.hl7.org/CodeSystem/condition-category",
      code: faker.helpers.arrayElement(["problem-list-item", "encounter-diagnosis"])
    }]
  }],
  severity: {
    coding: [{
      system: "http://snomed.info/sct",
      code: faker.helpers.arrayElement(["24484000", "6736007", "255604002"]),
      display: faker.helpers.arrayElement(["Severe", "Moderate", "Mild"])
    }]
  },
  code: {
    coding: [{
      system: "http://snomed.info/sct",
      code: faker.string.numeric(8),
      display: faker.lorem.word()
    }]
  },
  subject: {
    reference: encounter.subject.reference
  },
  encounter: {
    reference: `Encounter/${encounter.id}`
  },
  onsetDateTime: faker.date.past().toISOString(),
  recordedDate: faker.date.recent().toISOString(),
});

export const generateDiagnosticReport = (encounter: any, practitioners: any[], observations: any[]) => ({
  resourceType: "DiagnosticReport",
  id: faker.string.uuid(),
  status: faker.helpers.arrayElement(['registered', 'partial', 'preliminary', 'final']),
  code: {
    coding: [{
      system: "http://loinc.org",
      code: faker.helpers.arrayElement(["58410-2", "30954-2", "29463-7"]),
      display: faker.helpers.arrayElement([
        "Complete blood count panel",
        "Basic metabolic panel",
        "Lipid panel"
      ])
    }]
  },
  subject: {
    reference: encounter.subject.reference
  },
  encounter: {
    reference: `Encounter/${encounter.id}`
  },
  effectiveDateTime: faker.date.recent().toISOString(),
  issued: faker.date.recent().toISOString(),
  performer: [{
    reference: `Practitioner/${faker.helpers.arrayElement(practitioners).id}`
  }],
  result: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
    reference: `Observation/${faker.helpers.arrayElement(observations).id}`
  })),
  conclusion: faker.lorem.sentence()
});

export const generateCareTeam = (patient: any, practitioners: any[]) => ({
  resourceType: "CareTeam",
  id: faker.string.uuid(),
  status: faker.helpers.arrayElement(['proposed', 'active', 'suspended', 'inactive']),
  name: faker.company.name() + " Care Team",
  subject: {
    reference: `Patient/${patient.id}`
  },
  participant: [
    {
      role: [{
        coding: [{
          system: "http://snomed.info/sct",
          code: "223366009",
          display: "Healthcare professional"
        }]
      }],
      member: {
        reference: `Practitioner/${faker.helpers.arrayElement(practitioners).id}`
      }
    }
  ]
});

export const generateHealthcareService = (organization: any) => ({
  resourceType: "HealthcareService",
  id: faker.string.uuid(),
  providedBy: {
    reference: `Organization/${organization.id}`
  },
  category: [{
    coding: [{
      system: "http://terminology.hl7.org/CodeSystem/service-category",
      code: faker.helpers.arrayElement(['1', '2', '34', '33', '26']),
      display: faker.helpers.arrayElement(['Adoption', 'Aged Care', 'Counselling', 'Disability Support', 'General Practice'])
    }]
  }],
  type: [{
    coding: [{
      system: "http://terminology.hl7.org/CodeSystem/service-type",
      code: faker.helpers.arrayElement(['124', '359', '519']),
      display: faker.helpers.arrayElement(['General Practice', 'Community Health', 'Specialist Medical'])
    }]
  }],
  name: faker.company.catchPhrase() + " Service",
  telecom: [{
    system: 'phone',
    value: faker.phone.number()
  }],
  location: [{
    reference: `Location/${faker.string.uuid()}`
  }]
});

export function generateBundle() {
  const patients = Array.from({ length: 5 }, generatePatient);
  const practitioners = Array.from({ length: 3 }, generatePractitioner);
  const organizations = Array.from({ length: 2 }, generateOrganisation);

  const encounters = patients.flatMap(patient => 
    Array.from({ length: 2 }, () => generateEncounter(patient, practitioners, organizations))
  );

  const observations = encounters.flatMap(encounter => 
    Array.from({ length: 3 }, () => generateObservation(encounter))
  );

  const conditions = encounters.flatMap(encounter => 
    Array.from({ length: 2 }, () => generateCondition(encounter))
  );

  const diagnosticReports = encounters.flatMap(encounter => 
    Array.from({ length: 1 }, () => generateDiagnosticReport(encounter, practitioners, observations))
  );

  const careTeams = patients.flatMap(patient => 
    Array.from({ length: 1 }, () => generateCareTeam(patient, practitioners))
  );

  const healthcareServices = organizations.flatMap(organization => 
    Array.from({ length: 2 }, () => generateHealthcareService(organization))
  );

  const allResources = [
    ...patients,
    ...practitioners,
    ...organizations,
    ...encounters,
    ...conditions,
    ...observations,
    ...diagnosticReports,
    ...careTeams,
    ...healthcareServices,
  ];

  const bundle = {
    resourceType: 'Bundle',
    id: faker.string.uuid(),
    type: 'collection',
    total: allResources.length,
    entry: allResources.map(resource => ({
      fullUrl: `urn:uuid:${resource.id}`,
      resource: resource
    }))
  };

  return bundle;
}

function wrapInBundleEntry(resource: FHIRResource) {
  return { resource: resource };
}

'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { faker } from '@faker-js/faker';

// Helper function to generate a random FHIR resource
const generateResource = (resourceType: string) => {
  const id = faker.string.uuid();
  const common = {
    resourceType,
    id,
    meta: {
      versionId: "1",
      lastUpdated: faker.date.recent().toISOString()
    }
  };

  switch (resourceType) {
    case 'Patient':
      return {
        ...common,
        name: [{ 
          use: 'official',
          family: faker.person.lastName(),
          given: [faker.person.firstName()]
        }],
        gender: faker.helpers.arrayElement(['male', 'female', 'other']),
        birthDate: faker.date.birthdate().toISOString().split('T')[0]
      };
    case 'Practitioner':
      return {
        ...common,
        name: [{ 
          use: 'official',
          family: faker.person.lastName(),
          given: [faker.person.firstName()]
        }],
        qualification: [{
          code: {
            coding: [{
              system: "http://terminology.hl7.org/CodeSystem/v2-0360",
              code: faker.helpers.arrayElement(['MD', 'DO', 'RN'])
            }]
          }
        }]
      };
    case 'CareTeam':
      return {
        ...common,
        status: faker.helpers.arrayElement(['proposed', 'active', 'suspended', 'inactive']),
        name: faker.company.name() + " Care Team"
      };
    case 'Organization':
      return {
        ...common,
        name: faker.company.name(),
        telecom: [{
          system: 'phone',
          value: faker.phone.number()
        }]
      };
    case 'HealthcareService':
      return {
        ...common,
        providedBy: {
          reference: `Organization/${faker.string.uuid()}`
        },
        type: [{
          coding: [{
            system: "http://terminology.hl7.org/CodeSystem/service-type",
            code: faker.helpers.arrayElement(['124', '359', '519'])
          }]
        }],
        name: faker.company.catchPhrase() + " Service"
      };
    case 'Observation':
      return {
        ...common,
        status: 'final',
        code: {
          coding: [{
            system: "http://loinc.org",
            code: "8867-4",
            display: "Heart rate"
          }]
        },
        valueQuantity: {
          value: faker.number.int({ min: 60, max: 100 }),
          unit: "beats/minute"
        }
      };
    case 'DiagnosticReport':
      return {
        ...common,
        status: 'final',
        code: {
          coding: [{
            system: "http://loinc.org",
            code: "58410-2",
            display: "Complete blood count (hemogram) panel - Blood by Automated count"
          }]
        },
        conclusion: faker.lorem.sentence()
      };
    case 'Specimen':
      return {
        ...common,
        type: {
          coding: [{
            system: "http://snomed.info/sct",
            code: "119364003",
            display: "Serum specimen"
          }]
        },
        receivedTime: faker.date.recent().toISOString()
      };
    case 'Encounter':
      return {
        ...common,
        status: faker.helpers.arrayElement(['planned', 'arrived', 'triaged', 'in-progress', 'finished']),
        class: {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: faker.helpers.arrayElement(['AMB', 'IMP', 'EMER'])
        },
        type: [{
          coding: [{
            system: "http://snomed.info/sct",
            code: "308335008",
            display: "Patient encounter procedure"
          }]
        }]
      };
    default:
      return common;
  }
};

// Generate a FHIR Bundle with random resources
const generateBundle = () => {
  const resourceTypes = ['Patient', 'Practitioner', 'CareTeam', 'Organization', 'HealthcareService', 'Observation', 'DiagnosticReport', 'Specimen', 'Encounter'];
  const entries = resourceTypes.map(type => ({
    resource: generateResource(type)
  }));

  return {
    resourceType: "Bundle",
    type: "collection",
    entry: entries
  };
};

const ResourceCard = ({ resource }: { resource: any }) => (
  <Card>
    <CardHeader>
      <CardTitle>{resource.resourceType}</CardTitle>
    </CardHeader>
    <CardContent>
      <pre className="text-sm overflow-auto max-h-40">
        {JSON.stringify(resource, null, 2)}
      </pre>
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const [bundle, setBundle] = React.useState<any>(null);

  React.useEffect(() => {
    setBundle(generateBundle());
  }, []);

  if (!bundle) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">FHIR Bundle Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bundle.entry.map((entry: any, index: number) => (
          <ResourceCard key={index} resource={entry.resource} />
        ))}
      </div>
    </div>
  );
}

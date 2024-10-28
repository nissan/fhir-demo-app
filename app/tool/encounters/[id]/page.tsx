'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { getEncounters, getPractitioners, getPatients, getOrganizations } from '@/utils/data-store';
import { Settings } from 'lucide-react';

// Define the FHIR Encounter fields
const encounterFields = [
  'id', 'status', 'class', 'type', 'subject', 'participant', 'period',
  'reasonCode', 'diagnosis', 'location', 'serviceProvider'
];

export default function EncounterDetailsPage() {
  const params = useParams();
  const id = params?.id;
  const [encounter, setEncounter] = useState<any>(null);
  const [showRawData, setShowRawData] = useState(false);
  const [visibleFields, setVisibleFields] = useState<string[]>(encounterFields);
  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);

  useEffect(() => {
    const fetchEncounterData = async () => {
      if (id && typeof id === 'string') {
        const encounters = getEncounters();
        const foundEncounter = encounters.find(e => e.id === id);
        
        if (foundEncounter) {
          // Fetch all referenced resources
          const updatedEncounter = await fetchReferencedResources(foundEncounter);
          setEncounter(updatedEncounter);
        }
      }
      setPractitioners(getPractitioners());
      setPatients(getPatients());
      setOrganizations(getOrganizations());
    };

    fetchEncounterData();
  }, [id]);

  const fetchReferencedResources = async (encounter: any) => {
    const updatedEncounter = { ...encounter };

    // Fetch subject (patient) data
    if (encounter.subject?.reference) {
      const patientId = encounter.subject.reference.split('/').pop();
      const patientData = await fetchResourceData('Patient', patientId);
      updatedEncounter.subject.resource = patientData;
    }

    // Fetch participant (practitioner) data
    if (encounter.participant) {
      for (let i = 0; i < encounter.participant.length; i++) {
        if (encounter.participant[i].individual?.reference) {
          const practitionerId = encounter.participant[i].individual.reference.split('/').pop();
          const practitionerData = await fetchResourceData('Practitioner', practitionerId);
          updatedEncounter.participant[i].individual.resource = practitionerData;
        }
      }
    }

    // Fetch serviceProvider (organization) data
    if (encounter.serviceProvider?.reference) {
      const organizationId = encounter.serviceProvider.reference.split('/').pop();
      const organizationData = await fetchResourceData('Organization', organizationId);
      updatedEncounter.serviceProvider.resource = organizationData;
    }

    return updatedEncounter;
  };

  const fetchResourceData = async (resourceType: string, id: string) => {
    // In a real application, you would make an API call here
    // For this example, we'll fetch from our local data store
    switch (resourceType) {
      case 'Patient':
        return getPatients().find(p => p.id === id);
      case 'Practitioner':
        return getPractitioners().find(p => p.id === id);
      case 'Organization':
        return getOrganizations().find(o => o.id === id);
      default:
        return null;
    }
  };

  if (!encounter) {
    return <div>Loading...</div>;
  }

  const toggleField = (field: string) => {
    setVisibleFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const renderField = (field: string) => {
    if (!visibleFields.includes(field)) return null;
    
    switch (field) {
      case 'id':
        return <p><strong>ID:</strong> {encounter.id}</p>;
      case 'status':
        return <p><strong>Status:</strong> {encounter.status}</p>;
      case 'class':
        return <p><strong>Class:</strong> {encounter.class?.code || 'N/A'}</p>;
      case 'type':
        return <p><strong>Type:</strong> {encounter.type?.[0]?.coding?.[0]?.display || 'N/A'}</p>;
      case 'subject':
        if (!encounter.subject?.reference) return <p><strong>Subject:</strong> N/A</p>;
        const patient = encounter.subject.resource;
        return (
          <p>
            <strong>Subject:</strong>{' '}
            <HoverCard>
              <HoverCardTrigger asChild>
                <Link href={`/tool/patients/${patient?.id}`} className="text-blue-500 hover:underline">
                  {patient ? `${patient.name[0].given.join(' ')} ${patient.name[0].family}` : 'Unknown Patient'} ({encounter.subject.reference})
                </Link>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">{patient?.name[0]?.given.join(' ')} {patient?.name[0]?.family}</h4>
                  <p className="text-sm">Gender: {patient?.gender}</p>
                  <p className="text-sm">Birth Date: {patient?.birthDate}</p>
                </div>
              </HoverCardContent>
            </HoverCard>
          </p>
        );
      case 'participant':
        return (
          <div>
            <strong>Participants:</strong>
            {encounter.participant?.map((p: any, index: number) => {
              const reference = p.individual?.reference;
              if (!reference) return <p key={index}>N/A</p>;

              const [resourceType, id] = reference.split('/');
              if (resourceType === 'Practitioner') {
                const practitioner = p.individual.resource;
                return (
                  <p key={index}>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Link href={`/tool/practitioners/${id}`} className="text-blue-500 hover:underline">
                          {practitioner ? `Dr. ${practitioner.name[0].given.join(' ')} ${practitioner.name[0].family}` : 'Unknown Practitioner'} ({reference})
                        </Link>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold">Dr. {practitioner?.name[0]?.given.join(' ')} {practitioner?.name[0]?.family}</h4>
                          <p className="text-sm">Gender: {practitioner?.gender}</p>
                          <p className="text-sm">Qualification: {practitioner?.qualification?.[0]?.code?.coding?.[0]?.display || 'N/A'}</p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </p>
                );
              } else {
                return (
                  <p key={index}>
                    <Link href={`/tool/${resourceType.toLowerCase()}s/${id}`} className="text-blue-500 hover:underline">
                      {reference}
                    </Link>
                  </p>
                );
              }
            })}
          </div>
        );
      case 'period':
        return (
          <div>
            <p><strong>Start:</strong> {encounter.period?.start || 'N/A'}</p>
            <p><strong>End:</strong> {encounter.period?.end || 'N/A'}</p>
          </div>
        );
      case 'reasonCode':
        return <p><strong>Reason:</strong> {encounter.reasonCode?.[0]?.coding?.[0]?.display || 'N/A'}</p>;
      case 'diagnosis':
        return (
          <div>
            <strong>Diagnoses:</strong>
            {encounter.diagnosis?.map((d: any, index: number) => (
              <p key={index}>{d.condition?.reference || 'N/A'}</p>
            ))}
          </div>
        );
      case 'location':
        return (
          <div>
            <strong>Locations:</strong>
            {encounter.location?.map((l: any, index: number) => (
              <p key={index}>{l.location?.reference || 'N/A'}</p>
            ))}
          </div>
        );
      case 'serviceProvider':
        if (!encounter.serviceProvider?.reference) return <p><strong>Service Provider:</strong> N/A</p>;
        const organization = encounter.serviceProvider.resource;
        return (
          <p>
            <strong>Service Provider:</strong>{' '}
            <HoverCard>
              <HoverCardTrigger asChild>
                <Link href={`/tool/organisations/${organization?.id}`} className="text-blue-500 hover:underline">
                  {organization?.name || 'Unknown Organization'} ({encounter.serviceProvider.reference})
                </Link>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">{organization?.name}</h4>
                  <p className="text-sm">Type: {organization?.type?.[0]?.coding?.[0]?.display || 'N/A'}</p>
                  <p className="text-sm">Address: {organization?.address?.[0]?.text || 'N/A'}</p>
                </div>
              </HoverCardContent>
            </HoverCard>
          </p>
        );
      default:
        return <p><strong>{field}:</strong> {JSON.stringify(encounter[field])}</p>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Encounter Details</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Visible Fields</SheetTitle>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              {encounterFields.map((field) => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox
                    id={field}
                    checked={visibleFields.includes(field)}
                    onCheckedChange={() => toggleField(field)}
                  />
                  <label htmlFor={field} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {field}
                  </label>
                </div>
              ))}
            </div>
            <SheetFooter>
              <a 
                href="https://www.hl7.org/fhir/encounter.html" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline"
              >
                View FHIR Encounter Specification
              </a>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Encounter {encounter.id}</CardTitle>
        </CardHeader>
        <CardContent>
          {!showRawData ? (
            <>
              {encounterFields.map(field => renderField(field))}
            </>
          ) : (
            <pre className="text-sm overflow-auto max-h-96">
              {JSON.stringify(encounter, null, 2)}
            </pre>
          )}
          <div className="flex space-x-2 mt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>View Raw FHIR Data</Button>
              </DialogTrigger>
              <DialogContent className="max-w-[800px] w-full">
                <DialogHeader>
                  <DialogTitle>Raw FHIR Encounter Data</DialogTitle>
                </DialogHeader>
                <pre className="text-sm overflow-auto max-h-[60vh]">
                  {JSON.stringify(encounter, null, 2)}
                </pre>
              </DialogContent>
            </Dialog>
            <Button 
              variant="outline" 
              onClick={() => setShowRawData(!showRawData)}
            >
              {showRawData ? "Show Formatted Data" : "Show Raw Data"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

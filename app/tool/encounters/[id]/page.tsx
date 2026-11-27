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
import ResourceNotFound from '@/components/ResourceNotFound';
import PeriodDisplay from '@/components/PeriodDisplay';
import FhirValue from '@/components/FhirValue';
import { conceptText, humanName, parseReference } from '@/lib/fhir';

// Define the FHIR Encounter fields
const encounterFields = [
  'id', 'status', 'class', 'type', 'subject', 'participant', 'period',
  'reasonCode', 'diagnosis', 'location', 'serviceProvider'
];

export default function EncounterDetailsPage() {
  const params = useParams();
  const id = params?.id;
  const [encounter, setEncounter] = useState<any>(undefined);
  const [showRawData, setShowRawData] = useState(false);
  const [visibleFields, setVisibleFields] = useState<string[]>(encounterFields);
  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);

  // Referenced resources are looked up at render time; the stored Encounter is never modified.
  useEffect(() => {
    if (id && typeof id === 'string') {
      setEncounter(getEncounters().find(e => e.id === id) || null);
    }
    setPractitioners(getPractitioners());
    setPatients(getPatients());
    setOrganizations(getOrganizations());
  }, [id]);

  if (encounter === undefined) {
    return <div>Loading...</div>;
  }
  if (!encounter) {
    return <ResourceNotFound resourceType="Encounter" id={id} listHref="/tool/encounters" />;
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
        return <p><strong>Class:</strong> {encounter.class?.display ? `${encounter.class.display} (${encounter.class.code})` : encounter.class?.code || 'N/A'}</p>;
      case 'type':
        return <p><strong>Type:</strong> {encounter.type?.[0]?.coding?.[0]?.display || 'N/A'}</p>;
      case 'subject':
        if (!encounter.subject?.reference) return <p><strong>Subject:</strong> N/A</p>;
        const subjectId = parseReference(encounter.subject.reference)?.id;
        const patient = patients.find(p => p.id === subjectId);
        return (
          <p>
            <strong>Subject:</strong>{' '}
            <HoverCard>
              <HoverCardTrigger asChild>
                <Link href={`/tool/patients/${subjectId}`} className="text-blue-500 hover:underline">
                  {humanName(patient, 'Unknown Patient')} ({encounter.subject.reference})
                </Link>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">{humanName(patient, 'Unknown Patient')}</h4>
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
                const practitioner = practitioners.find(each => each.id === id);
                return (
                  <p key={index}>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Link href={`/tool/practitioners/${id}`} className="text-blue-500 hover:underline">
                          {humanName(practitioner, 'Unknown Practitioner')} ({reference})
                        </Link>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold">{humanName(practitioner, 'Unknown Practitioner')}</h4>
                          <p className="text-sm">Gender: {practitioner?.gender}</p>
                          <p className="text-sm">Qualification: {practitioner?.qualification?.[0]?.code?.coding?.[0]?.display || 'N/A'}</p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </p>
                );
              } else {
                return <p key={index}><FhirValue value={p.individual} fieldName="Participant" /></p>;
              }
            })}
          </div>
        );
      case 'period':
        return (
          <div>
            <strong>Period:</strong>
            <PeriodDisplay start={encounter.period?.start} end={encounter.period?.end} />
          </div>
        );
      case 'reasonCode':
        return <p><strong>Reason:</strong> {conceptText(encounter.reasonCode?.[0]) || 'N/A'}</p>;
      case 'diagnosis':
        return (
          <div>
            <strong>Diagnoses:</strong>
            {encounter.diagnosis?.map((d: any, index: number) => (
              <p key={index}>
                <FhirValue value={d.condition} fieldName="Diagnosis" />
                {d.use && ` (${conceptText(d.use)})`}
              </p>
            ))}
          </div>
        );
      case 'location':
        return (
          <div>
            <strong>Locations:</strong>
            {encounter.location?.map((l: any, index: number) => (
              <p key={index}><FhirValue value={l.location} fieldName="Location" /></p>
            ))}
          </div>
        );
      case 'serviceProvider':
        if (!encounter.serviceProvider?.reference) return <p><strong>Service Provider:</strong> N/A</p>;
        const providerId = parseReference(encounter.serviceProvider.reference)?.id;
        const organization = organizations.find(o => o.id === providerId);
        return (
          <p>
            <strong>Service Provider:</strong>{' '}
            <HoverCard>
              <HoverCardTrigger asChild>
                <Link href={`/tool/organisations/${providerId}`} className="text-blue-500 hover:underline">
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

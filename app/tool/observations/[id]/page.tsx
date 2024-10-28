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
import { getObservations, getPatients, getEncounters } from '@/utils/data-store';
import { Settings } from 'lucide-react';
import HtmlModal from '@/components/HtmlModal';
import StructuredDataModal from '@/components/StructuredDataModal';
import PeriodDisplay from '@/components/PeriodDisplay';

// Define the FHIR Observation fields
const observationFields = [
  'id', 'status', 'category', 'code', 'subject', 'encounter', 'effectiveDateTime',
  'issued', 'valueQuantity', 'valueCodeableConcept', 'valueString', 'valueBoolean',
  'valueInteger', 'valueRange', 'valueRatio', 'valueSampledData', 'valueTime',
  'valueDateTime', 'valuePeriod', 'dataAbsentReason', 'interpretation', 'note',
  'bodySite', 'method', 'specimen', 'device', 'referenceRange', 'hasMember',
  'derivedFrom', 'component'
];

const renderCoding = (coding: any) => (
  <div className="ml-4 mt-1 p-2 bg-gray-100 rounded">
    <p><strong>System:</strong> {coding.system}</p>
    <p><strong>Code:</strong> {coding.code}</p>
    <p><strong>Display:</strong> {coding.display}</p>
  </div>
);

export default function ObservationDetailsPage() {
  const params = useParams();
  const id = params?.id;
  const [observation, setObservation] = useState<any>(null);
  const [showRawData, setShowRawData] = useState(false);
  const [visibleFields, setVisibleFields] = useState<string[]>(observationFields);
  const [patients, setPatients] = useState<any[]>([]);
  const [encounters, setEncounters] = useState<any[]>([]);

  useEffect(() => {
    if (id && typeof id === 'string') {
      const observations = getObservations();
      const foundObservation = observations.find(o => o.id === id);
      setObservation(foundObservation || null);
    }
    setPatients(getPatients());
    setEncounters(getEncounters());
  }, [id]);

  if (!observation) {
    return <div>Loading...</div>;
  }

  const toggleField = (field: string) => {
    setVisibleFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const renderCodeableConcept = (concept: any, fieldName: string) => {
    if (!concept) return null;

    return (
      <div className="ml-4 mt-2 p-3 border rounded-md bg-gray-50">
        <h4 className="font-semibold">{fieldName}</h4>
        {concept.coding && concept.coding.map((coding: any, index: number) => (
          <div key={index} className="ml-4 mt-1">
            <p><strong>System:</strong> {coding.system}</p>
            <p><strong>Code:</strong> {coding.code}</p>
            <p><strong>Display:</strong> {coding.display}</p>
          </div>
        ))}
        {concept.text && <p><strong>Text:</strong> {concept.text}</p>}
      </div>
    );
  };

  const renderField = (field: string) => {
    if (!visibleFields.includes(field)) return null;
    
    const value = observation[field];
    
    if (value === undefined || value === null) return null;
    
    switch (field) {
      case 'id':
        return <p><strong>ID:</strong> {value}</p>;
      case 'status':
        return <p><strong>Status:</strong> {value}</p>;
      case 'category':
        return (
          <div>
            <strong>Category:</strong>
            {Array.isArray(value) ? (
              value.map((cat, index) => renderCodeableConcept(cat, `Category ${index + 1}`))
            ) : (
              renderCodeableConcept(value, "Category")
            )}
          </div>
        );
      case 'code':
        return (
          <div>
            <strong>Code:</strong>
            {renderCodeableConcept(value, "Code")}
          </div>
        );
      case 'subject':
        if (!value.reference) return <p><strong>Subject:</strong> N/A</p>;
        const [subjectType, subjectId] = value.reference.split('/');
        const patient = patients.find(p => p.id === subjectId);
        return (
          <p>
            <strong>Subject:</strong>{' '}
            <HoverCard>
              <HoverCardTrigger asChild>
                <Link href={`/tool/patients/${subjectId}`} className="text-blue-500 hover:underline">
                  {patient && patient.name && patient.name[0] 
                    ? `${patient.name[0].given?.join(' ') || ''} ${patient.name[0].family || ''}`.trim() || 'Unnamed Patient'
                    : 'Unknown Patient'} ({value.reference})
                </Link>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">
                    {patient && patient.name && patient.name[0] 
                      ? `${patient.name[0].given?.join(' ') || ''} ${patient.name[0].family || ''}`.trim() || 'Unnamed Patient'
                      : 'Unknown Patient'}
                  </h4>
                  <p className="text-sm">Gender: {patient?.gender || 'N/A'}</p>
                  <p className="text-sm">Birth Date: {patient?.birthDate || 'N/A'}</p>
                </div>
              </HoverCardContent>
            </HoverCard>
          </p>
        );
      case 'encounter':
        if (!value.reference) return <p><strong>Encounter:</strong> N/A</p>;
        const [encounterType, encounterId] = value.reference.split('/');
        const encounter = encounters.find(e => e.id === encounterId);
        return (
          <p>
            <strong>Encounter:</strong>{' '}
            <HoverCard>
              <HoverCardTrigger asChild>
                <Link href={`/tool/encounters/${encounterId}`} className="text-blue-500 hover:underline">
                  {value.reference}
                </Link>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Encounter {encounter?.id}</h4>
                  <p className="text-sm">Status: {encounter?.status}</p>
                  <p className="text-sm">Class: {encounter?.class?.code}</p>
                </div>
              </HoverCardContent>
            </HoverCard>
          </p>
        );
      case 'effectiveDateTime':
        return <p><strong>Effective Date:</strong> {value}</p>;
      case 'issued':
        return <p><strong>Issued:</strong> {value}</p>;
      case 'valueQuantity':
        return (
          <div>
            <strong>Value Quantity:</strong>
            <p className="ml-4">Value: {value.value}</p>
            <p className="ml-4">Unit: {value.unit}</p>
            <p className="ml-4">System: {value.system}</p>
            <p className="ml-4">Code: {value.code}</p>
          </div>
        );
      case 'interpretation':
        return (
          <div>
            <strong>Interpretation:</strong>
            {Array.isArray(value) ? (
              value.map((interp, index) => renderCodeableConcept(interp, `Interpretation ${index + 1}`))
            ) : (
              renderCodeableConcept(value, "Interpretation")
            )}
          </div>
        );
      case 'note':
        return (
          <div>
            <strong>Note:</strong>
            {value.map((note: any, index: number) => (
              <p key={index} className="ml-4">{note.text}</p>
            ))}
          </div>
        );
      case 'referenceRange':
        return (
          <div>
            <strong>Reference Range:</strong>
            {value.map((range: any, index: number) => (
              <div key={index} className="ml-4 mt-2">
                <p>Low: {range.low?.value} {range.low?.unit}</p>
                <p>High: {range.high?.value} {range.high?.unit}</p>
                <p>Type: {range.type?.text}</p>
              </div>
            ))}
          </div>
        );
      case 'component':
        return (
          <div>
            <strong>Components:</strong>
            {value.map((component: any, index: number) => (
              <div key={index} className="ml-4 mt-2 p-2 border rounded">
                <h4 className="font-semibold">Component {index + 1}</h4>
                {component.code && (
                  <div>
                    <strong>Code:</strong>
                    {component.code.coding && component.code.coding.map((coding: any, codingIndex: number) => (
                      <div key={codingIndex}>
                        {renderCoding(coding)}
                      </div>
                    ))}
                    {component.code.text && <p><strong>Text:</strong> {component.code.text}</p>}
                  </div>
                )}
                {component.valueQuantity && (
                  <div className="mt-2">
                    <strong>Value Quantity:</strong>
                    <p className="ml-4">Value: {component.valueQuantity.value}</p>
                    <p className="ml-4">Unit: {component.valueQuantity.unit}</p>
                    <p className="ml-4">System: {component.valueQuantity.system}</p>
                    <p className="ml-4">Code: {component.valueQuantity.code}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      case 'valuePeriod':
        return (
          <div>
            <strong>Value Period:</strong>
            <PeriodDisplay start={value.start} end={value.end} />
          </div>
        );
      default:
        if (typeof value === 'string') {
          if (value.trim().startsWith('<')) {
            return (
              <div>
                <strong>{field}:</strong> 
                <HtmlModal htmlContent={value} fieldName={field} />
              </div>
            );
          }
        } else if (typeof value === 'object' && value !== null) {
          return (
            <div>
              <strong>{field}:</strong> 
              <StructuredDataModal content={value} fieldName={field} />
            </div>
          );
        }
        return <p><strong>{field}:</strong> {JSON.stringify(value)}</p>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Observation Details</h1>
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
              {observationFields.map((field) => (
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
          </SheetContent>
        </Sheet>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{observation.code?.coding?.[0]?.display || 'Observation'}</CardTitle>
        </CardHeader>
        <CardContent>
          {!showRawData ? (
            <>
              {observationFields.map(field => renderField(field))}
            </>
          ) : (
            <pre className="text-sm overflow-auto max-h-96">
              {JSON.stringify(observation, null, 2)}
            </pre>
          )}
          <div className="flex space-x-2 mt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>View Raw FHIR Data</Button>
              </DialogTrigger>
              <DialogContent className="max-w-[800px] w-full">
                <DialogHeader>
                  <DialogTitle>Raw FHIR Observation Data</DialogTitle>
                </DialogHeader>
                <pre className="text-sm overflow-auto max-h-[60vh]">
                  {JSON.stringify(observation, null, 2)}
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

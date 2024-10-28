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
import { getConditions, getPatients, getEncounters } from '@/utils/data-store';
import { Settings } from 'lucide-react';

// Define the FHIR Condition fields
const conditionFields = [
  'id', 'clinicalStatus', 'verificationStatus', 'category', 'severity',
  'code', 'bodySite', 'subject', 'encounter', 'onsetDateTime', 'abatementDateTime',
  'recordedDate', 'recorder', 'asserter', 'stage', 'evidence', 'note'
];

export default function ConditionDetailsPage() {
  const params = useParams();
  const id = params?.id;
  const [condition, setCondition] = useState<any>(null);
  const [showRawData, setShowRawData] = useState(false);
  const [visibleFields, setVisibleFields] = useState<string[]>(conditionFields);
  const [patients, setPatients] = useState<any[]>([]);
  const [encounters, setEncounters] = useState<any[]>([]);

  useEffect(() => {
    if (id && typeof id === 'string') {
      const conditions = getConditions();
      const foundCondition = conditions.find(c => c.id === id);
      setCondition(foundCondition || null);
    }
    setPatients(getPatients());
    setEncounters(getEncounters());
  }, [id]);

  if (!condition) {
    return <div>Loading...</div>;
  }

  const toggleField = (field: string) => {
    setVisibleFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  const renderField = (field: string) => {
    if (!visibleFields.includes(field)) return null;
    
    switch (field) {
      case 'id':
        return <p><strong>ID:</strong> {condition.id}</p>;
      case 'clinicalStatus':
        return <p><strong>Clinical Status:</strong> {condition.clinicalStatus?.coding?.[0]?.code || 'N/A'}</p>;
      case 'verificationStatus':
        return <p><strong>Verification Status:</strong> {condition.verificationStatus?.coding?.[0]?.code || 'N/A'}</p>;
      case 'category':
        return <p><strong>Category:</strong> {condition.category?.[0]?.coding?.[0]?.display || 'N/A'}</p>;
      case 'severity':
        return <p><strong>Severity:</strong> {condition.severity?.coding?.[0]?.display || 'N/A'}</p>;
      case 'code':
        return <p><strong>Code:</strong> {condition.code?.coding?.[0]?.display || 'N/A'}</p>;
      case 'bodySite':
        return <p><strong>Body Site:</strong> {condition.bodySite?.[0]?.coding?.[0]?.display || 'N/A'}</p>;
      case 'subject':
        if (!condition.subject?.reference) return <p><strong>Subject:</strong> N/A</p>;
        const [subjectType, patientId] = condition.subject.reference.split('/');
        const patient = patients.find(p => p.id === patientId);
        return (
          <p>
            <strong>Subject:</strong>{' '}
            <HoverCard>
              <HoverCardTrigger asChild>
                <Link href={`/tool/patients/${patientId}`} className="text-blue-500 hover:underline">
                  {patient ? `${patient.name[0].given.join(' ')} ${patient.name[0].family}` : 'Unknown Patient'} ({condition.subject.reference})
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
      case 'encounter':
        if (!condition.encounter?.reference) return <p><strong>Encounter:</strong> N/A</p>;
        const [encounterType, encounterId] = condition.encounter.reference.split('/');
        const encounter = encounters.find(e => e.id === encounterId);
        return (
          <p>
            <strong>Encounter:</strong>{' '}
            <HoverCard>
              <HoverCardTrigger asChild>
                <Link href={`/tool/encounters/${encounterId}`} className="text-blue-500 hover:underline">
                  {condition.encounter.reference}
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
      case 'onsetDateTime':
        return <p><strong>Onset Date:</strong> {formatDate(condition.onsetDateTime)}</p>;
      case 'abatementDateTime':
        return <p><strong>Abatement Date:</strong> {formatDate(condition.abatementDateTime)}</p>;
      case 'recordedDate':
        return <p><strong>Recorded Date:</strong> {formatDate(condition.recordedDate)}</p>;
      case 'recorder':
        return <p><strong>Recorder:</strong> {condition.recorder?.reference || 'N/A'}</p>;
      case 'asserter':
        return <p><strong>Asserter:</strong> {condition.asserter?.reference || 'N/A'}</p>;
      case 'stage':
        return (
          <div>
            <p><strong>Stage:</strong></p>
            <p>Summary: {condition.stage?.summary?.coding?.[0]?.display || 'N/A'}</p>
            <p>Assessment: {condition.stage?.assessment?.[0]?.reference || 'N/A'}</p>
          </div>
        );
      case 'evidence':
        return (
          <div>
            <p><strong>Evidence:</strong></p>
            {condition.evidence?.map((e: any, index: number) => (
              <p key={index}>{e.code?.[0]?.coding?.[0]?.display || e.detail?.[0]?.reference || 'N/A'}</p>
            ))}
          </div>
        );
      case 'note':
        return <p><strong>Note:</strong> {condition.note?.[0]?.text || 'N/A'}</p>;
      default:
        return <p><strong>{field}:</strong> {JSON.stringify(condition[field])}</p>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Condition Details</h1>
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
              {conditionFields.map((field) => (
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
                href="https://www.hl7.org/fhir/condition.html" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline"
              >
                View FHIR Condition Specification
              </a>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{condition.code?.coding?.[0]?.display || 'Condition'}</CardTitle>
        </CardHeader>
        <CardContent>
          {!showRawData ? (
            <>
              {conditionFields.map(field => renderField(field))}
            </>
          ) : (
            <pre className="text-sm overflow-auto max-h-96">
              {JSON.stringify(condition, null, 2)}
            </pre>
          )}
          <div className="flex space-x-2 mt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>View Raw FHIR Data</Button>
              </DialogTrigger>
              <DialogContent className="max-w-[800px] w-full">
                <DialogHeader>
                  <DialogTitle>Raw FHIR Condition Data</DialogTitle>
                </DialogHeader>
                <pre className="text-sm overflow-auto max-h-[60vh]">
                  {JSON.stringify(condition, null, 2)}
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

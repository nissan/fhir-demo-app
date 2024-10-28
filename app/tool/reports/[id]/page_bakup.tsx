'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { getReportById, getPatients, getEncounters, getPractitioners, getObservations } from '@/utils/data-store';
import { Settings } from 'lucide-react';
import MediaModal from "@/components/media-modal";

// Define the FHIR DiagnosticReport fields
const diagnosticReportFields = [
  'id', 'status', 'category', 'code', 'subject', 'encounter', 'effectiveDateTime',
  'issued', 'performer', 'resultsInterpreter', 'specimen', 'result', 'imagingStudy',
  'media', 'conclusion', 'conclusionCode', 'presentedForm'
];

export default function DiagnosticReportDetailsPage() {
  const params = useParams();
  const id = params?.id;
  const [report, setReport] = useState<any>(null);
  const [showRawData, setShowRawData] = useState(false);
  const [visibleFields, setVisibleFields] = useState<string[]>(diagnosticReportFields);
  const [patients, setPatients] = useState<any[]>([]);
  const [encounters, setEncounters] = useState<any[]>([]);
  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [observations, setObservations] = useState<any[]>([]);
  const [modalOpened, setModalOpened] = useState(false);

  useEffect(() => {
    if (id && typeof id === 'string') {
      const fetchedReport = getReportById(id);
      setReport(fetchedReport || null);
      setPatients(getPatients());
      setEncounters(getEncounters());
      setPractitioners(getPractitioners());
      setObservations(getObservations());
    }
  }, [id]);

  if (!report) {
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
        return <FieldRow label="ID" value={report.id} />;
      case 'status':
        return <FieldRow label="Status" value={report.status} />;
      case 'category':
        return <FieldRow label="Category" value={report.category?.[0]?.coding?.[0]?.display || 'N/A'} />;
      case 'code':
        return <FieldRow label="Code" value={report.code?.coding?.[0]?.display || 'N/A'} />;
      case 'subject':
        if (!report.subject?.reference) return <FieldRow label="Subject" value="N/A" />;
        const [subjectType, subjectId] = report.subject.reference.split('/');
        const patient = patients.find(p => p.id === subjectId);
        return (
          <FieldRow
            label="Subject"
            value={
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Link href={`/tool/patients/${subjectId}`} className="text-blue-500 hover:underline">
                    {patient ? `${patient.name[0].given.join(' ')} ${patient.name[0].family}` : 'Unknown Patient'} ({report.subject.reference})
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
            }
          />
        );
      case 'encounter':
        if (!report.encounter?.reference) return <FieldRow label="Encounter" value="N/A" />;
        const [encounterType, encounterId] = report.encounter.reference.split('/');
        const encounter = encounters.find(e => e.id === encounterId);
        return (
          <FieldRow
            label="Encounter"
            value={
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Link href={`/tool/encounters/${encounterId}`} className="text-blue-500 hover:underline">
                    {report.encounter.reference}
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
            }
          />
        );
      case 'effectiveDateTime':
        if (!report.effectiveDateTime) return <FieldRow label="Effective Date" value="N/A" />;
        const effectiveDate = new Date(report.effectiveDateTime);
        const formattedEffectiveDate = effectiveDate.toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short'
        });
        return <FieldRow label="Effective Date" value={formattedEffectiveDate} />;
      case 'issued':
        if (!report.issued) return <FieldRow label="Issued" value="N/A" />;
        const issuedDate = new Date(report.issued);
        const formattedIssuedDate = issuedDate.toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short'
        });
        return <FieldRow label="Issued" value={formattedIssuedDate} />;
      case 'performer':
        return (
          <FieldRow
            label="Performer"
            value={
              <div className="space-y-2">
                {report.performer?.map((p: any, index: number) => {
                  const [performerType, performerId] = p.reference.split('/');
                  const practitioner = practitioners.find(pract => pract.id === performerId);
                  return (
                    <HoverCard key={index}>
                      <HoverCardTrigger asChild>
                        <Link href={`/tool/practitioners/${performerId}`} className="text-blue-500 hover:underline block">
                          {practitioner ? `Dr. ${practitioner.name[0].given.join(' ')} ${practitioner.name[0].family}` : 'Unknown Practitioner'} ({p.reference})
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
                  );
                })}
              </div>
            }
          />
        );
      case 'result':
        return (
          <FieldRow
            label="Results"
            value={
              report.result && report.result.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2">
                  {report.result.map((r: any, index: number) => {
                    const [observationType, observationId] = r.reference.split('/');
                    const observation = observations.find(obs => obs.id === observationId);
                    return (
                      <li key={index} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <Link href={`/tool/observations/${observationId}`} className="text-blue-500 hover:underline font-semibold">
                              {observation?.code?.coding?.[0]?.display || 'Observation'} (ID: {observationId})
                            </Link>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80">
                            <div className="space-y-1">
                              <h4 className="text-sm font-semibold">{observation?.code?.coding?.[0]?.display || 'Observation'}</h4>
                              <p className="text-sm">Status: {observation?.status}</p>
                              <p className="text-sm">Value: {observation?.valueQuantity?.value} {observation?.valueQuantity?.unit}</p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                        <p className="text-sm mt-1">
                          Value: {observation?.valueQuantity?.value} {observation?.valueQuantity?.unit}
                        </p>
                        {observation?.interpretation && observation.interpretation[0]?.coding?.[0]?.display && (
                          <p className="text-sm mt-1">
                            Interpretation: {observation.interpretation[0].coding[0].display}
                          </p>
                        )}
                        {observation?.referenceRange && observation.referenceRange[0] && (
                          <p className="text-sm mt-1">
                            Reference Range: {observation.referenceRange[0].low?.value} - {observation.referenceRange[0].high?.value} {observation.referenceRange[0].low?.unit}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>No results available</p>
              )
            }
          />
        );
      case 'conclusion':
        return <FieldRow label="Conclusion" value={report.conclusion || 'N/A'} />;
      case 'presentedForm':
        if (report.presentedForm?.[0]) {
          return (
            <div className='flex'>
              <p className='pr-4'><strong>PDFs:</strong></p>
              <Button onClick={() => setModalOpened(true)} size="sm" className='bg-blue-500 hover:bg-blue-400'>
                Click to View
              </Button>
              <MediaModal openModal={modalOpened} closeModal={() => setModalOpened(false)} contentType={report.presentedForm?.[0]?.contentType} base64Data={report.presentedForm?.[0]?.data} />
            </div>
          );
        }else{
          return <p className='pr-4'><strong>PDFs:</strong> No presented form available</p>;
        }
        default:
        return <FieldRow label={field} value={JSON.stringify(report[field])} />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Diagnostic Report Details</h1>
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
              {diagnosticReportFields.map((field) => (
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
                href="https://www.hl7.org/fhir/diagnosticreport.html" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline"
              >
                View FHIR Diagnostic Report Specification
              </a>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Diagnostic Report {report.id}</CardTitle>
        </CardHeader>
        <CardContent>
          {!showRawData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {diagnosticReportFields.map(field => renderField(field))}
            </div>
          ) : (
            <pre className="text-sm overflow-auto max-h-96">
              {JSON.stringify(report, null, 2)}
            </pre>
          )}
          <div className="flex space-x-2 mt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>View Raw FHIR Data</Button>
              </DialogTrigger>
              <DialogContent className="max-w-[800px] w-full">
                <DialogHeader>
                  <DialogTitle>Raw FHIR Diagnostic Report Data</DialogTitle>
                </DialogHeader>
                <pre className="text-sm overflow-auto max-h-[60vh]">
                  {JSON.stringify(report, null, 2)}
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

// Helper component for rendering field rows
const FieldRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="py-2">
    <dt className="font-semibold text-gray-600 dark:text-gray-300">{label}</dt>
    <dd className="mt-1">{value}</dd>
  </div>
);
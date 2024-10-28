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
import { getReportById, getPatients, getEncounters, getPractitioners, getObservations, getOrganizations, getCareTeams } from '@/utils/data-store';
import { Settings } from 'lucide-react';
import MediaViewer from "@/components/media-viewer";
import HtmlModal from '@/components/HtmlModal';
import XmlModal from '@/components/XmlModal';
import StructuredDataModal from '@/components/StructuredDataModal';

// Define the FHIR DiagnosticReport fields
const diagnosticReportFields = [
  'id', 'status', 'category', 'code', 'subject', 'encounter', 'effectiveDateTime',
  'issued', 'performer', 'resultsInterpreter', 'specimen', 'result', 'imagingStudy',
  'media', 'conclusion', 'conclusionCode', 'presentedForm'
];

const formatDateTime = (dateTimeString: string) => {
  const date = new Date(dateTimeString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
};

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
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [careTeams, setCareTeams] = useState<any[]>([]);

  useEffect(() => {
    if (id && typeof id === 'string') {
      const fetchedReport = getReportById(id);
      setReport(fetchedReport || null);
      setPatients(getPatients());
      setEncounters(getEncounters());
      setPractitioners(getPractitioners());
      setObservations(getObservations());
      setOrganizations(getOrganizations());
      setCareTeams(getCareTeams());
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

  const renderPerformer = (performer: any) => {
    if (!performer.reference) return null;

    const [resourceType, id] = performer.reference.split('/');
    let displayName = 'Unknown';
    let hoverContent = null;
    let resourceData = null;

    switch (resourceType) {
      case 'Practitioner':
        resourceData = practitioners.find(p => p.id === id);
        displayName = resourceData ? `Dr. ${resourceData.name[0].given.join(' ')} ${resourceData.name[0].family}` : 'Unknown Practitioner';
        hoverContent = (
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{displayName}</h4>
            <p className="text-sm">Gender: {resourceData?.gender}</p>
            <p className="text-sm">Qualification: {resourceData?.qualification?.[0]?.code?.coding?.[0]?.display || 'N/A'}</p>
          </div>
        );
        break;
      case 'Organization':
        resourceData = organizations.find(o => o.id === id);
        displayName = resourceData?.name || 'Unknown Organization';
        hoverContent = (
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{displayName}</h4>
            <p className="text-sm">Type: {resourceData?.type?.[0]?.coding?.[0]?.display || 'N/A'}</p>
            <p className="text-sm">Address: {resourceData?.address?.[0]?.text || 'N/A'}</p>
          </div>
        );
        break;
      case 'CareTeam':
        resourceData = careTeams.find(ct => ct.id === id);
        displayName = resourceData?.name || 'Unknown Care Team';
        hoverContent = (
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{displayName}</h4>
            <p className="text-sm">Status: {resourceData?.status}</p>
            <p className="text-sm">Category: {resourceData?.category?.[0]?.coding?.[0]?.display || 'N/A'}</p>
          </div>
        );
        break;
      default:
        displayName = performer.reference;
    }

    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <Link href={`/tool/${resourceType.toLowerCase()}s/${id}`} className="text-blue-500 hover:underline">
            {displayName} ({performer.reference})
          </Link>
        </HoverCardTrigger>
        {hoverContent && (
          <HoverCardContent className="w-80">
            {hoverContent}
          </HoverCardContent>
        )}
      </HoverCard>
    );
  };

  const renderField = (field: string) => {
    if (!visibleFields.includes(field)) return null;
    
    const value = report[field];
    
    if (value === undefined || value === null) return null;
    
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
          <div>
            <strong>Performer:</strong>
            {Array.isArray(value) ? (
              value.map((performer, index) => (
                <div key={index} className="ml-4 mt-2">
                  {renderPerformer(performer)}
                </div>
              ))
            ) : (
              <div className="ml-4 mt-2">
                {renderPerformer(value)}
              </div>
            )}
          </div>
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
        if (report.presentedForm){
          return (
            <div>
              <p className='pr-4'><strong>Presented Form</strong></p>
              <ul className="list-disc pl-5 space-y-2">
                {report.presentedForm.map((pdf: any, index: number) => (
                  <li key={index} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
                    <p className="text-sm mt-1 pb-2">{pdf.title}</p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className='bg-blue-500 hover:bg-blue-400'>Click to View</Button>
                      </DialogTrigger>
                      {/* <DialogContent className="max-w-[650px] w-full max-h-[650px]"> */}
                      <DialogContent className="max-w-[75vw] w-full max-h-[650px] flex flex-col items-center">
                        <DialogHeader>
                          <DialogTitle>{pdf.title}</DialogTitle>
                        </DialogHeader>
                        <MediaViewer contentType={pdf.contentType} base64Data={pdf.data}/>
                      </DialogContent>
                    </Dialog>
                  </li>
                ))}
              </ul>
            </div>
          );
        }else {
          return <p className='pr-4'><strong>Presented Form</strong> No presented form available</p>;
        }
      case 'effectivePeriod':
        if (typeof value === 'object' && value !== null) {
          const { id, start, end } = value;
          if (start && end) {
            return (
              <div>
                <strong>Effective Period:</strong>
                <p>ID: {id || 'N/A'}</p>
                <p>Start: {formatDateTime(start)}</p>
                <p>End: {formatDateTime(end)}</p>
              </div>
            );
          }
        }
        // If it's not in the expected format, fall through to default handling
        return (
          <div>
            <strong>Effective Period:</strong> 
            <XmlModal xmlContent={JSON.stringify(value)} fieldName="Effective Period" />
          </div>
        );
      default:
        if (typeof value === 'string') {
          if (value.trim().startsWith('<')) {
            if (value.trim().startsWith('<?xml')) {
              return (
                <div>
                  <strong>{field}:</strong> 
                  <XmlModal xmlContent={value} fieldName={field} />
                </div>
              );
            } else {
              return (
                <div>
                  <strong>{field}:</strong> 
                  <HtmlModal htmlContent={value} fieldName={field} />
                </div>
              );
            }
          }
        } else if (typeof value === 'object' && value !== null) {
          // Handle JSON objects
          const jsonString = JSON.stringify(value, null, 2);
          return (
            <div>
              <strong>{field}:</strong> 
              <pre>{jsonString}</pre>
            </div>
          );
        }
        return <p><strong>{field}:</strong> {JSON.stringify(value)}</p>;
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

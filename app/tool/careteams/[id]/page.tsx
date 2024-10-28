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
import { getCareTeams, getPatients, getPractitioners } from '@/utils/data-store';
import { Settings } from 'lucide-react';

// Define the FHIR CareTeam fields based on the specification
const careTeamFields = [
  'id', 'identifier', 'status', 'category', 'name', 'subject', 'encounter',
  'period', 'participant', 'reasonCode', 'reasonReference', 'managingOrganization',
  'telecom', 'note'
];

export default function CareTeamDetailsPage() {
  const params = useParams();
  const id = params?.id;
  const [careTeam, setCareTeam] = useState<any>(null);
  const [showRawData, setShowRawData] = useState(false);
  const [visibleFields, setVisibleFields] = useState<string[]>(careTeamFields);
  const [patients, setPatients] = useState<any[]>([]);
  const [practitioners, setPractitioners] = useState<any[]>([]);

  useEffect(() => {
    if (id && typeof id === 'string') {
      const careTeams = getCareTeams();
      const foundCareTeam = careTeams.find(ct => ct.id === id);
      setCareTeam(foundCareTeam || null);
    }
    setPatients(getPatients());
    setPractitioners(getPractitioners());
  }, [id]);

  if (!careTeam) {
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
        return <p><strong>ID:</strong> {careTeam.id}</p>;
      case 'status':
        return <p><strong>Status:</strong> {careTeam.status}</p>;
      case 'name':
        return <p><strong>Name:</strong> {careTeam.name}</p>;
      case 'subject':
        if (!careTeam.subject?.reference) return <p><strong>Subject:</strong> N/A</p>;
        const [subjectType, subjectId] = careTeam.subject.reference.split('/');
        const patient = patients.find(p => p.id === subjectId);
        return (
          <p>
            <strong>Subject:</strong>{' '}
            <HoverCard>
              <HoverCardTrigger asChild>
                <Link href={`/tool/patients/${subjectId}`} className="text-blue-500 hover:underline">
                  {patient ? `${patient.name[0].given.join(' ')} ${patient.name[0].family}` : 'Unknown Patient'} ({careTeam.subject.reference})
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
            {careTeam.participant?.map((p: any, index: number) => {
              const [memberType, memberId] = p.member.reference.split('/');
              const practitioner = practitioners.find(pract => pract.id === memberId);
              return (
                <p key={index}>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Link href={`/tool/practitioners/${memberId}`} className="text-blue-500 hover:underline">
                        {practitioner ? `Dr. ${practitioner.name[0].given.join(' ')} ${practitioner.name[0].family}` : 'Unknown Practitioner'} ({p.member.reference})
                      </Link>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold">Dr. {practitioner?.name[0]?.given.join(' ')} {practitioner?.name[0]?.family}</h4>
                        <p className="text-sm">Role: {p.role?.[0]?.coding?.[0]?.display || 'N/A'}</p>
                        <p className="text-sm">Qualification: {practitioner?.qualification?.[0]?.code?.coding?.[0]?.display || 'N/A'}</p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </p>
              );
            })}
          </div>
        );
      case 'period':
        return (
          <p>
            <strong>Period:</strong> {careTeam.period?.start || 'N/A'} - {careTeam.period?.end || 'N/A'}
          </p>
        );
      case 'managingOrganization':
        return <p><strong>Managing Organization:</strong> {careTeam.managingOrganization?.reference || 'N/A'}</p>;
      case 'telecom':
        return careTeam.telecom?.map((t: any, index: number) => (
          <p key={index}><strong>{t.system}:</strong> {t.value}</p>
        ));
      case 'note':
        return <p><strong>Note:</strong> {careTeam.note?.[0]?.text || 'N/A'}</p>;
      default:
        return <p><strong>{field}:</strong> {JSON.stringify(careTeam[field])}</p>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Care Team Details</h1>
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
              {careTeamFields.map((field) => (
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
                href="https://www.hl7.org/fhir/careteam.html" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline"
              >
                View FHIR Care Team Specification
              </a>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{careTeam.name || `Care Team ${careTeam.id}`}</CardTitle>
        </CardHeader>
        <CardContent>
          {!showRawData ? (
            <>
              {careTeamFields.map(field => renderField(field))}
            </>
          ) : (
            <pre className="text-sm overflow-auto max-h-96">
              {JSON.stringify(careTeam, null, 2)}
            </pre>
          )}
          <div className="flex space-x-2 mt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>View Raw FHIR Data</Button>
              </DialogTrigger>
              <DialogContent className="max-w-[800px] w-full">
                <DialogHeader>
                  <DialogTitle>Raw FHIR Care Team Data</DialogTitle>
                </DialogHeader>
                <pre className="text-sm overflow-auto max-h-[60vh]">
                  {JSON.stringify(careTeam, null, 2)}
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

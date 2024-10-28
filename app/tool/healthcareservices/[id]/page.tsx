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
import { getHealthcareServices, getOrganisations } from '@/utils/data-store';
import { Settings } from 'lucide-react';

// Define the FHIR HealthcareService fields
const healthcareServiceFields = [
  'id', 'identifier', 'active', 'providedBy', 'category', 'type', 'specialty',
  'location', 'name', 'comment', 'extraDetails', 'photo', 'telecom', 'coverageArea',
  'serviceProvisionCode', 'eligibility', 'program', 'characteristic', 'communication',
  'referralMethod', 'appointmentRequired', 'availableTime', 'notAvailable', 'availabilityExceptions'
];

export default function HealthcareServiceDetailsPage() {
  const params = useParams();
  const id = params?.id;
  const [service, setService] = useState<any>(null);
  const [showRawData, setShowRawData] = useState(false);
  const [visibleFields, setVisibleFields] = useState<string[]>(healthcareServiceFields);
  const [organisations, setOrganisations] = useState<any[]>([]);

  useEffect(() => {
    if (id && typeof id === 'string') {
      const services = getHealthcareServices();
      const foundService = services.find(s => s.id === id);
      setService(foundService || null);
    }
    setOrganisations(getOrganisations());
  }, [id]);

  if (!service) {
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
        return <p><strong>ID:</strong> {service.id}</p>;
      case 'active':
        return <p><strong>Active:</strong> {service.active ? 'Yes' : 'No'}</p>;
      case 'name':
        return <p><strong>Name:</strong> {service.name}</p>;
      case 'providedBy':
        if (!service.providedBy?.reference) return <p><strong>Provided By:</strong> N/A</p>;
        const [orgType, orgId] = service.providedBy.reference.split('/');
        const organisation = organisations.find(org => org.id === orgId);
        return (
          <p>
            <strong>Provided By:</strong>{' '}
            <HoverCard>
              <HoverCardTrigger asChild>
                <Link href={`/tool/organisations/${orgId}`} className="text-blue-500 hover:underline">
                  {organisation?.name || service.providedBy.reference}
                </Link>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">{organisation?.name}</h4>
                  <p className="text-sm">Type: {organisation?.type?.[0]?.coding?.[0]?.display || 'N/A'}</p>
                  <p className="text-sm">Address: {organisation?.address?.[0]?.text || 'N/A'}</p>
                </div>
              </HoverCardContent>
            </HoverCard>
          </p>
        );
      case 'category':
        return <p><strong>Category:</strong> {service.category?.[0]?.coding?.[0]?.display || 'N/A'}</p>;
      case 'type':
        return <p><strong>Type:</strong> {service.type?.[0]?.coding?.[0]?.display || 'N/A'}</p>;
      case 'specialty':
        return (
          <div>
            <strong>Specialty:</strong>
            <ul>
              {service.specialty?.map((spec: any, index: number) => (
                <li key={index}>{spec.coding?.[0]?.display || 'N/A'}</li>
              ))}
            </ul>
          </div>
        );
      case 'location':
        return (
          <div>
            <strong>Locations:</strong>
            <ul>
              {service.location?.map((loc: any, index: number) => (
                <li key={index}>{loc.reference || 'N/A'}</li>
              ))}
            </ul>
          </div>
        );
      case 'telecom':
        return (
          <div>
            <strong>Contact:</strong>
            {service.telecom?.map((t: any, index: number) => (
              <p key={index}>{t.system}: {t.value}</p>
            ))}
          </div>
        );
      default:
        return <p><strong>{field}:</strong> {JSON.stringify(service[field])}</p>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Healthcare Service Details</h1>
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
              {healthcareServiceFields.map((field) => (
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
                href="https://www.hl7.org/fhir/healthcareservice.html" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline"
              >
                View FHIR Healthcare Service Specification
              </a>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{service.name || `Healthcare Service ${service.id}`}</CardTitle>
        </CardHeader>
        <CardContent>
          {!showRawData ? (
            <>
              {healthcareServiceFields.map(field => renderField(field))}
            </>
          ) : (
            <pre className="text-sm overflow-auto max-h-96">
              {JSON.stringify(service, null, 2)}
            </pre>
          )}
          <div className="flex space-x-2 mt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>View Raw FHIR Data</Button>
              </DialogTrigger>
              <DialogContent className="max-w-[800px] w-full">
                <DialogHeader>
                  <DialogTitle>Raw FHIR Healthcare Service Data</DialogTitle>
                </DialogHeader>
                <pre className="text-sm overflow-auto max-h-[60vh]">
                  {JSON.stringify(service, null, 2)}
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

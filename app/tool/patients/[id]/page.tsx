'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { getPatients, getPractitioners, getOrganizations } from '@/utils/data-store';
import { Settings } from 'lucide-react';
import HtmlModal from '@/components/HtmlModal';
import StructuredDataModal from '@/components/StructuredDataModal';
import ContactPointDisplay from '@/components/ContactPointDisplay';
import { Badge } from "@/components/ui/badge";
import Image from 'next/image';

// Update the patientFields array to include 'text'
const patientFields = [
  'id', 'identifier', 'active', 'name', 'telecom', 'gender', 'birthDate',
  'deceased', 'address', 'maritalStatus', 'multipleBirth', 'photo', 'contact',
  'communication', 'generalPractitioner', 'managingOrganization', 'link', 'text'
];

const renderIdentifier = (identifier: any) => {
  return (
    <div className="ml-4 mt-2 p-3 border rounded-md bg-gray-50">
      <p><strong>System:</strong> {identifier.system}</p>
      <p><strong>Value:</strong> {identifier.value}</p>
      {identifier.type && (
        <div>
          <p><strong>Type:</strong></p>
          <div className="ml-4">
            <p><strong>Text:</strong> {identifier.type.text}</p>
            {identifier.type.coding && identifier.type.coding.map((coding: any, index: number) => (
              <div key={index} className="ml-4 mt-1">
                <p><strong>Coding {index + 1}:</strong></p>
                <p className="ml-4"><strong>System:</strong> {coding.system}</p>
                <p className="ml-4"><strong>Code:</strong> {coding.code}</p>
                <p className="ml-4"><strong>Display:</strong> {coding.display}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const renderReference = (reference: any) => {
  if (!reference) return null;

  return (
    <div className="ml-4 mt-2">
      {reference.display && <p><strong>Display:</strong> {reference.display}</p>}
      {reference.reference && (
        <p>
          <strong>Reference:</strong>{' '}
          <Link href={`/tool/${reference.reference.split('/')[0].toLowerCase()}s/${reference.reference.split('/')[1]}`} className="text-blue-500 hover:underline">
            {reference.reference}
          </Link>
        </p>
      )}
    </div>
  );
};

const renderGender = (gender: string) => {
  const genderColors = {
    male: "bg-blue-100 text-blue-800",
    female: "bg-pink-100 text-pink-800",
    other: "bg-purple-100 text-purple-800",
    unknown: "bg-gray-100 text-gray-800"
  };

  return (
    <Badge className={`${genderColors[gender as keyof typeof genderColors] || genderColors.unknown} capitalize`}>
      {gender}
    </Badge>
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

export default function PatientDetailsPage() {
  const params = useParams();
  const id = params?.id;
  const [patient, setPatient] = useState<any>(null);
  const [showRawData, setShowRawData] = useState(false);
  const [visibleFields, setVisibleFields] = useState<string[]>(patientFields);
  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);

  useEffect(() => {
    if (id && typeof id === 'string') {
      const patients = getPatients();
      const foundPatient = patients.find(p => p.id === id);
      setPractitioners(getPractitioners());
      setOrganizations(getOrganizations()); // Use getOrganizations here
      setPatient(foundPatient || null);
    }
  }, [id]);

  if (!patient) {
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
    
    const value = patient[field];
    
    if (value === undefined || value === null) return null;
    
    switch (field) {
      case 'id':
        return <p><strong>ID:</strong> {value}</p>;
      case 'identifier':
        if (!value || (Array.isArray(value) && value.length === 0)) return null;
        return (
          <div>
            <strong>Identifiers:</strong>
            {Array.isArray(value) ? (
              value.map((identifier, index) => (
                <div key={index}>
                  <h4 className="mt-2">Identifier {index + 1}:</h4>
                  {renderIdentifier(identifier)}
                </div>
              ))
            ) : (
              <StructuredDataModal content={value} fieldName="Identifier" />
            )}
          </div>
        );
      case 'active':
        return <p><strong>Active:</strong> {value ? 'Yes' : 'No'}</p>;
      case 'name':
        return <p><strong>Name:</strong> {value[0]?.given?.join(' ')} {value[0]?.family}</p>;
      case 'telecom':
        return (
          <div>
            <strong>Contact Information:</strong>
            <ContactPointDisplay contactPoints={value} />
          </div>
        );
      case 'gender':
        return (
          <div>
            <strong>Gender:</strong> {renderGender(value)}
          </div>
        );
      case 'birthDate':
        return <p><strong>Birth Date:</strong> {value || 'N/A'}</p>;
      case 'deceased':
        return <p><strong>Deceased:</strong> {JSON.stringify(value)}</p>;
      case 'address':
        return (
          <p>
            <strong>Address:</strong> {value && value[0] ? 
              `${value[0].line?.join(', ') || ''}, ${value[0].city || ''}, ${value[0].state || ''}, ${value[0].postalCode || ''}, ${value[0].country || ''}`.replace(/^[,\s]+|[,\s]+$/g, '') 
              : 'N/A'}
          </p>
        );
      case 'maritalStatus':
        return (
          <div>
            <strong>Marital Status:</strong>
            {renderCodeableConcept(value, "Marital Status")}
          </div>
        );
      case 'multipleBirth':
        return <p><strong>Multiple Birth:</strong> {JSON.stringify(value)}</p>;
      case 'photo':
        if (Array.isArray(value) && value.length > 0) {
          return (
            <div>
              <strong>Photo:</strong>
              {value.map((photo, index) => (
                <div key={index}>
                  <Image
                    src={`data:${photo.contentType};base64,${photo.data}`}
                    alt={`Patient photo ${index + 1}`}
                    width={200}
                    height={200}
                  />
                </div>
              ))}
            </div>
          );
        }
        return null;
      case 'contact':
        if (Array.isArray(value) && value.length > 0) {
          return (
            <div>
              <strong>Contact:</strong>
              {value.map((contact, index) => (
                <StructuredDataModal 
                  key={index} 
                  content={contact} 
                  fieldName={`Contact ${index + 1}`} 
                />
              ))}
            </div>
          );
        }
        return null;
      case 'communication':
        return (
          <div>
            <strong>Communication:</strong>
            {value?.map((c: any, index: number) => (
              <p key={index}>{c.language?.coding?.[0]?.display || 'N/A'}</p>
            )) || 'N/A'}
          </div>
        );
      case 'generalPractitioner':
        return (
          <div>
            <strong>General Practitioner:</strong>
            {Array.isArray(value) ? (
              value.map((gp, index) => (
                <div key={index}>
                  {renderReference(gp)}
                </div>
              ))
            ) : (
              renderReference(value)
            )}
          </div>
        );
      case 'managingOrganization':
        return (
          <div>
            <strong>Managing Organization:</strong>
            {renderReference(value)}
          </div>
        );
      case 'link':
        return (
          <div>
            <strong>Link:</strong>
            {Array.isArray(value) ? (
              value.map((link, index) => (
                <div key={index} className="ml-4 mt-2">
                  <p><strong>Type:</strong> {link.type}</p>
                  {link.other && (
                    <p>
                      <strong>Other:</strong>{' '}
                      <Link href={`/tool/${link.other.reference.split('/')[0].toLowerCase()}s/${link.other.reference.split('/')[1]}`} className="text-blue-500 hover:underline">
                        {link.other.reference}
                      </Link>
                    </p>
                  )}
                </div>
              ))
            ) : (
              <StructuredDataModal content={value} fieldName="Link" />
            )}
          </div>
        );
      case 'text':
        if (value && typeof value === 'object') {
          return (
            <div>
              <strong>Text:</strong>
              <p><strong>Status:</strong> {value.status}</p>
              {value.div && <HtmlModal htmlContent={value.div} fieldName="Text Content" />}
            </div>
          );
        }
        return null;
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
        <h1 className="text-3xl font-bold">Patient Details</h1>
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
              {patientFields.map((field) => (
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
                href="https://www.hl7.org/fhir/patient.html" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline"
              >
                View FHIR Patient Specification
              </a>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{patient.name?.[0]?.given?.join(' ')} {patient.name?.[0]?.family}</CardTitle>
        </CardHeader>
        <CardContent>
          {!showRawData ? (
            <>
              {patientFields.map(field => renderField(field))}
            </>
          ) : (
            <pre className="text-sm overflow-auto max-h-96">
              {JSON.stringify(patient, null, 2)}
            </pre>
          )}
          <div className="flex space-x-2 mt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>View Raw FHIR Data</Button>
              </DialogTrigger>
              <DialogContent className="max-w-[800px] w-full">
                <DialogHeader>
                  <DialogTitle>Raw FHIR Patient Data</DialogTitle>
                </DialogHeader>
                <pre className="text-sm overflow-auto max-h-[60vh]">
                  {JSON.stringify(patient, null, 2)}
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

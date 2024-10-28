'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { getPractitioners } from '@/utils/data-store';
import { Settings } from 'lucide-react';
import HtmlModal from '@/components/HtmlModal';
import StructuredDataModal from '@/components/StructuredDataModal';

// Define the FHIR Practitioner fields
const practitionerFields = [
  'id', 'identifier', 'active', 'name', 'telecom', 'address', 'gender',
  'birthDate', 'photo', 'qualification', 'communication'
];

export default function PractitionerDetailsPage() {
  const params = useParams();
  const id = params?.id;
  const [practitioner, setPractitioner] = useState<any>(null);
  const [showRawData, setShowRawData] = useState(false);
  const [visibleFields, setVisibleFields] = useState<string[]>(practitionerFields);

  useEffect(() => {
    if (id && typeof id === 'string') {
      const practitioners = getPractitioners();
      const foundPractitioner = practitioners.find(p => p.id === id);
      setPractitioner(foundPractitioner || null);
    }
  }, [id]);

  if (!practitioner) {
    return <div>Loading...</div>;
  }

  const toggleField = (field: string) => {
    setVisibleFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

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

  const renderField = (field: string) => {
    if (!visibleFields.includes(field)) return null;
    
    const value = practitioner[field];
    
    if (value === undefined) return null;
    
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
        return (
          <div>
            <strong>Name:</strong>
            {Array.isArray(value) ? (
              value.map((name, index) => (
                <div key={index} className="ml-4 mt-2">
                  <p><strong>Use:</strong> {name.use}</p>
                  <p><strong>Family:</strong> {name.family}</p>
                  <p><strong>Given:</strong> {name.given?.join(' ')}</p>
                </div>
              ))
            ) : (
              <StructuredDataModal content={value} fieldName="Name" />
            )}
          </div>
        );
      case 'telecom':
        return (
          <div>
            <strong>Telecom:</strong>
            {Array.isArray(value) ? (
              value.map((telecom, index) => (
                <div key={index} className="ml-4 mt-2">
                  <p><strong>System:</strong> {telecom.system}</p>
                  <p><strong>Value:</strong> {telecom.value}</p>
                  <p><strong>Use:</strong> {telecom.use}</p>
                </div>
              ))
            ) : (
              <StructuredDataModal content={value} fieldName="Telecom" />
            )}
          </div>
        );
      case 'address':
        return (
          <div>
            <strong>Address:</strong>
            {Array.isArray(value) ? (
              value.map((address, index) => (
                <div key={index} className="ml-4 mt-2">
                  <p><strong>Use:</strong> {address.use}</p>
                  <p><strong>Type:</strong> {address.type}</p>
                  <p><strong>Line:</strong> {address.line?.join(', ')}</p>
                  <p><strong>City:</strong> {address.city}</p>
                  <p><strong>State:</strong> {address.state}</p>
                  <p><strong>Postal Code:</strong> {address.postalCode}</p>
                  <p><strong>Country:</strong> {address.country}</p>
                </div>
              ))
            ) : (
              <StructuredDataModal content={value} fieldName="Address" />
            )}
          </div>
        );
      case 'gender':
        return <p><strong>Gender:</strong> {value}</p>;
      case 'birthDate':
        return <p><strong>Birth Date:</strong> {value}</p>;
      case 'photo':
        if (!value || (Array.isArray(value) && value.length === 0)) return null;
        return (
          <div>
            <strong>Photo:</strong>
            {Array.isArray(value) ? (
              value.map((photo, index) => (
                <div key={index} className="mt-2">
                  <Image
                    src={`data:${photo.contentType};base64,${photo.data}`}
                    alt={`Practitioner photo ${index + 1}`}
                    width={200}
                    height={200}
                  />
                </div>
              ))
            ) : (
              <StructuredDataModal content={value} fieldName="Photo" />
            )}
          </div>
        );
      case 'qualification':
        return (
          <div>
            <strong>Qualifications:</strong>
            {Array.isArray(value) ? (
              value.map((qual, index) => (
                <div key={index} className="ml-4 mt-2">
                  <p><strong>Identifier:</strong> {qual.identifier?.map((id: { value: string }) => id.value).join(', ')}</p>
                  <p><strong>Code:</strong> {qual.code?.coding?.[0]?.display || qual.code?.text}</p>
                  <p><strong>Period:</strong> {qual.period?.start} - {qual.period?.end}</p>
                  <p><strong>Issuer:</strong> {qual.issuer?.display}</p>
                </div>
              ))
            ) : (
              <StructuredDataModal content={value} fieldName="Qualifications" />
            )}
          </div>
        );
      case 'communication':
        return (
          <div>
            <strong>Communication:</strong>
            {Array.isArray(value) ? (
              value.map((comm, index) => (
                <div key={index} className="ml-4 mt-2">
                  <p><strong>Language:</strong> {comm.coding?.[0]?.display || comm.text}</p>
                </div>
              ))
            ) : (
              <StructuredDataModal content={value} fieldName="Communication" />
            )}
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
        <h1 className="text-3xl font-bold">Practitioner Details</h1>
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
              {practitionerFields.map((field) => (
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
          <CardTitle>{practitioner.name?.[0]?.given?.join(' ')} {practitioner.name?.[0]?.family}</CardTitle>
        </CardHeader>
        <CardContent>
          {!showRawData ? (
            <>
              {practitionerFields.map(field => renderField(field))}
            </>
          ) : (
            <pre className="text-sm overflow-auto max-h-96">
              {JSON.stringify(practitioner, null, 2)}
            </pre>
          )}
          <div className="flex space-x-2 mt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>View Raw FHIR Data</Button>
              </DialogTrigger>
              <DialogContent className="max-w-[800px] w-full">
                <DialogHeader>
                  <DialogTitle>Raw FHIR Practitioner Data</DialogTitle>
                </DialogHeader>
                <pre className="text-sm overflow-auto max-h-[60vh]">
                  {JSON.stringify(practitioner, null, 2)}
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

'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { getOrganizations } from '@/utils/data-store';
import { Settings } from 'lucide-react';
import HtmlModal from '@/components/HtmlModal';
import StructuredDataModal from '@/components/StructuredDataModal';

// Define the FHIR Organization fields
const organizationFields = [
  'id', 'identifier', 'active', 'type', 'name', 'alias', 'telecom', 'address',
  'partOf', 'contact', 'endpoint'
];

export default function OrganizationDetailsPage() {
  const params = useParams();
  const id = params?.id;
  const [organization, setOrganization] = useState<any>(null);
  const [showRawData, setShowRawData] = useState(false);
  const [visibleFields, setVisibleFields] = useState<string[]>(organizationFields);

  useEffect(() => {
    if (id && typeof id === 'string') {
      const organizations = getOrganizations();
      const foundOrganization = organizations.find(o => o.id === id);
      setOrganization(foundOrganization || null);
    }
  }, [id]);

  if (!organization) {
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
    
    const value = organization[field];
    
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
      case 'type':
        return (
          <div>
            <strong>Type:</strong>
            {value.map((type: any, index: number) => (
              <p key={index} className="ml-4">{type.coding?.[0]?.display || 'N/A'}</p>
            ))}
          </div>
        );
      case 'name':
        return <p><strong>Name:</strong> {value}</p>;
      case 'alias':
        return (
          <div>
            <strong>Aliases:</strong>
            {value.map((alias: string, index: number) => (
              <p key={index} className="ml-4">{alias}</p>
            ))}
          </div>
        );
      case 'telecom':
        return (
          <div>
            <strong>Telecom:</strong>
            {value.map((telecom: any, index: number) => (
              <div key={index} className="ml-4">
                <p><strong>System:</strong> {telecom.system}</p>
                <p><strong>Value:</strong> {telecom.value}</p>
                <p><strong>Use:</strong> {telecom.use}</p>
              </div>
            ))}
          </div>
        );
      case 'address':
        return (
          <div>
            <strong>Address:</strong>
            {value.map((address: any, index: number) => (
              <div key={index} className="ml-4">
                <p><strong>Use:</strong> {address.use}</p>
                <p><strong>Type:</strong> {address.type}</p>
                <p><strong>Text:</strong> {address.text}</p>
                <p><strong>Line:</strong> {address.line?.join(', ')}</p>
                <p><strong>City:</strong> {address.city}</p>
                <p><strong>State:</strong> {address.state}</p>
                <p><strong>Postal Code:</strong> {address.postalCode}</p>
                <p><strong>Country:</strong> {address.country}</p>
              </div>
            ))}
          </div>
        );
      case 'partOf':
        return (
          <p>
            <strong>Part Of:</strong>{' '}
            {value.reference ? (
              <Link href={`/tool/organisations/${value.reference.split('/')[1]}`} className="text-blue-500 hover:underline">
                {value.reference}
              </Link>
            ) : 'N/A'}
          </p>
        );
      case 'contact':
        return (
          <div>
            <strong>Contacts:</strong>
            {value.map((contact: any, index: number) => (
              <div key={index} className="ml-4 mt-2">
                <p><strong>Purpose:</strong> {contact.purpose?.coding?.[0]?.display || 'N/A'}</p>
                <p><strong>Name:</strong> {contact.name?.text || 'N/A'}</p>
                {contact.telecom && (
                  <div>
                    <p><strong>Telecom:</strong></p>
                    {contact.telecom.map((telecom: any, telecomIndex: number) => (
                      <div key={telecomIndex} className="ml-4">
                        <p><strong>System:</strong> {telecom.system}</p>
                        <p><strong>Value:</strong> {telecom.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      case 'endpoint':
        return (
          <div>
            <strong>Endpoints:</strong>
            {value.map((endpoint: any, index: number) => (
              <p key={index} className="ml-4">
                <Link href={`/tool/endpoints/${endpoint.reference.split('/')[1]}`} className="text-blue-500 hover:underline">
                  {endpoint.reference}
                </Link>
              </p>
            ))}
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
        <h1 className="text-3xl font-bold">Organization Details</h1>
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
              {organizationFields.map((field) => (
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
          <CardTitle>{organization.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {!showRawData ? (
            <>
              {organizationFields.map(field => renderField(field))}
            </>
          ) : (
            <pre className="text-sm overflow-auto max-h-96">
              {JSON.stringify(organization, null, 2)}
            </pre>
          )}
          <div className="flex space-x-2 mt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>View Raw FHIR Data</Button>
              </DialogTrigger>
              <DialogContent className="max-w-[800px] w-full">
                <DialogHeader>
                  <DialogTitle>Raw FHIR Organization Data</DialogTitle>
                </DialogHeader>
                <pre className="text-sm overflow-auto max-h-[60vh]">
                  {JSON.stringify(organization, null, 2)}
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

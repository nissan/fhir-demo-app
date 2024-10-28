'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getOrganizations } from '@/utils/data-store';

const OrganisationCard = ({ organisation }: { organisation: any }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{organisation.name}</CardTitle>
        <Link href={`/tool/organisations/${organisation.id}`} passHref>
          <Button variant="outline">View Details</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <p>Type: {organisation.type?.[0]?.coding?.[0]?.display || 'N/A'}</p>
        <p>Active: {organisation.active ? 'Yes' : 'No'}</p>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="mt-4">View Raw FHIR Data</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[800px] w-full">
            <DialogHeader>
              <DialogTitle>Raw FHIR Organisation Data</DialogTitle>
            </DialogHeader>
            <pre className="text-sm overflow-auto max-h-[60vh]">
              {JSON.stringify(organisation, null, 2)}
            </pre>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default function OrganisationsPage() {
  const [organisations, setOrganisations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setOrganisations(getOrganizations());
  }, []);

  const filteredOrganisations = organisations.filter(organisation => {
    return organisation.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Organisations</h1>
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          placeholder="Search organisations by name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrganisations.map((organisation, index) => (
          <OrganisationCard key={index} organisation={organisation} />
        ))}
      </div>
    </div>
  );
}

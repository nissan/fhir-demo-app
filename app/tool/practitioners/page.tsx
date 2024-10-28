'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getPractitioners } from '@/utils/data-store';

const PractitionerCard = ({ practitioner }: { practitioner: any }) => {
  const getName = (practitioner: any) => {
    if (practitioner.name && practitioner.name[0]) {
      const name = practitioner.name[0];
      const given = name.given ? name.given.join(' ') : '';
      const family = name.family || '';
      return `${given} ${family}`.trim() || 'Unnamed Practitioner';
    }
    return 'Unnamed Practitioner';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{getName(practitioner)}</CardTitle>
        <Link href={`/tool/practitioners/${practitioner.id}`} passHref>
          <Button variant="outline">View Details</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <p>Gender: {practitioner.gender || 'N/A'}</p>
        <p>Qualification: {practitioner.qualification?.[0]?.code?.coding?.[0]?.display || 'N/A'}</p>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="mt-4">View Raw FHIR Data</Button>
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
      </CardContent>
    </Card>
  );
};

export default function PractitionersPage() {
  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setPractitioners(getPractitioners());
  }, []);

  const filteredPractitioners = practitioners.filter(practitioner => {
    const fullName = practitioner.name && practitioner.name[0] ? 
      `${practitioner.name[0].given?.join(' ') || ''} ${practitioner.name[0].family || ''}`.trim().toLowerCase() :
      '';
    return fullName.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Practitioners</h1>
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          placeholder="Search practitioners by name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPractitioners.map((practitioner, index) => (
          <PractitionerCard key={index} practitioner={practitioner} />
        ))}
      </div>
    </div>
  );
}

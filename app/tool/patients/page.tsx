'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getPatients } from '@/utils/data-store';

const PatientCard = ({ patient }: { patient: any }) => {
  const getName = (patient: any) => {
    if (patient.name && patient.name[0]) {
      const name = patient.name[0];
      const given = name.given ? name.given.join(' ') : '';
      const family = name.family || '';
      return `${given} ${family}`.trim() || 'Unnamed Patient';
    }
    return 'Unnamed Patient';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{getName(patient)}</CardTitle>
        <Link href={`/tool/patients/${patient.id}`} passHref>
          <Button variant="outline">View Details</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <p>Gender: {patient.gender || 'N/A'}</p>
        <p>Birth Date: {patient.birthDate || 'N/A'}</p>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="mt-4">View Raw FHIR Data</Button>
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
      </CardContent>
    </Card>
  );
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setPatients(getPatients());
  }, []);

  const filteredPatients = patients.filter(patient => {
    const fullName = patient.name && patient.name[0] ? 
      `${patient.name[0].given?.join(' ') || ''} ${patient.name[0].family || ''}`.trim().toLowerCase() :
      '';
    return fullName.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Patients</h1>
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          placeholder="Search patients by name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((patient, index) => (
          <PatientCard key={index} patient={patient} />
        ))}
      </div>
    </div>
  );
}

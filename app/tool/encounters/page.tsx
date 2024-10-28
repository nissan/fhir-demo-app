'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getEncounters } from '@/utils/data-store';

const encounterStatuses = [
  "planned",
  "arrived",
  "triaged",
  "in-progress",
  "onleave",
  "finished",
  "cancelled",
  "entered-in-error",
  "unknown"
];

const EncounterCard = ({ encounter }: { encounter: any }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Encounter {encounter.id}</CardTitle>
        <Link href={`/tool/encounters/${encounter.id}`} passHref>
          <Button variant="outline">View Details</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <p>Status: {encounter.status}</p>
        <p>Class: {encounter.class?.code || 'N/A'}</p>
        <p>Subject: {encounter.subject?.reference || 'N/A'}</p>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="mt-4">View Raw FHIR Data</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[800px] w-full">
            <DialogHeader>
              <DialogTitle>Raw FHIR Encounter Data</DialogTitle>
            </DialogHeader>
            <pre className="text-sm overflow-auto max-h-[60vh]">
              {JSON.stringify(encounter, null, 2)}
            </pre>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default function EncountersPage() {
  const [encounters, setEncounters] = useState<any[]>([]);
  const [filteredEncounters, setFilteredEncounters] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchedEncounters = getEncounters();
    setEncounters(fetchedEncounters);
    setFilteredEncounters(fetchedEncounters);
  }, []);

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredEncounters(encounters);
    } else {
      setFilteredEncounters(encounters.filter(encounter => encounter.status === statusFilter));
    }
  }, [statusFilter, encounters]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Encounters</h1>
        <Select onValueChange={setStatusFilter} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {encounterStatuses.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEncounters.map((encounter, index) => (
          <EncounterCard key={index} encounter={encounter} />
        ))}
      </div>
    </div>
  );
}

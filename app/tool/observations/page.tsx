'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getObservations } from '@/utils/data-store';

const observationStatuses = [
  "registered",
  "preliminary",
  "final",
  "amended",
  "corrected",
  "cancelled",
  "entered-in-error",
  "unknown"
];

const ObservationCard = ({ observation }: { observation: any }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{observation.code?.coding?.[0]?.display || 'Unnamed Observation'}</CardTitle>
        <Link href={`/tool/observations/${observation.id}`} passHref>
          <Button variant="outline">View Details</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <p>Status: {observation.status}</p>
        <p>Value: {observation.valueQuantity ? `${observation.valueQuantity.value} ${observation.valueQuantity.unit}` : 'N/A'}</p>
        <p>Subject: {observation.subject?.reference || 'N/A'}</p>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="mt-4">View Raw FHIR Data</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[800px] w-full">
            <DialogHeader>
              <DialogTitle>Raw FHIR Observation Data</DialogTitle>
            </DialogHeader>
            <pre className="text-sm overflow-auto max-h-[60vh]">
              {JSON.stringify(observation, null, 2)}
            </pre>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default function ObservationsPage() {
  const [observations, setObservations] = useState<any[]>([]);
  const [filteredObservations, setFilteredObservations] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchedObservations = getObservations();
    setObservations(fetchedObservations);
    setFilteredObservations(fetchedObservations);
  }, []);

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredObservations(observations);
    } else {
      setFilteredObservations(observations.filter(observation => observation.status === statusFilter));
    }
  }, [statusFilter, observations]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Observations</h1>
        <Select onValueChange={setStatusFilter} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {observationStatuses.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredObservations.map((observation, index) => (
          <ObservationCard key={index} observation={observation} />
        ))}
      </div>
    </div>
  );
}

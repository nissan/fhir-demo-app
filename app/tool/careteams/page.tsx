'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCareTeams } from '@/utils/data-store';

const careTeamStatuses = [
  "proposed",
  "active",
  "suspended",
  "inactive",
  "entered-in-error"
];

const CareTeamCard = ({ careTeam }: { careTeam: any }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{careTeam.name || `Care Team ${careTeam.id}`}</CardTitle>
        <Link href={`/tool/careteams/${careTeam.id}`} passHref>
          <Button variant="outline">View Details</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <p>Status: {careTeam.status || 'N/A'}</p>
        <p>Subject: {careTeam.subject?.reference || 'N/A'}</p>
        <p>Participants: {careTeam.participant?.length || 0}</p>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="mt-4">View Raw FHIR Data</Button>
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
      </CardContent>
    </Card>
  );
};

export default function CareTeamsPage() {
  const [careTeams, setCareTeams] = useState<any[]>([]);
  const [filteredCareTeams, setFilteredCareTeams] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchedCareTeams = getCareTeams();
    setCareTeams(fetchedCareTeams);
    setFilteredCareTeams(fetchedCareTeams);
  }, []);

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredCareTeams(careTeams);
    } else {
      setFilteredCareTeams(careTeams.filter(careTeam => careTeam.status === statusFilter));
    }
  }, [statusFilter, careTeams]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Care Teams</h1>
        <Select onValueChange={setStatusFilter} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {careTeamStatuses.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCareTeams.map((careTeam, index) => (
          <CareTeamCard key={index} careTeam={careTeam} />
        ))}
      </div>
    </div>
  );
}

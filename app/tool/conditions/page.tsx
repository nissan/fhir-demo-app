'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getConditions } from '@/utils/data-store';

const clinicalStatuses = [
  "active",
  "recurrence",
  "relapse",
  "inactive",
  "remission",
  "resolved"
];

const verificationStatuses = [
  "unconfirmed",
  "provisional",
  "differential",
  "confirmed",
  "refuted",
  "entered-in-error"
];

const ConditionCard = ({ condition }: { condition: any }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{condition.code?.coding?.[0]?.display || 'Unnamed Condition'}</CardTitle>
        <Link href={`/tool/conditions/${condition.id}`} passHref>
          <Button variant="outline">View Details</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <p>Clinical Status: {condition.clinicalStatus?.coding?.[0]?.code || 'N/A'}</p>
        <p>Verification Status: {condition.verificationStatus?.coding?.[0]?.code || 'N/A'}</p>
        <p>Subject: {condition.subject?.reference || 'N/A'}</p>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="mt-4">View Raw FHIR Data</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[800px] w-full">
            <DialogHeader>
              <DialogTitle>Raw FHIR Condition Data</DialogTitle>
            </DialogHeader>
            <pre className="text-sm overflow-auto max-h-[60vh]">
              {JSON.stringify(condition, null, 2)}
            </pre>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default function ConditionsPage() {
  const [conditions, setConditions] = useState<any[]>([]);
  const [filteredConditions, setFilteredConditions] = useState<any[]>([]);
  const [clinicalStatusFilter, setClinicalStatusFilter] = useState<string>("all");
  const [verificationStatusFilter, setVerificationStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const fetchedConditions = getConditions();
    setConditions(fetchedConditions);
    setFilteredConditions(fetchedConditions);
  }, []);

  useEffect(() => {
    let filtered = conditions;
    
    if (clinicalStatusFilter !== "all") {
      filtered = filtered.filter(condition => 
        condition.clinicalStatus?.coding?.[0]?.code === clinicalStatusFilter
      );
    }
    
    if (verificationStatusFilter !== "all") {
      filtered = filtered.filter(condition => 
        condition.verificationStatus?.coding?.[0]?.code === verificationStatusFilter
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(condition =>
        condition.code?.coding?.[0]?.display?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredConditions(filtered);
  }, [clinicalStatusFilter, verificationStatusFilter, searchTerm, conditions]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Conditions</h1>
      </div>
      <div className="flex space-x-4 items-center">
        <Input
          type="text"
          placeholder="Search conditions"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Select onValueChange={setClinicalStatusFilter} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Clinical Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clinical Statuses</SelectItem>
            {clinicalStatuses.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={setVerificationStatusFilter} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Verification Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Verification Statuses</SelectItem>
            {verificationStatuses.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredConditions.map((condition, index) => (
          <ConditionCard key={index} condition={condition} />
        ))}
      </div>
    </div>
  );
}

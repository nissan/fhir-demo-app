'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getReports } from '@/utils/data-store';

const diagnosticReportStatuses = [
  "registered",
  "partial",
  "preliminary",
  "final",
  "amended",
  "corrected",
  "appended",
  "cancelled",
  "entered-in-error",
  "unknown"
];

const DiagnosticReportCard = ({ report }: { report: any }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Diagnostic Report {report.id}</CardTitle>
        <Link href={`/tool/reports/${report.id}`} passHref>
          <Button variant="outline">View Details</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <p>Status: {report.status || 'N/A'}</p>
        <p>Type: {report.code?.coding?.[0]?.display || 'N/A'}</p>
        <p>Subject: {report.subject?.reference || 'N/A'}</p>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="mt-4">View Raw FHIR Data</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[800px] w-full">
            <DialogHeader>
              <DialogTitle>Raw FHIR Diagnostic Report Data</DialogTitle>
            </DialogHeader>
            <pre className="text-sm overflow-auto max-h-[60vh]">
              {JSON.stringify(report, null, 2)}
            </pre>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default function DiagnosticReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchedReports = getReports();
    setReports(fetchedReports);
    setFilteredReports(fetchedReports);
  }, []);

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredReports(reports);
    } else {
      setFilteredReports(reports.filter(report => report.status === statusFilter));
    }
  }, [statusFilter, reports]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Diagnostic Reports</h1>
        <Select onValueChange={setStatusFilter} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {diagnosticReportStatuses.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report, index) => (
          <DiagnosticReportCard key={index} report={report} />
        ))}
      </div>
    </div>
  );
}

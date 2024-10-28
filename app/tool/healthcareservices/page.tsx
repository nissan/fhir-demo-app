'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getHealthcareServices } from '@/utils/data-store';

const HealthcareServiceCard = ({ service }: { service: any }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{service.name || `Healthcare Service ${service.id}`}</CardTitle>
        <Link href={`/tool/healthcareservices/${service.id}`} passHref>
          <Button variant="outline">View Details</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <p>Type: {service.type?.[0]?.coding?.[0]?.display || 'N/A'}</p>
        <p>Category: {service.category?.[0]?.coding?.[0]?.display || 'N/A'}</p>
        <p>Provider: {service.providedBy?.reference || 'N/A'}</p>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="mt-4">View Raw FHIR Data</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[800px] w-full">
            <DialogHeader>
              <DialogTitle>Raw FHIR Healthcare Service Data</DialogTitle>
            </DialogHeader>
            <pre className="text-sm overflow-auto max-h-[60vh]">
              {JSON.stringify(service, null, 2)}
            </pre>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default function HealthcareServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchedServices = getHealthcareServices();
    setServices(fetchedServices);
  }, []);

  const filteredServices = services.filter(service => 
    service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.type?.[0]?.coding?.[0]?.display?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category?.[0]?.coding?.[0]?.display?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Healthcare Services</h1>
        <Input
          type="text"
          placeholder="Search healthcare services"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service, index) => (
          <HealthcareServiceCard key={index} service={service} />
        ))}
      </div>
    </div>
  );
}

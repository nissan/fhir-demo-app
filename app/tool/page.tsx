'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ShimmerButton from "@/components/ui/shimmer-button";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const navItems = [
  { name: 'Bundles', href: '/tool/bundle', isPulsating: true },
  { name: 'Patients', href: '/tool/patients' },
  { name: 'Practitioners', href: '/tool/practitioners' },
  { name: 'Organisations', href: '/tool/organisations' },
  { name: 'Encounters', href: '/tool/encounters' },
  { name: 'Observations', href: '/tool/observations' },
  { name: 'Reports', href: '/tool/reports' },
  { name: 'Care Teams', href: '/tool/careteams' },
  { name: 'Healthcare Services', href: '/tool/healthcareservices' },
  { name: 'Conditions', href: '/tool/conditions' },
  { name: 'About', href: '/tool/about' },
];

const PulsatingButton = ({ children, href }: { children: React.ReactNode; href: string }) => (
  <div className="relative">
    <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 animate-pulse"></div>
    <Link href={href} passHref>
      <ShimmerButton
        shimmerColor="#ff00ff"
        shimmerSize="0.1em"
        shimmerDuration="1.5s"
        borderRadius="0.5rem"
        className="relative w-full h-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold"
      >
        {children}
      </ShimmerButton>
    </Link>
  </div>
);

export default function ToolPage() {
  const [fullUrl, setFullUrl] = useState('');

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">FHIR Visualisation Dashboard</h1>
        <ModeToggle />
      </header>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Welcome to the FHIR Visualisation Tool. Use the buttons below to explore different FHIR resources and their relationships. We recommend starting with the Bundles for an overview of all resources.
      </p>
      <div className="space-y-2">
        <Label htmlFor="fullUrl">Full URL (for complex queries)</Label>
        <p className="text-sm text-gray-500">
          Enter a complete FHIR API URL here for complex queries, or use the options above to construct a simple query.
        </p>
        <Input
          id="fullUrl"
          value={fullUrl}
          onChange={(e) => setFullUrl(e.target.value)}
          placeholder="https://hapi.fhir.org/baseR4/DiagnosticReport?patient=30358&_format=json"
          className="bg-white"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {navItems.map((item) => (
          item.isPulsating ? (
            <PulsatingButton key={item.name} href={item.href}>
              <span className="text-white">
                {item.name}
              </span>
            </PulsatingButton>
          ) : (
            <Link key={item.name} href={item.href} passHref>
              <ShimmerButton
                shimmerColor="#ffffff"
                shimmerSize="0.05em"
                shimmerDuration="3s"
                borderRadius="0.5rem"
                className="w-full h-full bg-white dark:bg-gray-800 text-white dark:text-white border border-gray-300 dark:border-gray-600"
              >
                {item.name}
              </ShimmerButton>
            </Link>
          )
        ))}
      </div>
    </div>
  );
}

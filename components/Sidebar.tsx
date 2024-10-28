'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getResourceCounts, addListener } from '@/utils/data-store';

const Sidebar = () => {
  const [resourceCounts, setResourceCounts] = useState<{ [key: string]: number }>({});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const updateCounts = () => {
      setResourceCounts(getResourceCounts());
    };

    updateCounts(); // Initial update

    const removeListener = addListener(updateCounts);

    return () => removeListener();
  }, []);

  const navItems = [
    { name: 'Bundles', path: '/tool/bundle', resourceType: 'Bundle' },
    { name: 'Patients', path: '/tool/patients', resourceType: 'Patient' },
    { name: 'Practitioners', path: '/tool/practitioners', resourceType: 'Practitioner' },
    { name: 'Organisations', path: '/tool/organisations', resourceType: 'Organization' },
    { name: 'Encounters', path: '/tool/encounters', resourceType: 'Encounter' },
    { name: 'Observations', path: '/tool/observations', resourceType: 'Observation' },
    { name: 'Diagnostic Reports', path: '/tool/reports', resourceType: 'DiagnosticReport' },
    { name: 'Care Teams', path: '/tool/careteams', resourceType: 'CareTeam' },
    { name: 'Healthcare Services', path: '/tool/healthcareservices', resourceType: 'HealthcareService' },
    { name: 'Conditions', path: '/tool/conditions', resourceType: 'Condition' },
  ];

  if (!isClient) {
    return null; // or return a loading spinner
  }

  return (
    <nav className="space-y-2">
      {navItems.map((item) => (
        <Link 
          key={item.path} 
          href={item.path}
          className={`block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
            resourceCounts[item.resourceType] === 0 
              ? 'text-gray-400 dark:text-gray-500' 
              : 'text-gray-700 dark:text-gray-200'
          }`}
        >
          {item.name} {resourceCounts[item.resourceType] > 0 && `(${resourceCounts[item.resourceType]})`}
        </Link>
      ))}
    </nav>
  );
};

export default Sidebar;

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getBundles, setBundles } from '@/utils/data-store';
import { generateBundle } from '@/utils/fhir-generators';
import { Loader2 } from 'lucide-react'; // Import the Loader2 icon from lucide-react
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import HtmlModal from '@/components/HtmlModal';
import XmlModal from '@/components/XmlModal';

const BundleCard = ({ bundle }: { bundle: any }) => {
  const [expandedResource, setExpandedResource] = useState<string | null>(null);

  const toggleResource = (resourceType: string) => {
    setExpandedResource(expandedResource === resourceType ? null : resourceType);
  };

  const getResourceLink = (resource: any) => {
    const resourceType = resource.resourceType.toLowerCase();
    // Handle special cases for resource types that don't follow the standard plural form
    switch (resourceType) {
      case 'person':
        return `/tool/persons/${resource.id}`;
      case 'family':
        return `/tool/families/${resource.id}`;
      case 'healthcareservice':
        return `/tool/healthcareservices/${resource.id}`;
      case 'diagnosticreport':
        return `/tool/reports/${resource.id}`;
      default:
        // For most resources, just add 's' to the end
        return `/tool/${resourceType}s/${resource.id}`;
    }
  };

  const renderResourceField = (resource: any, field: string) => {
    const value = resource[field];
    
    if (typeof value === 'string') {
      if (value.trim().startsWith('<')) {
        if (value.trim().startsWith('<?xml')) {
          return (
            <div>
              <strong>{field}:</strong> 
              <XmlModal xmlContent={value} fieldName={field} />
            </div>
          );
        } else {
          return (
            <div>
              <strong>{field}:</strong> 
              <HtmlModal htmlContent={value} fieldName={field} />
            </div>
          );
        }
      }
    }
    
    return <p><strong>{field}:</strong> {JSON.stringify(value)}</p>;
  };

  const renderResources = () => {
    if (!bundle.entry || !Array.isArray(bundle.entry)) {
      return <p>No resources found in this bundle.</p>;
    }

    const resourceTypes = bundle.entry.reduce((acc: any, entry: any) => {
      const resourceType = entry.resource?.resourceType;
      if (resourceType) {
        if (!acc[resourceType]) acc[resourceType] = [];
        acc[resourceType].push(entry.resource);
      }
      return acc;
    }, {});

    return Object.entries(resourceTypes).map(([resourceType, resources]: [string, any]) => (
      <div key={resourceType} className="mb-2">
        <Button
          variant="outline"
          onClick={() => toggleResource(resourceType)}
          className="w-full justify-between"
        >
          {resourceType} ({resources.length})
          <span>{expandedResource === resourceType ? '▲' : '▼'}</span>
        </Button>
        {expandedResource === resourceType && (
          <ul className="mt-2 pl-4">
            {resources.map((resource: any, index: number) => (
              <li key={index}>
                <Link href={getResourceLink(resource)} className="text-blue-500 hover:underline">
                  {resource.id}
                </Link>
                {Object.keys(resource).map((field) => renderResourceField(resource, field))}
              </li>
            ))}
          </ul>
        )}
      </div>
    ));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Bundle {bundle.id}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Type: {bundle.type || 'N/A'}</p>
        <p>Total: {bundle.entry && Array.isArray(bundle.entry) ? bundle.entry.length : 0}</p>
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Contained Resources:</h4>
          {renderResources()}
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="mt-4">View Raw Data</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[800px] w-full">
            <DialogHeader>
              <DialogTitle>Raw Data</DialogTitle>
            </DialogHeader>
            <pre className="text-sm overflow-auto max-h-[60vh]">
              {JSON.stringify(bundle, null, 2)}
            </pre>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default function BundlesPage() {
  const [bundles, setBundlesState] = useState<any[]>([]);
  const [isLoadingNewBundles, setIsLoadingNewBundles] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [selectedPresetUrl, setSelectedPresetUrl] = useState('');
  const [selectedResourceType, setSelectedResourceType] = useState<string>('Patient');
  const [itemLimit, setItemLimit] = useState<number | null>(20);
  const [isItemLimitEnabled, setIsItemLimitEnabled] = useState(true);
  const [additionalParams, setAdditionalParams] = useState('');
  const [fullUrl, setFullUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [isJsonDialogOpen, setIsJsonDialogOpen] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(false);

  const presetUrls = [
    { label: 'HAPI FHIR Server', value: 'https://hapi.fhir.org/baseR4' },
    { label: 'SMART Health IT', value: 'https://r4.smarthealthit.org' },
    { label: 'Open FHIR Server', value: 'https://open-fhir.herokuapp.com/fhir' },
    // Add more preset URLs as needed
  ];

  const resourceTypes = [
    'Patient',
    'Practitioner',
    'Organization',
    'DiagnosticReport',
    'CareTeam',
    'HealthcareService',
    'Condition',
    'Observation',
    'Encounter'
  ];

  const handlePresetUrlChange = (value: string) => {
    setSelectedPresetUrl(value);
    setApiEndpoint(value);
  };

  useEffect(() => {
    const fetchedBundles = getBundles();
    setBundlesState(fetchedBundles);
  }, []);

  const handleRegenerateFakeData = () => {
    setIsLoadingNewBundles(true);
    const newBundles = Array.from({ length: 3 }, generateBundle);
    setBundles(newBundles);
    setBundlesState(newBundles);
    setIsLoadingNewBundles(false);
    setIsDialogOpen(false);
  };

  const fetchResource = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch resource from ${url}`);
    }
    return await response.json();
  };

  const processBundle = async (bundle: any, baseUrl: string): Promise<any[]> => {
    const processedBundles: any[] = [bundle];
    const referencedResources: any[] = [];
    const fetchedResourceUrls = new Set<string>();
    const fetchedResourceIds = new Map<string, any>();

    const fetchReferencedResource = async (reference: string) => {
      const [resourceType, id] = reference.split('/');
      const url = `${baseUrl}/${resourceType}/${id}`;
      
      if (fetchedResourceUrls.has(url)) {
        return fetchedResourceIds.get(id);
      }

      if (fetchedResourceIds.has(id)) {
        return fetchedResourceIds.get(id);
      }

      try {
        const resource = await fetchResource(url);
        referencedResources.push(resource);
        fetchedResourceUrls.add(url);
        fetchedResourceIds.set(id, resource);
        // Recursively process references in the fetched resource
        await processReferences(resource);
        return resource;
      } catch (error) {
        console.error(`Failed to fetch referenced resource: ${url}`, error);
        return null;
      }
    };

    const processReferences = async (resource: any) => {
      for (const [key, value] of Object.entries(resource)) {
        if (typeof value === 'object' && value !== null) {
          if ('reference' in value && typeof value.reference === 'string') {
            const fetchedResource = await fetchReferencedResource(value.reference);
            if (fetchedResource) {
              // Instead of assigning directly to value.resource, create a new object
              Object.assign(value, { resource: fetchedResource });
            }
          } else if (Array.isArray(value)) {
            for (const item of value) {
              if (typeof item === 'object' && 'reference' in item && typeof item.reference === 'string') {
                const fetchedResource = await fetchReferencedResource(item.reference);
                if (fetchedResource) {
                  // Instead of assigning directly to item.resource, create a new object
                  Object.assign(item, { resource: fetchedResource });
                }
              }
            }
          }
        }
      }
    };

    // Process the main bundle
    for (const entry of bundle.entry) {
      await processReferences(entry.resource);
    }

    // Handle pagination
    if (bundle.link) {
      const nextLink = bundle.link.find((link: any) => link.relation === 'next');
      if (nextLink) {
        setNextPageUrl(nextLink.url);
      } else {
        setNextPageUrl(null);
      }
    } else {
      setNextPageUrl(null);
    }

    // Create a bundle for referenced resources
    if (referencedResources.length > 0) {
      const referencedBundle = {
        resourceType: 'Bundle',
        type: 'collection',
        entry: referencedResources.map(resource => ({ resource }))
      };
      processedBundles.push(referencedBundle);
    }

    return processedBundles;
  };

  const updateFullUrl = () => {
    if (isManualEntry) return; // Don't update if manual entry is enabled

    if (apiEndpoint && selectedResourceType) {
      let url = `${apiEndpoint}/${selectedResourceType}`;
      const params = new URLSearchParams();
      
      if (isItemLimitEnabled && itemLimit !== null) {
        params.append('_count', itemLimit.toString());
      }
      
      if (additionalParams) {
        params.append('_extra', additionalParams);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      setFullUrl(url);
    } else {
      setFullUrl('');
    }
  };

  useEffect(() => {
    updateFullUrl();
  }, [apiEndpoint, selectedResourceType, itemLimit, additionalParams, isItemLimitEnabled, isManualEntry]);

  const handleFullUrlChange = (newUrl: string) => {
    setFullUrl(newUrl);
    
    if (!isManualEntry) {
      // Parse the new URL
      try {
        const url = new URL(newUrl);
        setApiEndpoint(url.origin + url.pathname.split('/').slice(0, -1).join('/'));
        
        const params = new URLSearchParams(url.search);
        const type = params.get('_type') || 'Patient';
        setSelectedResourceType(type);
        setItemLimit(Number(params.get('_count')) || 20);

        // Extract additional parameters
        const standardParams = ['_type', '_count'];
        const additionalParamsArray = Array.from(params.entries())
          .filter(([key]) => !standardParams.includes(key))
          .map(([key, value]) => `${key}=${value}`);
        setAdditionalParams(additionalParamsArray.join('&'));
      } catch (error) {
        console.error('Invalid URL:', error);
      }
    }
  };

  const handleFetchFromApi = async () => {
    try {
      setIsLoadingNewBundles(true);
      
      // Use the full URL directly if it's provided
      const searchUrl = fullUrl || `${apiEndpoint}/${selectedResourceType}?_count=${itemLimit}${additionalParams ? `&${additionalParams}` : ''}`;

      console.log('Fetching from URL:', searchUrl);

      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/fhir+json',
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
      }

      const initialBundle = await response.json();

      // Extract the base URL from the API endpoint
      const baseUrl = apiEndpoint;

      // Process the initial bundle
      const processedBundles = await processBundle(initialBundle, baseUrl);

      setBundles(processedBundles);
      setBundlesState(processedBundles);
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoadingNewBundles(false);
      setIsDialogOpen(false);
    }
  };

  const handleLoadMore = async () => {
    if (!nextPageUrl) return;

    try {
      setIsLoadingNewBundles(true);
      const response = await fetch(nextPageUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch more data from API');
      }
      const newBundle = await response.json();

      // Extract the base URL from the next page URL
      const baseUrl = nextPageUrl.split('/').slice(0, -1).join('/');

      // Process the new bundle
      const processedBundles = await processBundle(newBundle, baseUrl);

      // Update the bundles in the data store
      setBundles((prevBundles: any[]) => [...prevBundles, ...processedBundles]);
      
      // Update the local state
      setBundlesState(prevBundles => [...prevBundles, ...processedBundles]);
    } catch (error) {
      console.error('Error fetching more data:', error);
      // Handle error (e.g., show error message to user)
    } finally {
      setIsLoadingNewBundles(false);
    }
  };

  const handleLoadFromJson = () => {
    try {
      const jsonBundle = JSON.parse(jsonInput);
      if (jsonBundle.resourceType !== 'Bundle') {
        throw new Error('The provided JSON is not a valid FHIR Bundle');
      }
      setBundles([jsonBundle]);
      setBundlesState([jsonBundle]);
      setError(null);
      setIsJsonDialogOpen(false);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred while parsing JSON');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bundles</h1>
        <div className="space-x-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Load New Bundles</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Load New Bundles</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Button onClick={handleRegenerateFakeData} disabled={isLoadingNewBundles}>
                  {isLoadingNewBundles ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    'Regenerate Fake Data'
                  )}
                </Button>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="manualEntry"
                    checked={isManualEntry}
                    onCheckedChange={(checked) => setIsManualEntry(checked as boolean)}
                  />
                  <label htmlFor="manualEntry">Enter Manually</label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullUrl">Full URL</Label>
                  <Input
                    id="fullUrl"
                    value={fullUrl}
                    onChange={(e) => handleFullUrlChange(e.target.value)}
                    className="bg-white"
                    disabled={!isManualEntry}
                  />
                </div>
                {!isManualEntry && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="itemLimit">
                          Item Limit {isItemLimitEnabled && itemLimit !== null && `(${itemLimit})`}
                        </Label>
                        <Checkbox
                          id="enableItemLimit"
                          checked={isItemLimitEnabled}
                          onCheckedChange={(checked) => setIsItemLimitEnabled(checked as boolean)}
                        />
                      </div>
                      {isItemLimitEnabled && (
                        <Slider
                          id="itemLimit"
                          min={1}
                          max={50}
                          step={1}
                          value={itemLimit !== null ? [itemLimit] : [20]}
                          onValueChange={(value) => setItemLimit(value[0])}
                          disabled={!isItemLimitEnabled}
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="resourceType">Resource Type</Label>
                      <Select 
                        value={selectedResourceType} 
                        onValueChange={setSelectedResourceType}
                      >
                        <SelectTrigger id="resourceType">
                          <SelectValue placeholder="Select a resource type" />
                        </SelectTrigger>
                        <SelectContent>
                          {resourceTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Select onValueChange={handlePresetUrlChange} value={selectedPresetUrl}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a preset FHIR server" />
                      </SelectTrigger>
                      <SelectContent>
                        {presetUrls.map((url) => (
                          <SelectItem key={url.value} value={url.value}>
                            {url.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Enter API endpoint"
                      value={apiEndpoint}
                      onChange={(e) => setApiEndpoint(e.target.value)}
                    />
                    <div className="space-y-2">
                      <Label htmlFor="additionalParams">Additional Parameters</Label>
                      <Input
                        id="additionalParams"
                        placeholder="e.g. _sort=date&_include=Patient:organization"
                        value={additionalParams}
                        onChange={(e) => setAdditionalParams(e.target.value)}
                      />
                    </div>
                  </>
                )}
                <Button 
                  onClick={handleFetchFromApi} 
                  disabled={isLoadingNewBundles || (!isManualEntry && !apiEndpoint) || (isManualEntry && !fullUrl)}
                  className="w-full"
                >
                  {isLoadingNewBundles ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    'Fetch from API'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isJsonDialogOpen} onOpenChange={setIsJsonDialogOpen}>
            <DialogTrigger asChild>
              <Button>Load from JSON</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Load Bundle from JSON</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Textarea
                  placeholder="Paste your FHIR Bundle JSON here"
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  rows={10}
                />
                <Button onClick={handleLoadFromJson}>Load JSON</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {error && (
        <div className="text-red-500 mt-2">
          Error: {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bundles.map((bundle, index) => (
          <BundleCard key={index} bundle={bundle} />
        ))}
      </div>
      {nextPageUrl && (
        <div className="flex justify-center mt-4">
          <Button onClick={handleLoadMore} disabled={isLoadingNewBundles}>
            {isLoadingNewBundles ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

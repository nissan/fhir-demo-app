import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { User, Users, Briefcase, Building2, Stethoscope, CalendarClock, TestTube2, Activity, FileText, Package } from 'lucide-react';

const FHIRResource = React.forwardRef<HTMLDivElement, { name: string; description: string; icon: React.ElementType; style: React.CSSProperties }>(
  ({ name, description, icon: Icon, style }, ref) => {
    return (
      <div ref={ref} className="absolute w-16 h-16" style={style}>
        <HoverCard>
          <HoverCardTrigger>
            <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center">
              <Icon size={32} className="text-blue-600" />
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="flex justify-between space-x-4">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">{name}</h4>
                <p className="text-sm">{description}</p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
    );
  }
);

FHIRResource.displayName = 'FHIRResource';

const FHIRResourceBentoItem = ({ name, description, icon: Icon }: { name: string; description: string; icon: React.ElementType }) => (
  <div className="row-span-1 rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
    <div className="flex items-center space-x-3 mb-3">
      <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{name}</h3>
    </div>
    <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
  </div>
);

export const FHIRRelationshipBeam = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [resourceRefs, setResourceRefs] = useState<(HTMLDivElement | null)[]>([]);

  const resources = [
    { name: "Patient", description: "Demographics and administrative information about an individual receiving care or other health-related services.", icon: User, position: { top: '10%', left: '10%' } },
    { name: "Practitioner", description: "A person who is directly or indirectly involved in the provisioning of healthcare.", icon: Briefcase, position: { top: '10%', left: '50%' } },
    { name: "Care Team", description: "The Care Team includes all the people and organisations who plan to participate in the coordination and delivery of care.", icon: Users, position: { top: '10%', right: '10%' } },
    { name: "Organisation", description: "A formally or informally recognised grouping of people or organisations formed for the purpose of achieving some form of collective action.", icon: Building2, position: { top: '40%', left: '10%' } },
    { name: "Healthcare Service", description: "The details of a healthcare service available at a location.", icon: Stethoscope, position: { top: '40%', left: '50%' } },
    { name: "Encounter", description: "An interaction between a patient and healthcare provider(s) for the purpose of providing healthcare service(s) or assessing the health status of a patient.", icon: CalendarClock, position: { top: '40%', right: '10%' } },
    { name: "Observation", description: "Measurements and simple assertions made about a patient, device or other subject.", icon: TestTube2, position: { bottom: '10%', left: '10%' } },
    { name: "Diagnostic Report", description: "The findings and interpretation of diagnostic tests performed on patients, groups of patients, devices, and locations.", icon: FileText, position: { bottom: '10%', left: '50%' } },
    { name: "Condition", description: "A clinical condition, problem, diagnosis, or other event, situation, issue, or clinical concept that has risen to a level of concern.", icon: Activity, position: { bottom: '10%', right: '10%' } },
    { name: "Bundle", description: "A container for a collection of resources.", icon: Package, position: { top: '70%', left: '30%' } },
  ];

  const connections = [
    { from: 0, to: 1 },
    { from: 0, to: 2 },
    { from: 1, to: 3 },
    { from: 2, to: 4 },
    { from: 0, to: 5 },
    { from: 5, to: 6 },
    { from: 6, to: 7 },
    { from: 0, to: 8 },
    { from: 9, to: 0 },
    { from: 9, to: 1 },
    { from: 9, to: 2 },
    { from: 9, to: 3 },
    { from: 9, to: 4 },
    { from: 9, to: 5 },
    { from: 9, to: 6 },
    { from: 9, to: 7 },
    { from: 9, to: 8 },
  ];

  useEffect(() => {
    setResourceRefs(new Array(resources.length).fill(null));
  }, []);

  const setResourceRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    if (el) {
      setResourceRefs(prev => {
        if (prev[index] === el) return prev; // Avoid unnecessary updates
        const newRefs = [...prev];
        newRefs[index] = el;
        return newRefs;
      });
    }
  }, []);

  return (
    <div className="space-y-8">
      <div ref={containerRef} className="relative w-full h-[600px] bg-gray-100 p-8">
        {resources.map((resource, index) => (
          <FHIRResource
            key={index}
            ref={setResourceRef(index)}
            name={resource.name}
            description={resource.description}
            icon={resource.icon}
            style={resource.position}
          />
        ))}

        {connections.map((connection, index) => (
          resourceRefs[connection.from] && resourceRefs[connection.to] && (
            <AnimatedBeam
              key={index}
              containerRef={containerRef}
              fromRef={{ current: resourceRefs[connection.from] }}
              toRef={{ current: resourceRefs[connection.to] }}
              duration={2}
            />
          )
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
        {resources.map((resource, index) => (
          <FHIRResourceBentoItem
            key={index}
            name={resource.name}
            description={resource.description}
            icon={resource.icon}
          />
        ))}
      </div>
    </div>
  );
};

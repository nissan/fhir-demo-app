import Link from 'next/link';
import StructuredDataModal from '@/components/StructuredDataModal';
import { conceptText, isRecord, referencePath } from '@/lib/fhir';

interface FhirValueProps {
  value: unknown;
  fieldName: string;
}

/** One line of text for the datatypes worth summarising; undefined for anything else. */
function summarise(value: Record<string, unknown>): string | undefined {
  if (Array.isArray(value.coding)) return conceptText(value);
  if (Array.isArray(value.daysOfWeek)) {
    const hours = value.allDay === true ? 'all day' : `${value.availableStartTime ?? '?'} - ${value.availableEndTime ?? '?'}`;
    return `${value.daysOfWeek.join(', ')}: ${hours}`;
  }
  if (typeof value.start === 'string' || typeof value.end === 'string') return `${value.start ?? 'unknown'} to ${value.end ?? 'ongoing'}`;
  // ContactPoint.system is a code ("phone"); Identifier.system is a URI and adds nothing readable.
  if (typeof value.value === 'string') return typeof value.system === 'string' && !value.system.includes(':') ? `${value.system}: ${value.value}` : value.value;
  return typeof value.text === 'string' ? value.text : undefined;
}

/** Renders any FHIR element: references as links, common datatypes as text, the rest as raw JSON on demand. */
const FhirValue: React.FC<FhirValueProps> = ({ value, fieldName }) => {
  if (value === undefined || value === null) return <span>N/A</span>;
  if (typeof value === 'boolean') return <span>{value ? 'Yes' : 'No'}</span>;
  if (Array.isArray(value)) {
    return (
      <ul className="ml-4 list-disc pl-4">
        {value.map((item, index) => (
          <li key={index}><FhirValue value={item} fieldName={fieldName} /></li>
        ))}
      </ul>
    );
  }
  if (!isRecord(value)) return <span>{String(value)}</span>;
  if (typeof value.reference === 'string') {
    const href = referencePath(value.reference);
    const text = typeof value.display === 'string' ? value.display : value.reference;
    return href ? <Link href={href} className="text-blue-500 hover:underline">{text}</Link> : <span>{text}</span>;
  }
  const summary = summarise(value);
  return summary !== undefined ? <span>{summary}</span> : <StructuredDataModal content={value} fieldName={fieldName} />;
};

export default FhirValue;

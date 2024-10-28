import React from 'react';
import { Badge } from "@/components/ui/badge";

interface ContactPoint {
  system?: string;
  value?: string;
  use?: string;
  rank?: number;
  period?: {
    start?: string;
    end?: string;
  };
}

interface ContactPointDisplayProps {
  contactPoints: ContactPoint[];
}

const ContactPointDisplay: React.FC<ContactPointDisplayProps> = ({ contactPoints }) => {
  const getSystemIcon = (system: string) => {
    switch (system) {
      case 'phone': return '📞';
      case 'fax': return '📠';
      case 'email': return '📧';
      case 'pager': return '📟';
      case 'url': return '🌐';
      case 'sms': return '💬';
      case 'other': return '📡';
      default: return '❓';
    }
  };

  const formatPeriod = (period?: { start?: string; end?: string }) => {
    if (!period) return '';
    const start = period.start ? new Date(period.start).toLocaleDateString() : '';
    const end = period.end ? new Date(period.end).toLocaleDateString() : '';
    return `(${start} - ${end})`;
  };

  return (
    <div className="space-y-2">
      {contactPoints.map((cp, index) => (
        <div key={index} className="flex items-center space-x-2">
          <span>{getSystemIcon(cp.system || '')}</span>
          <span className="font-medium">{cp.value}</span>
          {cp.use && <Badge variant="outline">{cp.use}</Badge>}
          {cp.rank && <span className="text-sm text-gray-500">Rank: {cp.rank}</span>}
          {cp.period && <span className="text-sm text-gray-500">{formatPeriod(cp.period)}</span>}
        </div>
      ))}
    </div>
  );
};

export default ContactPointDisplay;

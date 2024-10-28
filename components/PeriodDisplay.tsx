import React from 'react';
import { CalendarIcon } from 'lucide-react';

interface PeriodDisplayProps {
  start?: string;
  end?: string;
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'Not specified';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });
};

const PeriodDisplay: React.FC<PeriodDisplayProps> = ({ start, end }) => {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center">
        <CalendarIcon className="mr-2 h-4 w-4" />
        <span className="font-semibold">Start:</span>
        <span className="ml-2">{formatDate(start)}</span>
      </div>
      <div className="flex items-center">
        <CalendarIcon className="mr-2 h-4 w-4" />
        <span className="font-semibold">End:</span>
        <span className="ml-2">{formatDate(end)}</span>
      </div>
    </div>
  );
};

export default PeriodDisplay;

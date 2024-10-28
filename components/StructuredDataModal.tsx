import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from 'lucide-react';

interface StructuredDataModalProps {
  content: string | object;
  fieldName: string;
}

const StructuredDataModal: React.FC<StructuredDataModalProps> = ({ content, fieldName }) => {
  const [prettyContent, setPrettyContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (typeof content === 'string') {
      try {
        // Try to parse as JSON first
        const parsed = JSON.parse(content);
        setPrettyContent(JSON.stringify(parsed, null, 2));
      } catch {
        // If it's not JSON, assume it's XML and just prettify it
        setPrettyContent(content.replace(/></g, '>\n<'));
      }
    } else if (typeof content === 'object') {
      setPrettyContent(JSON.stringify(content, null, 2));
    } else {
      setPrettyContent(String(content));
    }
  }, [content]);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link">View {fieldName} Content</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{fieldName} Content</DialogTitle>
        </DialogHeader>
        <div className="mt-4 flex-grow flex flex-col overflow-hidden">
          <Button onClick={toggleExpand} className="mb-2 self-start">
            {isExpanded ? <ChevronUp className="mr-2" /> : <ChevronDown className="mr-2" />}
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
          <div className={`border p-4 rounded-md flex-grow ${isExpanded ? 'overflow-y-auto' : 'max-h-40 overflow-hidden'}`}>
            <pre className="whitespace-pre-wrap">{prettyContent}</pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StructuredDataModal;

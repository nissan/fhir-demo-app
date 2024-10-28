import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { parseString } from 'xml2js';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface XmlModalProps {
  xmlContent: string;
  fieldName: string;
}

declare module 'xml2js';

const XmlModal: React.FC<XmlModalProps> = ({ xmlContent, fieldName }) => {
  const [prettyXml, setPrettyXml] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    parseString(xmlContent, { explicitArray: false }, (err: Error | null, result: any) => {
      if (err) {
        console.error('Error parsing XML:', err);
        setPrettyXml('Error parsing XML');
      } else {
        setPrettyXml(JSON.stringify(result, null, 2));
      }
    });
  }, [xmlContent]);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link">View {fieldName} XML</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{fieldName} XML Content</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Button onClick={toggleExpand} className="mb-2">
            {isExpanded ? <ChevronUp className="mr-2" /> : <ChevronDown className="mr-2" />}
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
          <div className={`border p-4 rounded-md ${isExpanded ? '' : 'max-h-40 overflow-hidden'}`}>
            <pre className="whitespace-pre-wrap">{prettyXml}</pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default XmlModal;

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface HtmlModalProps {
  htmlContent: string;
  fieldName: string;
}

const HtmlModal: React.FC<HtmlModalProps> = ({ htmlContent, fieldName }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link">View {fieldName} HTML</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{fieldName} HTML Content</DialogTitle>
        </DialogHeader>
        <div className="mt-4 border p-4 rounded-md">
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HtmlModal;

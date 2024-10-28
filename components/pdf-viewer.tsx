"use client"

import * as React from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { toolbarPlugin } from '@react-pdf-viewer/toolbar';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/toolbar/lib/styles/index.css';

interface PDFViewerProps {
  fileUrl: string;
}

const PdfViewer: React.FC<PDFViewerProps> = ({ fileUrl }) => {
  const toolbarPluginInstance = toolbarPlugin();
  const { Toolbar } = toolbarPluginInstance;

  return (
    <div
      className="rpv-core__viewer"
      style={{
          border: '1px solid rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
      }}
    >
      <div
        style={{
            alignItems: 'center',
            backgroundColor: '#eeeeee',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            padding: '4px',
        }}
      >
        <Toolbar />
      </div>
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
        <div className="flex-1 overflow-hidden " >
          <Viewer
            fileUrl={fileUrl}
            plugins={[toolbarPluginInstance]}
          />
        </div>
      </Worker>
    </div>
  );
};

export default PdfViewer;
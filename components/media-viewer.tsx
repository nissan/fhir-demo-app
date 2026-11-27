import dynamic from 'next/dynamic';
import Image from 'next/image'

// pdfjs only runs in the browser; loading the viewer on demand keeps it out of the server bundle.
const PDFViewer = dynamic(() => import("@/components/pdf-viewer"), {
    ssr: false,
    loading: () => <p>Loading PDF viewer...</p>,
});

interface MediaViewerProps {
    contentType: string;
    base64Data: string;
}

const MediaViewer: React.FC<MediaViewerProps> = ( {contentType,  base64Data}) => {

    if (contentType.slice(0, 5) == "image") {
        return (
        <Image
            src={`data:${contentType};base64,${base64Data}`}
            alt="Patient's photo"
            width={500}
            height={500}
        />
        );
    } else if (contentType.slice(-3) == "pdf") {
        return <div className='h-[550px] w-[70vw]'><PDFViewer fileUrl={`data:application/pdf;base64,${base64Data}`} /></div>
    } else{
        return <p>Unsupported file format.</p>;
    }

}

export default MediaViewer;

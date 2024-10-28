import { useEffect, useRef } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import Image from 'next/image'
import PDFViewer from "@/components/pdf-viewer";

interface MediaModalProps {
    openModal: boolean;
    closeModal: () => void;
    contentType: string;
    base64Data: string;
}

const renderMediaContent = (contentType: string, base64Data: string) => {
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
    return <PDFViewer fileUrl={`data:application/pdf;base64,${base64Data}`} />;
  } else{
      return <p>Unsupported file format.</p>;
  }
}

const MediaModal: React.FC<MediaModalProps> = ( {openModal, closeModal, contentType,  base64Data}) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (openModal) {
      ref.current?.showModal();
    } else {
      ref.current?.close();
    }
  }, [openModal]);

  return (
    <dialog ref={ref} onCancel={closeModal} className=" rounded-md">
        <button className="absolute right-2.5 top-2.5 inline-flex size-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px]"
        onClick={closeModal}> 
            <Cross2Icon /> 
        </button>
        <div className="p-[40px]">
          {renderMediaContent(contentType, base64Data)}
        </div>
    </dialog>
  );
}

export default MediaModal;

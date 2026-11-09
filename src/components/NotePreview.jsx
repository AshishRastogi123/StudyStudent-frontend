import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { notesApi, errorMessage } from "../services/api";
import { ErrorState, LoadingState, Modal } from "./ui";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

export default function NotePreview({ note, open, onOpenChange }) {
  const [fileUrl, setFileUrl] = useState("");
  const [error, setError] = useState("");
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    if (!open || !note?._id) return undefined;
    let active = true;
    setError("");
    setFileUrl("");
    notesApi.download(note._id).then(({ data }) => {
      if (active) setFileUrl(data.signedUrl || "");
      if (active && !data.signedUrl) setError("This file is stored locally and does not have a browser-accessible preview URL.");
    }).catch((err) => {
      if (active) setError(errorMessage(err));
    });
    return () => { active = false; };
  }, [open, note?._id]);

  const isPdf = String(note?.mimeType || "").toLowerCase().includes("pdf") || note?.fileName?.toLowerCase().endsWith(".pdf");
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={note?.title || "Note preview"} description={note?.fileName}>
      <div className="preview-frame">
        {error ? <ErrorState message={error} /> : !fileUrl ? <LoadingState label="Preparing secure preview..." /> : isPdf ? (
          <Document file={fileUrl} onLoadSuccess={({ numPages }) => setPageCount(numPages)} loading={<LoadingState label="Loading PDF..." />} error={<ErrorState message="The PDF could not be displayed." />}>
            {Array.from({ length: pageCount }, (_, index) => <Page key={index} pageNumber={index + 1} width={Math.min(window.innerWidth - 80, 760)} />)}
          </Document>
        ) : <iframe title={note?.title || "Note preview"} src={fileUrl} className="preview-iframe" />}
      </div>
    </Modal>
  );
}

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/build/pdf';

// Configure the worker so pdfjs-dist can render documents in the browser.
GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export { getDocument };

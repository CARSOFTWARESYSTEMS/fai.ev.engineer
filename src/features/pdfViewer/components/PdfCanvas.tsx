import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import type { PageNaturalSize, PdfRotation } from '../types/pdfViewerTypes'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

interface PdfCanvasProps {
  pdfBlobUrl: string
  currentPage: number
  scale: number
  rotation: PdfRotation
  onDocumentLoad: (numPages: number) => void
  onPageLoad: (size: PageNaturalSize) => void
  onDocumentError: (error: Error) => void
  // Optional overlay rendered on top of the page (e.g. balloon layer).
  // Placed inside a `relative inline-block` wrapper that matches the page dimensions.
  overlay?: React.ReactNode
}

export function PdfCanvas({
  pdfBlobUrl,
  currentPage,
  scale,
  rotation,
  onDocumentLoad,
  onPageLoad,
  onDocumentError,
  overlay,
}: PdfCanvasProps) {
  return (
    <div className="flex justify-center py-6 px-4 min-h-full min-w-max">
      <Document
        file={pdfBlobUrl}
        onLoadSuccess={(doc) => onDocumentLoad(doc.numPages)}
        onLoadError={onDocumentError}
        loading={
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
        error={
          <div className="text-center py-24">
            <p className="text-sm text-gray-400">Failed to render PDF.</p>
          </div>
        }
      >
        {/* inline-block so the wrapper sizes to the Page's pixel dimensions,
            enabling the balloon overlay to sit precisely over the page */}
        <div className="relative inline-block">
          <Page
            pageNumber={currentPage}
            scale={scale}
            rotate={rotation}
            onLoadSuccess={(page) => {
              if (page.originalWidth && page.originalHeight) {
                onPageLoad({ width: page.originalWidth, height: page.originalHeight })
              }
            }}
            loading={
              <div
                className="flex items-center justify-center bg-white"
                style={{ width: Math.round(595 * scale), height: Math.round(842 * scale) }}
              >
                <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            }
            className="shadow-2xl"
          />
          {overlay}
        </div>
      </Document>
    </div>
  )
}

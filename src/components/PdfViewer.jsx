import { useCallback, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { getDocument } from '../utils/pdf';

const PdfViewer = ({
  documentBuffer,
  pages,
  fields,
  zoom,
  selectedFieldId,
  hoveredFieldId,
  onHoverField,
  onSelectField,
}) => {
  const canvasRefs = useRef({});
  const pdfInstance = useRef(null);
  const zoomRef = useRef(zoom);
  const pagesRef = useRef(pages);

  const groupedFields = useMemo(() => {
    const acc = {};
    fields.forEach((field) => {
      if (!acc[field.pageIndex]) {
        acc[field.pageIndex] = [];
      }
      acc[field.pageIndex].push(field);
    });
    return acc;
  }, [fields]);

  const renderPages = useCallback(async (pdf, scale, pageMetas) => {
    const targets = pageMetas || pagesRef.current || [];
    await Promise.all(
      targets.map(async (pageMeta) => {
        const page = await pdf.getPage(pageMeta.index + 1);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRefs.current[pageMeta.index];
        if (!canvas) {
          return;
        }
        const context = canvas.getContext('2d');

        // Set canvas internal dimensions to match the viewport
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render the PDF page
        await page.render({ canvasContext: context, viewport }).promise;
      }),
    );
  }, []);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  useEffect(() => {
    if (!documentBuffer) {
      return undefined;
    }

    let cancelled = false;
    const loadingTask = getDocument({ data: documentBuffer });
    loadingTask.promise
      .then((pdf) => {
        if (cancelled) {
          pdf.destroy();
          return;
        }
        pdfInstance.current = pdf;
        renderPages(pdf, zoomRef.current, pagesRef.current);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to render PDF', err);
      });

    return () => {
      cancelled = true;
      loadingTask.destroy();
      if (pdfInstance.current) {
        pdfInstance.current.destroy();
        pdfInstance.current = null;
      }
    };
  }, [documentBuffer, renderPages]);

  useEffect(() => {
    if (pdfInstance.current) {
      renderPages(pdfInstance.current, zoom, pages);
    }
  }, [zoom, pages, renderPages]);

  if (!documentBuffer || pages.length === 0) {
    return (
      <div className="pdf-viewer pdf-viewer--empty">
        Select a PDF with form fields to see a live preview.
      </div>
    );
  }

  return (
    <div className="pdf-viewer">
      {pages.map((page) => {
        const displayWidth = page.width * zoom;
        const displayHeight = page.height * zoom;

        return (
          <div
            key={page.index}
            className="pdf-page"
            style={{
              width: displayWidth,
              height: displayHeight,
            }}
          >
            <canvas
              ref={(el) => {
                if (el) {
                  canvasRefs.current[page.index] = el;
                }
              }}
              style={{
                width: '100%',
                height: '100%',
                display: 'block'
              }}
            />
            <div className="field-overlay-layer">
              {(groupedFields[page.index] || []).map((field) => {
                const isSelected = selectedFieldId === field.id;
                const isHovered = hoveredFieldId === field.id;
                return (
                  <button
                    key={field.id}
                    type="button"
                    className={`field-overlay${
                      isSelected ? ' field-overlay--selected' : ''
                    }${isHovered ? ' field-overlay--hovered' : ''}`}
                    style={{
                      left: field.rect.x * zoom,
                      top: field.rect.y * zoom,
                      width: field.rect.width * zoom,
                      height: field.rect.height * zoom,
                    }}
                    onMouseEnter={() => onHoverField(field.id)}
                    onMouseLeave={() => onHoverField(null)}
                    onClick={() => onSelectField(field.id)}
                  >
                    <span className="field-overlay__label">{field.name}</span>
                    {field.value ? (
                      <span className="field-overlay__value">{field.value}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

PdfViewer.propTypes = {
  documentBuffer: PropTypes.instanceOf(Uint8Array),
  pages: PropTypes.arrayOf(
    PropTypes.shape({
      index: PropTypes.number.isRequired,
      width: PropTypes.number.isRequired,
      height: PropTypes.number.isRequired,
    }),
  ).isRequired,
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      pageIndex: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string,
      value: PropTypes.string,
      rect: PropTypes.shape({
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
      }).isRequired,
    }),
  ).isRequired,
  zoom: PropTypes.number.isRequired,
  selectedFieldId: PropTypes.string,
  hoveredFieldId: PropTypes.string,
  onHoverField: PropTypes.func.isRequired,
  onSelectField: PropTypes.func.isRequired,
};

PdfViewer.defaultProps = {
  documentBuffer: null,
  selectedFieldId: null,
  hoveredFieldId: null,
};

export default PdfViewer;

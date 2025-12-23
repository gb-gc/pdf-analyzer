import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FieldList from './components/FieldList';
import PdfViewer from './components/PdfViewer';
import { parsePdfFields } from './utils/pdfFieldParser';
import './App.css';

function App() {
  const [documentName, setDocumentName] = useState('');
  const [documentBuffer, setDocumentBuffer] = useState(null);
  const [pages, setPages] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [hoveredFieldId, setHoveredFieldId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');
  const fileInputRef = useRef(null);
  const copyTimeoutRef = useRef(null);

  const filteredFields = useMemo(() => {
    if (!search.trim()) {
      return fields;
    }
    const text = search.toLowerCase();
    return fields.filter(
      (field) =>
        field.name.toLowerCase().includes(text) ||
        (field.value || '').toLowerCase().includes(text) ||
        (field.type || '').toLowerCase().includes(text),
    );
  }, [fields, search]);

  const loadPdf = useCallback(async (buffer, name) => {
    const parsed = await parsePdfFields(buffer);
    setPages(parsed.pages);
    setFields(parsed.fields);
    setDocumentBuffer(buffer);
    setDocumentName(name);
    setSelectedFieldId(null);
    setHoveredFieldId(null);
    setZoom(1);
  }, []);

  const handleFileSelection = useCallback(
    async (file) => {
      if (!file) {
        return;
      }
      if (
        file.type &&
        file.type !== 'application/pdf' &&
        !file.name.toLowerCase().endsWith('.pdf')
      ) {
        setError('Please upload a PDF file.');
        return;
      }

      try {
        setLoading(true);
        setError('');
        const buffer = await file.arrayBuffer();
        await loadPdf(new Uint8Array(buffer), file.name);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to read PDF', err);
        setError('Could not read the PDF file.');
      } finally {
        setLoading(false);
      }
    },
    [loadPdf],
  );

  const handleInputChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      handleFileSelection(file);
      event.target.value = '';
    },
    [handleFileSelection],
  );

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      setIsDragOver(false);
      const file = event.dataTransfer.files?.[0];
      handleFileSelection(file);
    },
    [handleFileSelection],
  );

  const handleSampleLoad = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${process.env.PUBLIC_URL}/sample.pdf`);
      if (!response.ok) {
        throw new Error('Sample missing');
      }
      const buffer = await response.arrayBuffer();
      await loadPdf(new Uint8Array(buffer), 'sample.pdf');
    } catch (err) {
      setError(
        'Could not load sample.pdf. Place a sample PDF with form fields in the public folder.',
      );
    } finally {
      setLoading(false);
    }
  }, [loadPdf]);

  const handleEditField = useCallback((fieldId, patch) => {
    setFields((current) =>
      current.map((field) =>
        field.id === fieldId ? { ...field, ...patch, edited: true } : field,
      ),
    );
  }, []);

  const handleExport = useCallback(
    (format) => {
      if (!fields.length) {
        return;
      }

      let content = '';
      let mimeType = 'text/plain';
      let fileName = 'fields';

      if (format === 'json') {
        content = JSON.stringify(fields, null, 2);
        mimeType = 'application/json';
        fileName += '.json';
      } else if (format === 'csv') {
        const header = [
          'id',
          'page',
          'label',
          'type',
          'value',
          'x',
          'y',
          'width',
          'height',
        ];
        const rows = fields.map((field) =>
          [
            field.id,
            field.pageIndex + 1,
            field.name.replace(/"/g, '""'),
            field.type,
            (field.value || '').replace(/"/g, '""'),
            field.rect.x.toFixed(2),
            field.rect.y.toFixed(2),
            field.rect.width.toFixed(2),
            field.rect.height.toFixed(2),
          ]
            .map((cell) => `"${cell}"`)
            .join(','),
        );
        content = [header.join(','), ...rows].join('\n');
        mimeType = 'text/csv';
        fileName += '.csv';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    },
    [fields],
  );

  const handleSelectField = useCallback(
    (fieldId) => {
      setSelectedFieldId(fieldId);
      const field = fields.find((entry) => entry.id === fieldId);
      if (field?.name) {
        const showMessage = (message) => {
          setCopyFeedback(message);
          if (copyTimeoutRef.current) {
            clearTimeout(copyTimeoutRef.current);
          }
          copyTimeoutRef.current = setTimeout(() => setCopyFeedback(''), 1500);
        };

        if (typeof navigator === 'undefined') {
          showMessage('Clipboard not supported in this environment');
        } else if (navigator.clipboard?.writeText) {
          navigator.clipboard
            .writeText(field.name)
            .then(() => {
              showMessage(`Copied "${field.name}" to clipboard`);
            })
            .catch(() => {
              showMessage('Unable to copy field name');
            });
        } else {
          showMessage('Clipboard not supported in this browser');
        }
      }
    },
    [fields],
  );

  const handleZoomChange = (event) => {
    setZoom(parseFloat(event.target.value));
  };

  useEffect(
    () => () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    },
    [],
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>PDF Field Visualizer</h1>
          <p>Upload a fillable PDF to inspect, edit, and export its fields.</p>
        </div>
        <div className="app-header__actions">
          <button type="button" onClick={() => fileInputRef.current?.click()}>
            Select PDF
          </button>
          <button type="button" onClick={handleSampleLoad}>
            Load sample
          </button>
        </div>
      </header>

      <section
        className={`upload-panel${isDragOver ? ' upload-panel--drag' : ''}`}
        onDrop={handleDrop}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragOver(false);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleInputChange}
          hidden
        />
        {loading ? (
          <p>Processing PDF...</p>
        ) : (
          <p>
            Drag & drop a PDF here or click &ldquo;Select PDF&rdquo; to browse a
            file. Example: <code>~/Downloads/i-485.pdf</code>
          </p>
        )}
        {error ? <p className="upload-panel__error">{error}</p> : null}
      </section>

      <section className="content">
        <FieldList
          fields={filteredFields}
          search={search}
          hasAnyFields={fields.length > 0}
          onSearchChange={setSearch}
          selectedFieldId={selectedFieldId}
          hoveredFieldId={hoveredFieldId}
          onSelectField={handleSelectField}
          onHoverField={setHoveredFieldId}
          onEditField={handleEditField}
          onExportJson={() => handleExport('json')}
          onExportCsv={() => handleExport('csv')}
        />
        <div className="viewer-panel">
          <div className="viewer-toolbar">
            <div>
              <strong>{documentName || 'No PDF loaded'}</strong>
              {pages.length ? (
                <span className="viewer-toolbar__meta">
                  {pages.length} page{pages.length > 1 ? 's' : ''} -{' '}
                  {fields.length} field{fields.length === 1 ? '' : 's'}
                </span>
              ) : null}
            </div>
            <label className="zoom-control" htmlFor="zoom">
              Zoom
              <input
                id="zoom"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={zoom}
                onChange={handleZoomChange}
              />
              <span>{Math.round(zoom * 100)}%</span>
            </label>
          </div>
          {copyFeedback ? (
            <div className="copy-feedback" role="status">
              {copyFeedback}
            </div>
          ) : null}
          <PdfViewer
            documentBuffer={documentBuffer}
            pages={pages}
            fields={fields}
            zoom={zoom}
            selectedFieldId={selectedFieldId}
            hoveredFieldId={hoveredFieldId}
            onHoverField={setHoveredFieldId}
            onSelectField={handleSelectField}
          />
        </div>
      </section>
    </div>
  );
}

export default App;

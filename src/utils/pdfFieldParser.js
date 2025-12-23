import { getDocument } from './pdf';

const toFlatRect = (rect) => {
  if (Array.isArray(rect[0])) {
    return [rect[0][0], rect[0][1], rect[1][0], rect[1][1]];
  }
  return rect;
};

const normalizeRect = (rect) => {
  const flatRect = toFlatRect(rect);
  return {
    x: Math.min(flatRect[0], flatRect[2]),
    y: Math.min(flatRect[1], flatRect[3]),
    width: Math.abs(flatRect[2] - flatRect[0]),
    height: Math.abs(flatRect[3] - flatRect[1]),
  };
};

export const parsePdfFields = async (dataBuffer) => {
  const loadingTask = getDocument({ data: dataBuffer });
  const pdf = await loadingTask.promise;

  const pages = [];
  const fields = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });

    pages.push({
      index: pageNum - 1,
      width: viewport.width,
      height: viewport.height,
    });

    const annotations = await page.getAnnotations();
    annotations.forEach((annotation, idx) => {
      if (annotation.subtype !== 'Widget') {
        return;
      }

      const rect = normalizeRect(
        viewport.convertToViewportRectangle(annotation.rect),
      );

      fields.push({
        id: `${pageNum}-${annotation.id || idx}`,
        pageIndex: pageNum - 1,
        name: annotation.fieldName || 'Untitled field',
        type: annotation.fieldType || 'text',
        value: annotation.fieldValue || '',
        rect,
      });
    });
  }

  await pdf.cleanup();
  loadingTask.destroy();

  return { pages, fields };
};

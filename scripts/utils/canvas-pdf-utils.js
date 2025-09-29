/**
 * Canvas to PDF utility functions
 * Converts HTML5 canvas elements to PDF files with optimal sizing and quality
 */

// Global jsPDF loader - ensures jsPDF is loaded only once
let jsPDFPromise = null;

async function loadJsPDF() {
  if (jsPDFPromise) {
    return jsPDFPromise;
  }

  if (window.jspdf && window.jspdf.jsPDF) {
    return window.jspdf.jsPDF;
  }

  jsPDFPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/scripts/jspdf/jspdf.umd.min.js';

    script.onload = () => {
      if (window.jspdf && window.jspdf.jsPDF) {
        resolve(window.jspdf.jsPDF);
      } else {
        reject(new Error('jsPDF failed to load properly'));
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load jsPDF from local file'));
    };

    document.head.appendChild(script);
  });

  return jsPDFPromise;
}

/**
 * Converts a canvas element to PDF file with automatic sizing and scaling
 * @param {HTMLCanvasElement} canvas - The canvas element to convert
 * @param {Object} options - PDF generation options
 * @param {string} options.title - Title of the PDF document (default: 'Canvas Export')
 * @param {string} options.author - Author of the PDF document (default: 'Experience League')
 * @param {string} options.subject - Subject of the PDF document (default: 'Certificate of Completion')
 * @param {number} options.scale - Scale factor for the canvas (default: 1)
 * @returns {Promise<Blob>} PDF file as a Blob
 */
export async function canvasToPDF(canvas, options = {}) {
  const {
    title = 'Canvas Export',
    author = 'Experience League',
    subject = 'Certificate of Completion',
    scale = 1,
  } = options;

  const jsPDF = await loadJsPDF();

  const padding = 40;
  const canvasAspectRatio = canvas.width / canvas.height;

  let pdfWidth;
  let pdfHeight;

  if (canvasAspectRatio > 1) {
    pdfWidth = Math.min(842, canvas.width * scale + padding * 2);
    pdfHeight = Math.min(595, canvas.height * scale + padding * 2);
  } else {
    pdfWidth = Math.min(595, canvas.width * scale + padding * 2);
    pdfHeight = Math.min(842, canvas.height * scale + padding * 2);
  }

  pdfWidth = Math.max(pdfWidth, 400);
  pdfHeight = Math.max(pdfHeight, 300);

  const maxCanvasWidth = pdfWidth - padding * 2;
  const maxCanvasHeight = pdfHeight - padding * 2;

  const scaleX = maxCanvasWidth / canvas.width;
  const scaleY = maxCanvasHeight / canvas.height;
  const finalScale = Math.min(scaleX, scaleY, scale);

  const scaledWidth = canvas.width * finalScale;
  const scaledHeight = canvas.height * finalScale;

  const x = (pdfWidth - scaledWidth) / 2;
  const y = (pdfHeight - scaledHeight) / 2;

  /* eslint-disable-next-line new-cap */
  const pdf = new jsPDF({
    orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
    unit: 'px',
    format: [pdfWidth, pdfHeight],
  });

  pdf.setProperties({ title, author, subject });

  const imgData = canvas.toDataURL('image/png', 1.0);
  pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);

  return pdf.output('blob');
}

/**
 * Downloads a canvas as PDF file with automatic filename generation
 * @param {HTMLCanvasElement} canvas - The canvas element to download
 * @param {Object} options - Download options
 * @param {string} options.filename - Name of the PDF file (default: 'canvas.pdf')
 * @param {string} options.title - Title of the PDF document
 * @param {string} options.author - Author of the PDF document
 * @param {string} options.subject - Subject of the PDF document
 * @param {number} options.scale - Scale factor for the canvas (default: 1)
 */
export async function downloadCanvasAsPDF(canvas, options = {}) {
  const { filename = 'canvas.pdf', ...pdfOptions } = options;

  try {
    const pdfBlob = await canvasToPDF(canvas, pdfOptions);

    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF from canvas');
  }
}

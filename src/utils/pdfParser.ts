import * as pdfjsLib from 'pdfjs-dist';
import Papa from 'papaparse';
import { detectTableStructure } from './tableDetection';
import { processRows } from './rowProcessing';
import { cleanupTableData } from './dataCleanup';
import { PdfParserError } from './errors';
import { TextItem } from './types';

// Set worker path using CDN
const workerUrl = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export async function parsePdfToCSV(file: File): Promise<string> {
  if (!file || !(file instanceof File)) {
    throw new PdfParserError('Invalid file provided');
  }

  if (!file.type.includes('pdf')) {
    throw new PdfParserError('File must be a PDF document');
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await loadPdfDocument(arrayBuffer);
    const rows = await extractPdfContent(pdf);
    
    if (rows.length === 0) {
      throw new PdfParserError('No table data found in the PDF');
    }
    
    return convertToCSV(rows);
  } catch (error) {
    console.error('PDF parsing error:', error);
    if (error instanceof PdfParserError) {
      throw error;
    }
    throw new PdfParserError('Failed to process PDF');
  }
}

async function loadPdfDocument(arrayBuffer: ArrayBuffer) {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false
    });

    return await loadingTask.promise;
  } catch (error) {
    console.error('PDF loading error:', error);
    throw new PdfParserError('Failed to load PDF');
  }
}

async function extractPdfContent(pdf: pdfjsLib.PDFDocumentProxy): Promise<string[][]> {
  const allRows: string[][] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      
      const rowMap = detectTableStructure(content.items as TextItem[]);
      const pageRows = processRows(rowMap);
      
      if (pageRows.length > 0) {
        allRows.push(...pageRows);
      }
    } catch (error) {
      console.warn(`Warning: Failed to process page ${i}`, error);
      continue;
    }
  }

  return cleanupTableData(allRows);
}

function convertToCSV(rows: string[][]): string {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new PdfParserError('No data to convert to CSV');
  }

  try {
    return Papa.unparse(rows, {
      delimiter: ',',
      quotes: true,
      skipEmptyLines: true
    });
  } catch (error) {
    throw new PdfParserError('Failed to convert data to CSV format');
  }
}
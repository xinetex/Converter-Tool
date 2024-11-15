import React, { useState } from 'react';
import { FileUploader } from './components/FileUploader';
import { ConversionStatus } from './components/ConversionStatus';
import { parsePdfToCSV } from './utils/pdfParser';
import { PdfParserError } from './utils/errors';

function App() {
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    try {
      setIsConverting(true);
      setError(null);
      const csvContent = await parsePdfToCSV(file);
      downloadCSV(csvContent, file.name);
    } catch (err) {
      const errorMessage = err instanceof PdfParserError
        ? err.message
        : 'Error converting PDF to CSV. Please try again.';
      setError(errorMessage);
      console.error('Conversion error:', err);
    } finally {
      setIsConverting(false);
    }
  };

  const downloadCSV = (content: string, fileName: string) => {
    try {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName.replace(/\.pdf$/i, '')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download the CSV file. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            PDF to CSV Converter
          </h1>
          <p className="text-gray-600">
            Upload a PDF file to convert it into a CSV format
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <FileUploader onFileSelect={handleFileSelect} />
          <ConversionStatus isConverting={isConverting} error={error} />
        </div>
      </div>
    </div>
  );
}

export default App;
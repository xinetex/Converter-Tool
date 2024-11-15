import React from 'react';

interface ConversionStatusProps {
  isConverting: boolean;
  error: string | null;
}

export function ConversionStatus({ isConverting, error }: ConversionStatusProps) {
  if (!isConverting && !error) return null;

  return (
    <div className="mt-4 text-center">
      {isConverting && (
        <div className="text-blue-600">
          Converting your PDF to CSV...
        </div>
      )}
      
      {error && (
        <div className="text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
export function cleanupTableData(rows: string[][]): string[][] {
  // Remove empty rows and normalize whitespace
  const cleanedRows = rows
    .filter(row => row.some(cell => cell.trim().length > 0))
    .map(row => row.map(cell => normalizeCell(cell)));

  // Try to detect and remove duplicate headers
  const uniqueRows = removeDuplicateHeaders(cleanedRows);

  // Remove rows that are likely page numbers or artifacts
  return uniqueRows.filter(row => !isArtifactRow(row));
}

function normalizeCell(cell: string): string {
  return cell
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[""]/g, '"') // Normalize quotes
    .replace(/['']/g, "'") // Normalize apostrophes
    .trim();
}

function removeDuplicateHeaders(rows: string[][]): string[][] {
  if (rows.length < 2) return rows;

  const result: string[][] = [rows[0]];
  const firstRowStr = JSON.stringify(rows[0].map(cell => cell.toLowerCase()));

  for (let i = 1; i < rows.length; i++) {
    const currentRowStr = JSON.stringify(rows[i].map(cell => cell.toLowerCase()));
    if (currentRowStr !== firstRowStr) {
      result.push(rows[i]);
    }
  }

  return result;
}

function isArtifactRow(row: string[]): boolean {
  // Check if the row is likely a page number or other artifact
  if (row.length === 1) {
    const content = row[0].trim();
    
    // Check for page numbers
    if (/^[0-9]+$/.test(content)) return true;
    
    // Check for common PDF artifacts
    const artifacts = ['page', 'of', 'continued', 'continued from previous page'];
    if (artifacts.includes(content.toLowerCase())) return true;
  }

  // Check if row contains only numbers or special characters
  const nonEmptyCells = row.filter(cell => cell.trim().length > 0);
  const allNumbers = nonEmptyCells.every(cell => /^[0-9.,\s-]+$/.test(cell));
  const allSpecialChars = nonEmptyCells.every(cell => /^[^a-zA-Z0-9]+$/.test(cell));

  return (allNumbers || allSpecialChars) && nonEmptyCells.length < 2;
}
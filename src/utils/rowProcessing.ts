import { TextItem } from './types';

export function processRows(rowMap: Map<number, TextItem[]>): string[][] {
  const allRows: string[][] = [];
  const sortedYPositions = Array.from(rowMap.keys()).sort((a, b) => b - a);
  const rowHeightThreshold = calculateRowHeightThreshold(sortedYPositions);

  let currentRow: TextItem[] = [];
  let currentY = 0;

  sortedYPositions.forEach((y, index) => {
    const rowItems = rowMap.get(y) || [];
    
    if (index === 0) {
      currentY = y;
      currentRow = [...rowItems];
    } else {
      // Check if this position belongs to the same row
      if (Math.abs(y - currentY) <= rowHeightThreshold) {
        // Merge items into current row
        mergeRowItems(currentRow, rowItems);
      } else {
        // Process and add the completed row
        if (currentRow.length > 0) {
          const processedRow = processRowItems(currentRow);
          if (processedRow.some(cell => cell.length > 0)) {
            allRows.push(processedRow);
          }
        }
        currentY = y;
        currentRow = [...rowItems];
      }
    }
  });

  // Process the last row
  if (currentRow.length > 0) {
    const processedRow = processRowItems(currentRow);
    if (processedRow.some(cell => cell.length > 0)) {
      allRows.push(processedRow);
    }
  }

  return allRows;
}

function calculateRowHeightThreshold(yPositions: number[]): number {
  if (yPositions.length < 2) return 5; // Default threshold

  const heights: number[] = [];
  for (let i = 1; i < yPositions.length; i++) {
    const height = Math.abs(yPositions[i] - yPositions[i - 1]);
    if (height > 0) heights.push(height);
  }

  if (heights.length === 0) return 5;

  // Calculate the median height
  heights.sort((a, b) => a - b);
  const medianHeight = heights[Math.floor(heights.length / 2)];
  
  // Return 1/3 of the median height as threshold
  return medianHeight / 3;
}

function mergeRowItems(currentRow: TextItem[], newItems: TextItem[]): void {
  newItems.forEach(newItem => {
    const existingItem = currentRow.find(item => 
      Math.abs(item.transform[4] - newItem.transform[4]) < 5
    );

    if (existingItem) {
      existingItem.str += ' ' + newItem.str;
    } else {
      currentRow.push(newItem);
    }
  });
}

function processRowItems(items: TextItem[]): string[] {
  // Sort items by x position
  items.sort((a, b) => a.transform[4] - b.transform[4]);
  
  // Convert items to strings and clean them
  return items.map(item => item.str.trim());
}
import { TextItem } from './types';

interface TableStructure {
  rows: Map<number, TextItem[]>;
  columnRanges: number[];
  headerStyle?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string | number;
  };
}

export function detectTableStructure(items: TextItem[]): Map<number, TextItem[]> {
  const { rows, columnRanges, headerStyle } = analyzeTableStructure(items);
  const normalizedRows = normalizeRows(rows, columnRanges);
  return markHeaders(normalizedRows, headerStyle);
}

function analyzeTableStructure(items: TextItem[]): TableStructure {
  const rows = new Map<number, TextItem[]>();
  const xPositions = new Set<number>();
  const fontStyles = new Map<string, number>();
  
  // First pass: collect items, positions, and analyze font styles
  items.forEach((item) => {
    const y = Math.round(item.transform[5]);
    const x = Math.round(item.transform[4]);
    
    if (!rows.has(y)) {
      rows.set(y, []);
    }
    rows.get(y)?.push(item);
    xPositions.add(x);

    // Track font style usage
    const styleKey = `${item.fontName}-${item.fontSize}-${item.fontWeight}`;
    fontStyles.set(styleKey, (fontStyles.get(styleKey) || 0) + 1);
  });

  // Detect likely header style (most used style in first row)
  const headerStyle = detectHeaderStyle(Array.from(rows.values())[0], fontStyles);

  const columnRanges = Array.from(xPositions)
    .sort((a, b) => a - b)
    .reduce((ranges: number[], x) => {
      const tolerance = 5;
      const lastRange = ranges[ranges.length - 1];
      
      if (!lastRange || Math.abs(x - lastRange) > tolerance) {
        ranges.push(x);
      }
      return ranges;
    }, []);

  return { rows, columnRanges, headerStyle };
}

function detectHeaderStyle(firstRow: TextItem[], fontStyles: Map<string, number>): TableStructure['headerStyle'] {
  if (!firstRow?.length) return undefined;

  // Find the most common style in the first row
  const styleCount = new Map<string, number>();
  firstRow.forEach(item => {
    const styleKey = `${item.fontName}-${item.fontSize}-${item.fontWeight}`;
    styleCount.set(styleKey, (styleCount.get(styleKey) || 0) + 1);
  });

  let mostUsedStyle: string | undefined;
  let maxCount = 0;

  styleCount.forEach((count, style) => {
    if (count > maxCount) {
      maxCount = count;
      mostUsedStyle = style;
    }
  });

  if (!mostUsedStyle) return undefined;

  const [fontFamily, fontSize, fontWeight] = mostUsedStyle.split('-');
  return {
    fontFamily,
    fontSize: Number(fontSize),
    fontWeight: Number(fontWeight) || fontWeight
  };
}

function markHeaders(rows: Map<number, TextItem[]>, headerStyle?: TableStructure['headerStyle']): Map<number, TextItem[]> {
  if (!headerStyle) return rows;

  const markedRows = new Map<number, TextItem[]>();
  let isFirstContentRow = true;

  rows.forEach((items, y) => {
    const markedItems = items.map(item => ({
      ...item,
      style: {
        ...item.style,
        fontFamily: item.fontName,
        fontSize: item.fontSize,
        fontWeight: item.fontWeight,
        isHeader: isFirstContentRow || isStyleMatch(item, headerStyle)
      }
    }));

    markedRows.set(y, markedItems);
    isFirstContentRow = false;
  });

  return markedRows;
}

function isStyleMatch(item: TextItem, headerStyle: TableStructure['headerStyle']): boolean {
  return (
    item.fontName === headerStyle.fontFamily &&
    item.fontSize === headerStyle.fontSize &&
    item.fontWeight?.toString() === headerStyle.fontWeight?.toString()
  );
}

function normalizeRows(rows: Map<number, TextItem[]>, columnRanges: number[]): Map<number, TextItem[]> {
  const normalizedRows = new Map<number, TextItem[]>();
  
  rows.forEach((items, y) => {
    const sortedItems = items.sort((a, b) => a.transform[4] - b.transform[4]);
    const mergedItems = mergeAdjacentItems(sortedItems);
    const alignedItems = alignItemsToColumns(mergedItems, columnRanges);
    
    if (alignedItems.length > 0) {
      normalizedRows.set(y, alignedItems);
    }
  });

  return normalizedRows;
}

function mergeAdjacentItems(items: TextItem[]): TextItem[] {
  const merged: TextItem[] = [];
  let currentItem: TextItem | null = null;

  items.forEach((item) => {
    if (!currentItem) {
      currentItem = { ...item };
    } else {
      const gap = Math.abs(
        (currentItem.transform[4] + currentItem.width) - item.transform[4]
      );
      
      if (gap < 5 && currentItem.fontName === item.fontName) {
        currentItem.str += ' ' + item.str;
        currentItem.width += gap + item.width;
      } else {
        merged.push(currentItem);
        currentItem = { ...item };
      }
    }
  });

  if (currentItem) {
    merged.push(currentItem);
  }

  return merged;
}

function alignItemsToColumns(items: TextItem[], columnRanges: number[]): TextItem[] {
  return items.map(item => {
    const x = item.transform[4];
    const closestColumn = columnRanges.reduce((closest, column) => {
      return Math.abs(x - column) < Math.abs(x - closest) ? column : closest;
    });
    
    return {
      ...item,
      transform: [...item.transform.slice(0, 4), closestColumn, item.transform[5]]
    };
  });
}
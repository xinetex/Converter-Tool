export interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  dir: string;
  fontName?: string;
  fontSize?: number;
  fontWeight?: number;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string | number;
    isHeader?: boolean;
  };
}
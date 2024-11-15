export class PdfParserError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'PdfParserError';
    
    if (originalError?.stack) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }
}
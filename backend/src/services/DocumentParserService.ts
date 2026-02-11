const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';

export class DocumentParserService {
    /**
     * Extract text from PDF file
     * Uses pdf-parse for Node.js compatibility
     */
    async extractTextFromPDF(fileBuffer: Buffer): Promise<string> {
        try {
            const data = await pdfParse(fileBuffer);
            return data.text.trim();
        } catch (error) {
            console.error('PDF extraction error:', error);
            throw new Error(`Failed to extract text from PDF: ${(error as Error).message}`);
        }
    }

    /**
     * Extract text from DOCX file
     * Uses mammoth for parsing
     */
    async extractTextFromDOCX(fileBuffer: Buffer): Promise<string> {
        try {
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            return result.value.trim();
        } catch (error) {
            console.error('DOCX extraction error:', error);
            throw new Error(`Failed to extract text from DOCX: ${(error as Error).message}`);
        }
    }

    /**
     * Auto-detect file type and extract text
     */
    async extractText(fileBuffer: Buffer, mimeType: string): Promise<string> {
        if (mimeType === 'application/pdf') {
            return this.extractTextFromPDF(fileBuffer);
        } else if (
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            mimeType === 'application/msword'
        ) {
            return this.extractTextFromDOCX(fileBuffer);
        } else {
            throw new Error(`Unsupported file type: ${mimeType}`);
        }
    }
}

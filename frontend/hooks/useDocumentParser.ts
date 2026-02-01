import { useState, useCallback } from 'react';
import mammoth from 'mammoth';
import type { DocumentContent, DocumentParserResult, PageContent } from '@/types/text-to-speech';

/**
 * Custom hook for parsing PDF and DOCX files
 * Extracts text content and metadata from uploaded documents
 */
export function useDocumentParser() {
    const [result, setResult] = useState<DocumentParserResult>({
        content: null as any,
        error: null,
        isLoading: false,
    });

    /**
     * Split text into sentences
     */
    const splitIntoSentences = (text: string): string[] => {
        // Split by sentence-ending punctuation followed by whitespace
        const sentences = text
            .split(/([.!?]+)\s+/)
            .reduce((acc: string[], curr, idx, arr) => {
                if (idx % 2 === 0) {
                    const sentence = curr + (arr[idx + 1] || '');
                    if (sentence.trim()) {
                        acc.push(sentence.trim());
                    }
                }
                return acc;
            }, []);

        return sentences.length > 0 ? sentences : [text];
    };

    /**
     * Parse PDF file using dynamic import (client-side only)
     */
    const parsePDF = async (file: File): Promise<DocumentContent> => {
        try {
            // Only import on client side
            if (typeof window === 'undefined') {
                throw new Error('PDF parsing is only available on the client side');
            }

            console.log('[useDocumentParser] Starting PDF import...');

            // Use require-style dynamic import for CommonJS compatibility
            const pdfjsLib = await import('pdfjs-dist');

            console.log('[useDocumentParser] PDF library loaded, version:', pdfjsLib.version);

            // Configure worker
            if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
                pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
                console.log('[useDocumentParser] Worker configured');
            }

            console.log('[useDocumentParser] Reading file arrayBuffer...');
            const arrayBuffer = await file.arrayBuffer();

            console.log('[useDocumentParser] Loading PDF document...');
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            const totalPages = pdf.numPages;

            console.log('[useDocumentParser] PDF loaded, total pages:', totalPages);

            const pages: PageContent[] = [];

            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                console.log(`[useDocumentParser] Processing page ${pageNum}/${totalPages}...`);
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();

                // Extract text from page
                const pageText = textContent.items
                    .map((item: any) => item.str)
                    .join(' ')
                    .replace(/\s+/g, ' ')
                    .trim();

                const sentences = splitIntoSentences(pageText);

                pages.push({
                    pageNumber: pageNum,
                    text: pageText,
                    sentences,
                });
            }

            console.log('[useDocumentParser] PDF parsing complete');

            return {
                type: 'pdf',
                fileName: file.name,
                fileSize: file.size,
                totalPages,
                currentPage: 1,
                pages,
            };
        } catch (error) {
            console.error('[useDocumentParser] PDF parsing error:', error);
            throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    /**
     * Parse DOCX file
     */
    const parseDOCX = async (file: File): Promise<DocumentContent> => {
        console.log('[useDocumentParser] Starting DOCX parsing...');
        const arrayBuffer = await file.arrayBuffer();

        // Extract raw text
        const textResult = await mammoth.extractRawText({ arrayBuffer });
        const fullText = textResult.value;

        // Extract HTML for rendering
        const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
        const htmlContent = htmlResult.value;

        // Split into pages (simulate pagination based on content length)
        const wordsPerPage = 500;
        const words = fullText.split(/\s+/);
        const pageCount = Math.max(1, Math.ceil(words.length / wordsPerPage));
        const pages: PageContent[] = [];

        for (let i = 0; i < pageCount; i++) {
            const startIdx = i * wordsPerPage;
            const endIdx = Math.min((i + 1) * wordsPerPage, words.length);
            const pageWords = words.slice(startIdx, endIdx);
            const pageText = pageWords.join(' ');
            const sentences = splitIntoSentences(pageText);

            pages.push({
                pageNumber: i + 1,
                text: pageText,
                sentences,
                htmlContent: i === 0 ? htmlContent : undefined,
            });
        }

        console.log('[useDocumentParser] DOCX parsing complete, pages:', pageCount);

        return {
            type: 'docx',
            fileName: file.name,
            fileSize: file.size,
            totalPages: pageCount,
            currentPage: 1,
            pages,
        };
    };

    /**
     * Parse uploaded file
     */
    const parseFile = useCallback(async (file: File) => {
        console.log('[useDocumentParser] parseFile called with:', file.name);

        setResult({
            content: null as any,
            error: null,
            isLoading: true,
        });

        try {
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            console.log('[useDocumentParser] File extension:', fileExtension);

            let content: DocumentContent;

            if (fileExtension === 'pdf') {
                content = await parsePDF(file);
            } else if (fileExtension === 'docx' || fileExtension === 'doc') {
                content = await parseDOCX(file);
            } else {
                throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
            }

            setResult({
                content,
                error: null,
                isLoading: false,
            });

            console.log('[useDocumentParser] File parsed successfully');
            return content;
        } catch (error) {
            console.error('[useDocumentParser] Parse error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to parse document';
            setResult({
                content: null as any,
                error: errorMessage,
                isLoading: false,
            });
            throw error;
        }
    }, []);

    /**
     * Reset parser state
     */
    const reset = useCallback(() => {
        setResult({
            content: null as any,
            error: null,
            isLoading: false,
        });
    }, []);

    return {
        ...result,
        parseFile,
        reset,
    };
}

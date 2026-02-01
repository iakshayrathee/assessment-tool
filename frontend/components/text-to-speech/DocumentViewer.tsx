'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DocumentContent, SearchResult } from '@/types/text-to-speech';

interface DocumentViewerProps {
    document: DocumentContent;
    currentPage: number;
    currentSentenceIndex: number;
    onPageChange: (page: number) => void;
    isPlaying: boolean;
    searchResults?: SearchResult[];
    currentSearchResultIndex?: number;
    onSentenceClick?: (sentenceIndex: number) => void;
}

/**
 * DocumentViewer Component
 * Renders PDF and DOCX documents with pagination, text highlighting, and clickable sentences
 */
export function DocumentViewer({
    document,
    currentPage,
    currentSentenceIndex,
    onPageChange,
    isPlaying,
    searchResults = [],
    currentSearchResultIndex = -1,
    onSentenceClick,
}: DocumentViewerProps) {
    const [pageInput, setPageInput] = useState(currentPage.toString());
    const containerRef = useRef<HTMLDivElement>(null);
    const highlightRef = useRef<HTMLSpanElement>(null);

    // Update page input when currentPage changes
    useEffect(() => {
        setPageInput(currentPage.toString());
    }, [currentPage]);

    // Scroll to highlighted sentence
    useEffect(() => {
        if (highlightRef.current && isPlaying) {
            highlightRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [currentSentenceIndex, isPlaying]);

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < document.totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPageInput(e.target.value);
    };

    const handlePageInputSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const pageNum = parseInt(pageInput, 10);
        if (pageNum >= 1 && pageNum <= document.totalPages) {
            onPageChange(pageNum);
        } else {
            setPageInput(currentPage.toString());
        }
    };

    const currentPageContent = document.pages[currentPage - 1];

    // Check if a sentence has search results
    const getSentenceSearchHighlight = (sentenceIndex: number) => {
        const results = searchResults.filter(
            (r) => r.pageNumber === currentPage && r.sentenceIndex === sentenceIndex
        );
        if (results.length === 0) return null;

        const isCurrentResult = searchResults[currentSearchResultIndex]?.pageNumber === currentPage &&
            searchResults[currentSearchResultIndex]?.sentenceIndex === sentenceIndex;

        return { results, isCurrentResult };
    };

    // Highlight search matches within a sentence
    const highlightSearchInSentence = (sentence: string, sentenceIndex: number) => {
        const searchHighlight = getSentenceSearchHighlight(sentenceIndex);
        if (!searchHighlight) return sentence;

        const { results, isCurrentResult } = searchHighlight;
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;

        // Sort results by match start position
        const sortedResults = [...results].sort((a, b) => a.matchStart - b.matchStart);

        sortedResults.forEach((result, idx) => {
            // Add text before match
            if (result.matchStart > lastIndex) {
                parts.push(sentence.substring(lastIndex, result.matchStart));
            }

            // Add highlighted match
            const matchText = sentence.substring(result.matchStart, result.matchEnd);
            parts.push(
                <mark
                    key={`match-${idx}`}
                    className={`${isCurrentResult && idx === 0
                            ? 'bg-orange-300 font-medium'
                            : 'bg-orange-100'
                        } px-0.5 rounded`}
                >
                    {matchText}
                </mark>
            );

            lastIndex = result.matchEnd;
        });

        // Add remaining text
        if (lastIndex < sentence.length) {
            parts.push(sentence.substring(lastIndex));
        }

        return <>{parts}</>;
    };

    // Render text with highlighting for DOCX or text-based view
    const renderTextWithHighlight = () => {
        if (!currentPageContent) return null;

        const sentences = currentPageContent.sentences;

        return (
            <div className="prose max-w-none p-6 bg-white rounded-lg border shadow-sm">
                {sentences.map((sentence, index) => {
                    const isHighlighted = isPlaying && index === currentSentenceIndex;
                    const hasSearchHighlight = getSentenceSearchHighlight(index);

                    return (
                        <span
                            key={index}
                            ref={isHighlighted ? highlightRef : null}
                            onClick={() => onSentenceClick?.(index)}
                            className={`transition-all duration-200 ${isHighlighted
                                    ? 'bg-yellow-200 font-medium px-1 rounded'
                                    : hasSearchHighlight
                                        ? 'cursor-pointer hover:bg-gray-100'
                                        : 'cursor-pointer hover:bg-gray-50'
                                }`}
                            title={onSentenceClick ? 'Click to jump to this sentence' : ''}
                        >
                            {highlightSearchInSentence(sentence, index)}{' '}
                        </span>
                    );
                })}
            </div>
        );
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                        {document.fileName}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <form onSubmit={handlePageInputSubmit} className="flex items-center space-x-2">
                            <Input
                                type="number"
                                min={1}
                                max={document.totalPages}
                                value={pageInput}
                                onChange={handlePageInputChange}
                                className="w-16 text-center"
                            />
                            <span className="text-sm text-gray-600">
                                / {document.totalPages}
                            </span>
                        </form>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextPage}
                            disabled={currentPage === document.totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-auto p-4" ref={containerRef}>
                <div className="max-w-4xl mx-auto">
                    {document.type === 'pdf' && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                📄 PDF Document - Page {currentPage} of {document.totalPages}
                            </p>
                        </div>
                    )}

                    {currentPageContent?.htmlContent ? (
                        // DOCX with HTML content
                        <div className="space-y-4">
                            <div
                                className="prose max-w-none p-6 bg-white rounded-lg border shadow-sm"
                                dangerouslySetInnerHTML={{ __html: currentPageContent.htmlContent }}
                            />
                            <div className="p-4 bg-gray-50 rounded-lg border">
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                    Text with Highlighting:
                                </p>
                                {renderTextWithHighlight()}
                            </div>
                        </div>
                    ) : (
                        // Text content with highlighting
                        renderTextWithHighlight()
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

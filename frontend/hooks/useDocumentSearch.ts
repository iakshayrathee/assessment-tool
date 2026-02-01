import { useState, useCallback } from 'react';
import type { DocumentContent, SearchResult, SearchState, DocumentSearchHookResult } from '@/types/text-to-speech';

/**
 * Custom hook for searching within a document
 * Provides search functionality across all pages and sentences
 */
export function useDocumentSearch(document: DocumentContent | null): DocumentSearchHookResult {
    const [searchState, setSearchState] = useState<SearchState>({
        query: '',
        results: [],
        currentResultIndex: -1,
        isSearching: false,
    });

    /**
     * Search for a query across all pages and sentences
     */
    const search = useCallback((query: string) => {
        if (!document || !query.trim()) {
            setSearchState({
                query: '',
                results: [],
                currentResultIndex: -1,
                isSearching: false,
            });
            return;
        }

        const normalizedQuery = query.toLowerCase().trim();
        const results: SearchResult[] = [];

        // Search through all pages and sentences
        document.pages.forEach((page) => {
            page.sentences.forEach((sentence, sentenceIndex) => {
                const normalizedSentence = sentence.toLowerCase();
                let searchIndex = 0;

                // Find all occurrences in the sentence
                while (searchIndex < normalizedSentence.length) {
                    const matchIndex = normalizedSentence.indexOf(normalizedQuery, searchIndex);
                    if (matchIndex === -1) break;

                    results.push({
                        pageNumber: page.pageNumber,
                        sentenceIndex,
                        matchedText: sentence,
                        matchStart: matchIndex,
                        matchEnd: matchIndex + normalizedQuery.length,
                    });

                    searchIndex = matchIndex + 1; // Move past this match to find next occurrence
                }
            });
        });

        setSearchState({
            query,
            results,
            currentResultIndex: results.length > 0 ? 0 : -1,
            isSearching: true,
        });
    }, [document]);

    /**
     * Clear search results
     */
    const clearSearch = useCallback(() => {
        setSearchState({
            query: '',
            results: [],
            currentResultIndex: -1,
            isSearching: false,
        });
    }, []);

    /**
     * Navigate to next search result
     */
    const nextResult = useCallback(() => {
        setSearchState((prev) => {
            if (prev.results.length === 0) return prev;
            const nextIndex = (prev.currentResultIndex + 1) % prev.results.length;
            return { ...prev, currentResultIndex: nextIndex };
        });
    }, []);

    /**
     * Navigate to previous search result
     */
    const previousResult = useCallback(() => {
        setSearchState((prev) => {
            if (prev.results.length === 0) return prev;
            const prevIndex = prev.currentResultIndex === 0
                ? prev.results.length - 1
                : prev.currentResultIndex - 1;
            return { ...prev, currentResultIndex: prevIndex };
        });
    }, []);

    /**
     * Jump to a specific search result
     */
    const jumpToResult = useCallback((index: number) => {
        setSearchState((prev) => {
            if (index < 0 || index >= prev.results.length) return prev;
            return { ...prev, currentResultIndex: index };
        });
    }, []);

    return {
        searchState,
        search,
        clearSearch,
        nextResult,
        previousResult,
        jumpToResult,
    };
}

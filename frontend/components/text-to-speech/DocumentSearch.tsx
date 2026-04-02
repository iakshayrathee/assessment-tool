'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SearchState } from '@/types/text-to-speech';

interface DocumentSearchProps {
    searchState: SearchState;
    onSearch: (query: string) => void;
    onClearSearch: () => void;
    onNextResult: () => void;
    onPreviousResult: () => void;
    onJumpToResult: (index: number) => void;
}

/**
 * DocumentSearch Component
 * Provides search functionality for the document with navigation between results
 */
export function DocumentSearch({
    searchState,
    onSearch,
    onClearSearch,
    onNextResult,
    onPreviousResult,
}: DocumentSearchProps) {
    const [searchInput, setSearchInput] = useState('');

    // Sync search input with search state
    useEffect(() => {
        setSearchInput(searchState.query);
    }, [searchState.query]);

    const handleSearch = useCallback(() => {
        if (searchInput.trim()) {
            onSearch(searchInput.trim());
        }
    }, [searchInput, onSearch]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    }, [handleSearch]);

    const handleClear = useCallback(() => {
        setSearchInput('');
        onClearSearch();
    }, [onClearSearch]);

    const hasResults = searchState.results.length > 0;
    const currentResult = searchState.currentResultIndex + 1;
    const totalResults = searchState.results.length;

    return (
        <Card>
            <CardHeader className="border-b pb-3">
                <CardTitle className="text-base flex items-center space-x-2">
                    <Search className="h-4 w-4" />
                    <span>Search Document</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
                {/* Search Input */}
                <div className="flex space-x-2">
                    <div className="relative flex-1">
                        <Input
                            type="text"
                            placeholder="Search for words or phrases..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="pr-8"
                        />
                        {searchInput && (
                            <button
                                onClick={handleClear}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <Button
                        onClick={handleSearch}
                        disabled={!searchInput.trim()}
                        size="sm"
                    >
                        <Search className="h-4 w-4" />
                    </Button>
                </div>

                {/* Search Results Info */}
                {searchState.isSearching && (
                    <div className="space-y-2">
                        {hasResults ? (
                            <>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        {currentResult} of {totalResults} results
                                    </span>
                                    <div className="flex space-x-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={onPreviousResult}
                                            disabled={totalResults === 0}
                                            className="h-7 w-7 p-0"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={onNextResult}
                                            disabled={totalResults === 0}
                                            className="h-7 w-7 p-0"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Click on highlighted text to jump to that location
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No results found for "{searchState.query}"
                            </p>
                        )}
                    </div>
                )}

                {/* Instructions */}
                {!searchState.isSearching && (
                    <p className="text-xs text-muted-foreground">
                        Search across all pages to find specific words or phrases
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

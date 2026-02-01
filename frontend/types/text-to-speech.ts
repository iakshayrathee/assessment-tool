/**
 * Type definitions for Text-to-Speech Document Reader
 */

export type DocumentType = 'pdf' | 'docx';

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'stopped';

export interface DocumentContent {
    type: DocumentType;
    fileName: string;
    fileSize: number;
    totalPages: number;
    currentPage: number;
    pages: PageContent[];
}

export interface PageContent {
    pageNumber: number;
    text: string;
    sentences: string[];
    htmlContent?: string; // For DOCX files
}

export interface TTSSettings {
    voice: SpeechSynthesisVoice | null;
    rate: number; // 0.5 to 2.0
    pitch: number; // 0 to 2
    volume: number; // 0 to 1
}

export interface SentenceInfo {
    text: string;
    index: number;
    pageNumber: number;
    startPosition: number;
    endPosition: number;
}

export interface TTSState {
    playbackState: PlaybackState;
    currentSentenceIndex: number;
    totalSentences: number;
    currentPage: number;
    settings: TTSSettings;
    availableVoices: SpeechSynthesisVoice[];
    indianEnglishVoices: SpeechSynthesisVoice[];
}

export interface DocumentParserResult {
    content: DocumentContent;
    error: string | null;
    isLoading: boolean;
}

export interface SpeechSynthesisHookResult {
    state: TTSState;
    play: () => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
    setVoice: (voice: SpeechSynthesisVoice) => void;
    setRate: (rate: number) => void;
    loadText: (sentences: string[], pageNumber: number) => void;
    jumpToPage: (pageNumber: number, sentences: string[]) => void;
    jumpToSentence: (pageNumber: number, sentenceIndex: number, sentences: string[]) => void;
}

// Search types
export interface SearchResult {
    pageNumber: number;
    sentenceIndex: number;
    matchedText: string;
    matchStart: number;
    matchEnd: number;
}

export interface SearchState {
    query: string;
    results: SearchResult[];
    currentResultIndex: number;
    isSearching: boolean;
}

export interface DocumentSearchHookResult {
    searchState: SearchState;
    search: (query: string) => void;
    clearSearch: () => void;
    nextResult: () => void;
    previousResult: () => void;
    jumpToResult: (index: number) => void;
}

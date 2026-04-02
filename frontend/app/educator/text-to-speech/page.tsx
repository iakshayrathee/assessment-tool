'use client';

import { useState, useEffect } from 'react';
import { FileText, BookOpen } from 'lucide-react';
import { FileUpload } from '@/components/text-to-speech/FileUpload';
import { DocumentViewer } from '@/components/text-to-speech/DocumentViewer';
import { TTSControls } from '@/components/text-to-speech/TTSControls';
import { DocumentSearch } from '@/components/text-to-speech/DocumentSearch';
import { useDocumentParser } from '@/hooks/useDocumentParser';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useDocumentSearch } from '@/hooks/useDocumentSearch';
import type { DocumentContent } from '@/types/text-to-speech';
import { PageWrapper } from '@/components/layout/PageWrapper';

/**
 * Text-to-Speech Document Reader Page
 * Main page component for the educator text-to-speech feature
 */
export default function TextToSpeechPage() {
    console.log('[TextToSpeechPage] Component rendering');

    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [document, setDocument] = useState<DocumentContent | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    console.log('[TextToSpeechPage] Calling useDocumentParser');
    const { parseFile, isLoading, error } = useDocumentParser();

    console.log('[TextToSpeechPage] Calling useSpeechSynthesis');
    const tts = useSpeechSynthesis();

    console.log('[TextToSpeechPage] Calling useDocumentSearch');
    const search = useDocumentSearch(document);

    console.log('[TextToSpeechPage] Hooks initialized, tts:', tts);

    /**
     * Handle file selection and parsing
     */
    const handleFileSelect = async (file: File) => {
        console.log('[TextToSpeechPage] handleFileSelect called with:', file.name);
        try {
            setUploadedFile(file);
            console.log('[TextToSpeechPage] Calling parseFile...');
            const parsedDocument = await parseFile(file);
            console.log('[TextToSpeechPage] Document parsed:', parsedDocument);
            setDocument(parsedDocument);
            setCurrentPage(1);

            // Load first page text into TTS
            if (parsedDocument.pages.length > 0) {
                const firstPage = parsedDocument.pages[0];
                console.log('[TextToSpeechPage] Loading TTS with first page');
                tts.loadText(firstPage.sentences, 1);
            }
        } catch (err) {
            console.error('[TextToSpeechPage] Error parsing file:', err);
        }
    };

    /**
     * Handle clearing the uploaded file
     */
    const handleClearFile = () => {
        setUploadedFile(null);
        setDocument(null);
        setCurrentPage(1);
        search.clearSearch();
        tts.stop();
    };

    /**
     * Handle page navigation
     */
    const handlePageChange = (newPage: number) => {
        if (!document) return;

        setCurrentPage(newPage);
        const pageContent = document.pages[newPage - 1];

        if (pageContent) {
            // Stop current playback and load new page
            tts.jumpToPage(newPage, pageContent.sentences);
        }
    };

    /**
     * Handle sentence click - jump to that sentence
     */
    const handleSentenceClick = (sentenceIndex: number) => {
        if (!document) return;

        const pageContent = document.pages[currentPage - 1];
        if (pageContent) {
            tts.jumpToSentence(currentPage, sentenceIndex, pageContent.sentences);
            // Auto-play after jumping
            setTimeout(() => tts.play(), 100);
        }
    };

    /**
     * Sync current page with TTS state
     */
    useEffect(() => {
        if (tts.state.currentPage !== currentPage) {
            setCurrentPage(tts.state.currentPage);
        }
    }, [tts.state.currentPage]);

    /**
     * Handle search result navigation - jump to the current search result
     */
    useEffect(() => {
        if (search.searchState.currentResultIndex >= 0 && search.searchState.results.length > 0) {
            const currentResult = search.searchState.results[search.searchState.currentResultIndex];
            if (currentResult) {
                // Jump to the page containing the search result
                if (currentResult.pageNumber !== currentPage) {
                    setCurrentPage(currentResult.pageNumber);
                }

                // Jump to the sentence containing the search result
                const pageContent = document?.pages[currentResult.pageNumber - 1];
                if (pageContent) {
                    tts.jumpToSentence(
                        currentResult.pageNumber,
                        currentResult.sentenceIndex,
                        pageContent.sentences
                    );
                }
            }
        }
    }, [search.searchState.currentResultIndex]);

    return (
        <PageWrapper
            title="Text-to-Speech Document Reader"
            description="Upload PDF or DOCX files and have them read aloud with Indian English voice"
            breadcrumbs={[{ label: 'Educator' }, { label: 'Text-to-Speech' }]}
        >
            {/* Main Content */}
                {!document ? (
                    // File Upload View
                    <div className="max-w-2xl mx-auto">
                        <div className="text-center mb-8">
                            <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
                                <FileText className="h-12 w-12 text-primary" />
                            </div>
                            <h2 className="text-xl font-semibold text-foreground mb-2">
                                Get Started
                            </h2>
                            <p className="text-muted-foreground">
                                Upload a document to begin reading with text-to-speech
                            </p>
                        </div>

                        <FileUpload
                            onFileSelect={handleFileSelect}
                            isLoading={isLoading}
                            currentFile={uploadedFile}
                            onClearFile={handleClearFile}
                        />

                        {error && (
                            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                                <p className="text-sm text-foreground">{error}</p>
                            </div>
                        )}

                        {/* Features List */}
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-background p-6 rounded-lg shadow-sm border">
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="p-2 bg-success/10 rounded-lg">
                                        <FileText className="h-5 w-5 text-success" />
                                    </div>
                                    <h3 className="font-semibold text-foreground">
                                        Multiple Formats
                                    </h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Support for PDF and DOCX files with automatic text extraction and pagination
                                </p>
                            </div>

                            <div className="bg-background p-6 rounded-lg shadow-sm border">
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="p-2 bg-info/10 rounded-lg">
                                        <BookOpen className="h-5 w-5 text-info" />
                                    </div>
                                    <h3 className="font-semibold text-foreground">
                                        Indian English Voice
                                    </h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Prioritizes Indian English voices for natural-sounding speech with automatic fallback
                                </p>
                            </div>

                            <div className="bg-background p-6 rounded-lg shadow-sm border">
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="p-2 bg-warning/10 rounded-lg">
                                        <span className="text-2xl">✨</span>
                                    </div>
                                    <h3 className="font-semibold text-foreground">
                                        Visual Highlighting
                                    </h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Follow along with synchronized text highlighting as each sentence is read
                                </p>
                            </div>

                            <div className="bg-background p-6 rounded-lg shadow-sm border">
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <span className="text-2xl">🔍</span>
                                    </div>
                                    <h3 className="font-semibold text-foreground">
                                        Search & Jump
                                    </h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Search for words, click any sentence to jump, and start reading from anywhere
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Document Reading View
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Document Viewer - Takes 2 columns */}
                        <div className="lg:col-span-2">
                            <DocumentViewer
                                document={document}
                                currentPage={currentPage}
                                currentSentenceIndex={tts.state.currentSentenceIndex}
                                onPageChange={handlePageChange}
                                isPlaying={tts.state.playbackState === 'playing'}
                                searchResults={search.searchState.results}
                                currentSearchResultIndex={search.searchState.currentResultIndex}
                                onSentenceClick={handleSentenceClick}
                            />
                        </div>

                        {/* Controls Sidebar - Takes 1 column */}
                        <div className="space-y-6">
                            {/* Search Component */}
                            <DocumentSearch
                                searchState={search.searchState}
                                onSearch={search.search}
                                onClearSearch={search.clearSearch}
                                onNextResult={search.nextResult}
                                onPreviousResult={search.previousResult}
                                onJumpToResult={search.jumpToResult}
                            />

                            {/* TTS Controls */}
                            <TTSControls
                                state={tts.state}
                                onPlay={tts.play}
                                onPause={tts.pause}
                                onResume={tts.resume}
                                onStop={tts.stop}
                                onVoiceChange={tts.setVoice}
                                onRateChange={tts.setRate}
                            />

                            {/* File Info Card */}
                            <div className="bg-background p-6 rounded-lg shadow-sm border">
                                <h3 className="font-semibold text-foreground mb-4">
                                    Document Info
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">File:</span>
                                        <span className="font-medium text-foreground truncate ml-2">
                                            {document.fileName}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Type:</span>
                                        <span className="font-medium text-foreground">
                                            {document.type.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Pages:</span>
                                        <span className="font-medium text-foreground">
                                            {document.totalPages}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Current Page:</span>
                                        <span className="font-medium text-foreground">
                                            {currentPage}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleClearFile}
                                    className="mt-4 w-full px-4 py-2 text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/10 rounded-lg transition-colors"
                                >
                                    Upload Different File
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </PageWrapper>
    );
}

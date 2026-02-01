import { useState, useEffect, useCallback, useRef } from 'react';
import type { TTSState, SpeechSynthesisHookResult } from '@/types/text-to-speech';

/**
 * Custom hook for managing Web Speech API text-to-speech functionality
 * Handles voice selection, playback control, and sentence-level tracking
 */
export function useSpeechSynthesis(): SpeechSynthesisHookResult {
    console.log('[useSpeechSynthesis] Hook initializing');

    const [state, setState] = useState<TTSState>({
        playbackState: 'idle',
        currentSentenceIndex: 0,
        totalSentences: 0,
        currentPage: 1,
        settings: {
            voice: null,
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0,
        },
        availableVoices: [],
        indianEnglishVoices: [],
    });

    console.log('[useSpeechSynthesis] State created:', state);

    const sentencesRef = useRef<string[]>([]);
    const currentIndexRef = useRef(0);
    const playbackStateRef = useRef<'idle' | 'playing' | 'paused' | 'stopped'>('idle');
    const settingsRef = useRef(state.settings);

    // Keep refs in sync with state
    useEffect(() => {
        playbackStateRef.current = state.playbackState;
        settingsRef.current = state.settings;
    }, [state.playbackState, state.settings]);

    /**
     * Load available voices and filter for Indian English
     */
    const loadVoices = useCallback(() => {
        console.log('[useSpeechSynthesis] loadVoices called');
        if (typeof window === 'undefined') {
            console.log('[useSpeechSynthesis] Window undefined, skipping');
            return;
        }

        const voices = window.speechSynthesis.getVoices();
        console.log('[useSpeechSynthesis] Voices found:', voices.length);

        // Filter for Indian English voices
        const indianVoices = voices.filter(
            (voice) =>
                voice.lang.startsWith('en-IN') ||
                voice.name.toLowerCase().includes('india') ||
                voice.name.toLowerCase().includes('indian')
        );

        // Fallback to all English voices if no Indian English found
        const fallbackVoices = indianVoices.length > 0
            ? indianVoices
            : voices.filter((voice) => voice.lang.startsWith('en'));

        setState((prev) => ({
            ...prev,
            availableVoices: voices,
            indianEnglishVoices: fallbackVoices,
            settings: {
                ...prev.settings,
                voice: fallbackVoices[0] || voices[0] || null,
            },
        }));
    }, []);

    /**
     * Initialize voices on mount
     */
    useEffect(() => {
        if (typeof window === 'undefined') return;

        loadVoices();

        // Some browsers load voices asynchronously
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.speechSynthesis.cancel();
            }
        };
    }, [loadVoices]);

    /**
     * Speak a single sentence
     */
    const speakSentence = useCallback((index: number) => {
        if (index >= sentencesRef.current.length) {
            // Reached end of text
            setState((prev) => ({
                ...prev,
                playbackState: 'stopped',
                currentSentenceIndex: 0,
            }));
            currentIndexRef.current = 0;
            return;
        }

        const sentence = sentencesRef.current[index].trim();
        if (!sentence) {
            // Skip empty sentences
            speakSentence(index + 1);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.voice = settingsRef.current.voice;
        utterance.rate = settingsRef.current.rate;
        utterance.pitch = settingsRef.current.pitch;
        utterance.volume = settingsRef.current.volume;

        utterance.onend = () => {
            if (playbackStateRef.current === 'playing') {
                currentIndexRef.current = index + 1;
                setState((prev) => ({
                    ...prev,
                    currentSentenceIndex: index + 1,
                }));
                speakSentence(index + 1);
            }
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            setState((prev) => ({
                ...prev,
                playbackState: 'stopped',
            }));
        };

        window.speechSynthesis.speak(utterance);

        setState((prev) => ({
            ...prev,
            currentSentenceIndex: index,
        }));
    }, []);

    /**
     * Play from current position
     */
    const play = useCallback(() => {
        if (sentencesRef.current.length === 0) return;

        setState((prev) => ({
            ...prev,
            playbackState: 'playing',
        }));

        speakSentence(currentIndexRef.current);
    }, [speakSentence]);

    /**
     * Pause playback
     */
    const pause = useCallback(() => {
        if (typeof window !== 'undefined') {
            window.speechSynthesis.cancel();
        }
        setState((prev) => ({
            ...prev,
            playbackState: 'paused',
        }));
    }, []);

    /**
     * Resume playback from paused position
     */
    const resume = useCallback(() => {
        setState((prev) => ({
            ...prev,
            playbackState: 'playing',
        }));
        speakSentence(currentIndexRef.current);
    }, [speakSentence]);

    /**
     * Stop playback and reset to beginning
     */
    const stop = useCallback(() => {
        if (typeof window !== 'undefined') {
            window.speechSynthesis.cancel();
        }
        currentIndexRef.current = 0;
        setState((prev) => ({
            ...prev,
            playbackState: 'stopped',
            currentSentenceIndex: 0,
        }));
    }, []);

    /**
     * Set the voice for speech synthesis
     */
    const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
        setState((prev) => ({
            ...prev,
            settings: {
                ...prev.settings,
                voice,
            },
        }));
    }, []);

    /**
     * Set the speech rate
     */
    const setRate = useCallback((rate: number) => {
        setState((prev) => ({
            ...prev,
            settings: {
                ...prev.settings,
                rate: Math.max(0.5, Math.min(2.0, rate)),
            },
        }));
    }, []);

    /**
     * Load new text content for reading
     */
    const loadText = useCallback((sentences: string[], pageNumber: number) => {
        if (typeof window !== 'undefined') {
            window.speechSynthesis.cancel();
        }
        sentencesRef.current = sentences;
        currentIndexRef.current = 0;

        setState((prev) => ({
            ...prev,
            totalSentences: sentences.length,
            currentSentenceIndex: 0,
            currentPage: pageNumber,
            playbackState: 'idle',
        }));
    }, []);

    /**
     * Jump to a specific page and load its content
     */
    const jumpToPage = useCallback((pageNumber: number, sentences: string[]) => {
        if (typeof window !== 'undefined') {
            window.speechSynthesis.cancel();
        }
        sentencesRef.current = sentences;
        currentIndexRef.current = 0;

        setState((prev) => ({
            ...prev,
            totalSentences: sentences.length,
            currentSentenceIndex: 0,
            currentPage: pageNumber,
            playbackState: 'idle',
        }));
    }, []);

    /**
     * Jump to a specific sentence on a specific page
     */
    const jumpToSentence = useCallback((pageNumber: number, sentenceIndex: number, sentences: string[]) => {
        if (typeof window !== 'undefined') {
            window.speechSynthesis.cancel();
        }
        sentencesRef.current = sentences;
        currentIndexRef.current = sentenceIndex;

        setState((prev) => ({
            ...prev,
            totalSentences: sentences.length,
            currentSentenceIndex: sentenceIndex,
            currentPage: pageNumber,
            playbackState: 'idle',
        }));
    }, []);

    return {
        state,
        play,
        pause,
        resume,
        stop,
        setVoice,
        setRate,
        loadText,
        jumpToPage,
        jumpToSentence,
    };
}

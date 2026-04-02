'use client';

import { Play, Pause, Square, Volume2, Gauge } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import type { TTSState } from '@/types/text-to-speech';

interface TTSControlsProps {
    state: TTSState;
    onPlay: () => void;
    onPause: () => void;
    onResume: () => void;
    onStop: () => void;
    onVoiceChange: (voice: SpeechSynthesisVoice) => void;
    onRateChange: (rate: number) => void;
    disabled?: boolean;
}

/**
 * TTSControls Component
 * Provides playback controls, voice selection, and speed adjustment
 */
export function TTSControls({
    state,
    onPlay,
    onPause,
    onResume,
    onStop,
    onVoiceChange,
    onRateChange,
    disabled = false,
}: TTSControlsProps) {
    const { playbackState, currentSentenceIndex, totalSentences, settings, indianEnglishVoices } = state;

    const isPlaying = playbackState === 'playing';
    const isPaused = playbackState === 'paused';
    const isIdle = playbackState === 'idle' || playbackState === 'stopped';

    const progress = totalSentences > 0 ? (currentSentenceIndex / totalSentences) * 100 : 0;

    const handlePlayPause = () => {
        if (isPlaying) {
            onPause();
        } else if (isPaused) {
            onResume();
        } else {
            onPlay();
        }
    };

    const handleVoiceChange = (voiceName: string) => {
        const voice = indianEnglishVoices.find((v) => v.name === voiceName);
        if (voice) {
            onVoiceChange(voice);
        }
    };

    const handleRateChange = (value: number[]) => {
        onRateChange(value[0]);
    };

    // Check if Web Speech API is supported
    const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

    if (!isSpeechSupported) {
        return (
            <Card className="border-destructive/20 bg-destructive/10">
                <CardContent className="pt-6">
                    <div className="text-center">
                        <Volume2 className="h-12 w-12 mx-auto mb-4 text-red-400" />
                        <h3 className="text-lg font-semibold text-red-900 mb-2">
                            Text-to-Speech Not Supported
                        </h3>
                        <p className="text-sm text-destructive">
                            Your browser doesn't support the Web Speech API. Please use a modern browser like
                            Chrome, Edge, Safari, or Firefox.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                    <Volume2 className="h-5 w-5" />
                    <span>Text-to-Speech Controls</span>
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Playback Controls */}
                <div className="flex items-center justify-center space-x-4">
                    <Button
                        size="lg"
                        onClick={handlePlayPause}
                        disabled={disabled || totalSentences === 0}
                        className="w-32"
                    >
                        {isPlaying ? (
                            <>
                                <Pause className="h-5 w-5 mr-2" />
                                Pause
                            </>
                        ) : (
                            <>
                                <Play className="h-5 w-5 mr-2" />
                                {isPaused ? 'Resume' : 'Play'}
                            </>
                        )}
                    </Button>

                    <Button
                        variant="outline"
                        size="lg"
                        onClick={onStop}
                        disabled={disabled || isIdle}
                    >
                        <Square className="h-5 w-5 mr-2" />
                        Stop
                    </Button>
                </div>

                {/* Progress Indicator */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Progress</span>
                        <span>
                            {currentSentenceIndex} / {totalSentences} sentences
                        </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Voice Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                        <Volume2 className="h-4 w-4" />
                        <span>Voice</span>
                    </label>
                    <Select
                        value={settings.voice?.name || ''}
                        onValueChange={handleVoiceChange}
                        disabled={disabled || indianEnglishVoices.length === 0}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a voice" />
                        </SelectTrigger>
                        <SelectContent>
                            {indianEnglishVoices.length > 0 ? (
                                indianEnglishVoices.map((voice) => (
                                    <SelectItem key={voice.name} value={voice.name}>
                                        {voice.name} ({voice.lang})
                                    </SelectItem>
                                ))
                            ) : (
                                <SelectItem value="none" disabled>
                                    No voices available
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                    {indianEnglishVoices.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                            {indianEnglishVoices.some((v) => v.lang.startsWith('en-IN'))
                                ? '✓ Indian English voices available'
                                : 'Using English voices (Indian English not available)'}
                        </p>
                    )}
                </div>

                {/* Speed Control */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center justify-between">
                        <span className="flex items-center space-x-2">
                            <Gauge className="h-4 w-4" />
                            <span>Speed</span>
                        </span>
                        <span className="text-muted-foreground">{settings.rate.toFixed(1)}x</span>
                    </label>
                    <Slider
                        value={[settings.rate]}
                        onValueChange={handleRateChange}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        disabled={disabled}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0.5x (Slow)</span>
                        <span>1.0x (Normal)</span>
                        <span>2.0x (Fast)</span>
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <span
                            className={`font-medium ${isPlaying
                                    ? 'text-success'
                                    : isPaused
                                        ? 'text-warning'
                                        : 'text-muted-foreground'
                                }`}
                        >
                            {isPlaying ? '▶ Playing' : isPaused ? '⏸ Paused' : '⏹ Stopped'}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

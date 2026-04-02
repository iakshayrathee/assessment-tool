'use client';

import { useState, useRef, useEffect } from 'react';
import { DiffViewer } from './DiffViewer';
import { DiffLine } from '@/lib/reportUtils';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send, Loader2, CheckCircle, XCircle, Sparkles,
  Check, X, ArrowRight, MessageSquare, Clock, AlertCircle
} from 'lucide-react';

interface AIPromptEntry {
  prompt: string;
  timestamp: Date;
  status: 'pending' | 'success' | 'error';
  errorMessage?: string;
}

interface ReportAIAssistTabProps {
  diffLines: DiffLine[];
  diffStats: { added: number; removed: number; unchanged: number };
  isRefining: boolean;
  promptHistory: AIPromptEntry[];
  aiRefinedContent: string | null;
  onRefine: (prompt: string) => void;
  onApply: () => void;
  onReject: () => void;
}

const SUGGESTED_PROMPTS = [
  'Make the recommendations more specific and actionable',
  'Simplify the language for parent readability',
  'Add more detail to the strengths section',
  'Make the closing statement more encouraging',
  'Shorten each section to key bullet points',
];

export function ReportAIAssistTab({
  diffLines,
  diffStats,
  isRefining,
  promptHistory,
  aiRefinedContent,
  onRefine,
  onApply,
  onReject,
}: ReportAIAssistTabProps) {
  const [promptText, setPromptText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll history
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [promptHistory.length]);

  const handleSubmit = () => {
    if (!promptText.trim() || isRefining) return;
    onRefine(promptText.trim());
    setPromptText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Prompt History */}
      {promptHistory.length > 0 && (
        <div className="border-b border-border max-h-40 overflow-y-auto">
          <div className="px-4 py-2 bg-muted/40 border-b border-border text-xs font-medium text-muted-foreground flex items-center gap-1.5 sticky top-0">
            <Clock className="h-3 w-3" /> Prompt History
          </div>
          <div className="space-y-0">
            {promptHistory.map((entry, idx) => (
              <div key={idx} className="flex items-start gap-2 px-4 py-2 border-b border-gray-50 last:border-0">
                <div className="mt-0.5">
                  {entry.status === 'success' && <CheckCircle className="h-3.5 w-3.5 text-success" />}
                  {entry.status === 'error' && <XCircle className="h-3.5 w-3.5 text-destructive" />}
                  {entry.status === 'pending' && <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{entry.prompt}</p>
                  {entry.errorMessage && (
                    <p className="text-xs text-destructive mt-0.5">{entry.errorMessage}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            <div ref={historyEndRef} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        <AnimatePresence mode="wait">
          {isRefining ? (
            /* Loading State */
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-16 gap-4"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-info animate-pulse" />
                </div>
                <Loader2 className="absolute -bottom-1 -right-1 h-6 w-6 text-primary animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">AI is refining your report...</p>
                <p className="text-sm text-muted-foreground mt-1">This may take a few seconds</p>
              </div>
            </motion.div>
          ) : aiRefinedContent ? (
            /* Diff View */
            <motion.div
              key="diff"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              {/* Actions bar */}
              <div className="flex items-center justify-between bg-info/10 border border-purple-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-info" />
                  <span className="text-sm font-medium text-foreground">AI suggested changes</span>
                  <span className="text-xs text-info bg-info/10 px-2 py-0.5 rounded-full">
                    +{diffStats.added} / -{diffStats.removed}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={onReject} className="gap-1 h-8 text-xs border-destructive/20 text-destructive hover:bg-destructive/10">
                    <X className="h-3 w-3" /> Reject
                  </Button>
                  <Button size="sm" onClick={onApply} className="gap-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white">
                    <Check className="h-3 w-3" /> Apply Changes
                  </Button>
                </div>
              </div>

              {/* Diff viewer */}
              <DiffViewer diffLines={diffLines} />
            </motion.div>
          ) : (
            /* Empty State / Prompt suggestions */
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 gap-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 flex items-center justify-center">
                <MessageSquare className="h-7 w-7 text-purple-500" />
              </div>
              <div className="text-center max-w-md">
                <h4 className="font-semibold text-foreground mb-1">AI Report Assistant</h4>
                <p className="text-sm text-muted-foreground">
                  Describe the changes you want to make to the report. The AI will suggest modifications and show you exactly what changed.
                </p>
              </div>

              {/* Suggested prompts */}
              <div className="w-full max-w-lg space-y-2">
                <p className="text-xs font-medium text-muted-foreground text-center">Try a suggestion:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTED_PROMPTS.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPromptText(suggestion)}
                      className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground hover:bg-info/10 
                               hover:text-purple-700 transition-colors border border-border hover:border-purple-200"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Prompt Input Area (always visible at bottom) */}
      <div className="border-t border-border bg-muted/40/50 p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the changes you want AI to make..."
              disabled={isRefining}
              rows={2}
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm 
                       placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 
                       focus:border-purple-400 disabled:opacity-50 disabled:bg-muted transition-all"
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              Ctrl+Enter to send
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!promptText.trim() || isRefining}
            className="self-end h-[52px] px-5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 
                     hover:from-purple-700 hover:to-blue-700 text-white shadow-md shadow-purple-200/50 
                     disabled:opacity-50 disabled:shadow-none"
          >
            {isRefining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

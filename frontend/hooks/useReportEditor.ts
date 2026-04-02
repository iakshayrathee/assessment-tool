'use client';

import { useState, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api';
import { computeLineDiff, getDiffStats, DiffLine } from '@/lib/reportUtils';
import toast from '@/lib/toast';

interface AIPromptEntry {
  prompt: string;
  timestamp: Date;
  status: 'pending' | 'success' | 'error';
  errorMessage?: string;
}

interface UseReportEditorOptions {
  report: any;
  onSaveSuccess?: () => void;
}

/**
 * Mock AI refinement — applies simple transformations to demonstrate the diff UI
 * when the real backend endpoint is not yet available.
 */
function mockRefineContent(content: string, prompt: string): string {
  const lower = prompt.toLowerCase();
  let refined = content;

  // Simulate a short delay effect — the actual delay is in the async wrapper
  if (lower.includes('specific') || lower.includes('actionable')) {
    refined = refined
      .replace(/recommendations/gi, 'specific, actionable recommendations')
      .replace(/should focus on/gi, 'is recommended to prioritize')
      .replace(/needs to improve/gi, 'would benefit from targeted practice in')
      .replace(/consider/gi, 'it is strongly recommended to');
  }
  
  if (lower.includes('simplif') || lower.includes('parent') || lower.includes('readable')) {
    refined = refined
      .replace(/demonstrate proficiency/gi, 'show good skills')
      .replace(/exhibit characteristics/gi, 'show signs')
      .replace(/remediation/gi, 'extra support')
      .replace(/intervention/gi, 'extra help')
      .replace(/deficit/gi, 'area for growth');
  }

  if (lower.includes('shorten') || lower.includes('concise') || lower.includes('brief') || lower.includes('bullet')) {
    // Trim long paragraphs to their first two sentences
    refined = refined.replace(
      /([.!?])\s+([A-Z])/g,
      (match, punct, nextChar, offset, str) => {
        // Count sentences before this point in the same paragraph
        const before = str.substring(0, offset + 1);
        const lastBreak = Math.max(before.lastIndexOf('\n\n'), 0);
        const paragraph = before.substring(lastBreak);
        const sentenceCount = (paragraph.match(/[.!?]/g) || []).length;
        if (sentenceCount >= 3) return `${punct}\n`;
        return match;
      }
    );
  }

  if (lower.includes('encouraging') || lower.includes('positive')) {
    refined = refined
      .replace(/struggles with/gi, 'is developing skills in')
      .replace(/weakness/gi, 'area with growth potential')
      .replace(/poor/gi, 'developing')
      .replace(/fails to/gi, 'is still learning to');
  }

  if (lower.includes('detail') || lower.includes('elaborate')) {
    refined = refined
      .replace(/Good progress/gi, 'Significant and noteworthy progress has been observed')
      .replace(/needs improvement/gi, 'requires focused attention and structured support for improvement');
  }

  // If no transformations matched, make a generic small change
  if (refined === content) {
    refined = refined
      .replace(/\. /g, '. Based on current observations, ')
      .replace(/Based on current observations, Based on current observations,/g, 'Based on current observations,');
    // Limit to first few occurrences to keep it reasonable
    const lines = refined.split('\n');
    const modifiedLines = lines.map((line, i) => {
      if (i < 3 && line.length > 10) {
        return line.replace(/^(#{1,3}\s+\d+\.\s+)/, '$1[Revised] ');
      }
      return line;
    });
    refined = modifiedLines.join('\n');
  }

  return refined;
}

export function useReportEditor({ report, onSaveSuccess }: UseReportEditorOptions) {
  const originalContent = report?.content || '';

  const [editedContent, setEditedContent] = useState<string>(originalContent);
  const [aiRefinedContent, setAiRefinedContent] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [promptHistory, setPromptHistory] = useState<AIPromptEntry[]>([]);

  // Computed states
  const isDirty = useMemo(() => editedContent !== originalContent, [editedContent, originalContent]);

  const diffLines = useMemo<DiffLine[]>(() => {
    if (!aiRefinedContent) return [];
    return computeLineDiff(editedContent, aiRefinedContent);
  }, [editedContent, aiRefinedContent]);

  const diffStats = useMemo(() => getDiffStats(diffLines), [diffLines]);

  // AI Refinement — uses mock locally until backend endpoint is deployed.
  // When backend POST /reports/ai/refine is ready, uncomment the API block below.
  const refineWithAI = useCallback(async (prompt: string) => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    const entry: AIPromptEntry = { prompt, timestamp: new Date(), status: 'pending' };
    setPromptHistory(prev => [...prev, entry]);
    setIsRefining(true);
    setAiRefinedContent(null);

    try {
      // ── Uncomment below when backend endpoint is deployed ──
      // const result = await apiClient.refineReportWithAI(report.id, editedContent, prompt);
      // setAiRefinedContent(result.refinedContent);

      // ── Mock refinement (remove when backend is ready) ──
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockResult = mockRefineContent(editedContent, prompt);
      setAiRefinedContent(mockResult);

      setPromptHistory(prev =>
        prev.map((e, i) => i === prev.length - 1 ? { ...e, status: 'success' as const } : e)
      );
      toast.success('AI refinement complete');
    } catch (error: any) {
      console.error('AI refinement failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'AI refinement failed';
      setPromptHistory(prev =>
        prev.map((e, i) => i === prev.length - 1 ? { ...e, status: 'error' as const, errorMessage } : e)
      );
      toast.error(errorMessage);
    } finally {
      setIsRefining(false);
    }
  }, [report?.id, editedContent]);

  // Actions
  const applyAIChanges = useCallback(() => {
    if (aiRefinedContent) {
      setEditedContent(aiRefinedContent);
      setAiRefinedContent(null);
      toast.success('AI changes applied');
    }
  }, [aiRefinedContent]);

  const rejectAIChanges = useCallback(() => {
    setAiRefinedContent(null);
    toast('AI changes discarded', { icon: '🗑️' });
  }, []);

  const resetChanges = useCallback(() => {
    setEditedContent(originalContent);
    setAiRefinedContent(null);
    toast('Content reset to original', { icon: '↩️' });
  }, [originalContent]);

  const saveChanges = useCallback(async () => {
    if (!isDirty) {
      toast('No changes to save', { icon: 'ℹ️' });
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.updateReport(report.id, { content: editedContent });
      toast.success('Report saved successfully');
      onSaveSuccess?.();
    } catch (error: any) {
      console.error('Save failed:', error);
      toast.error(error.response?.data?.error || 'Failed to save report');
    } finally {
      setIsSaving(false);
    }
  }, [report?.id, editedContent, isDirty, onSaveSuccess]);

  return {
    // State
    editedContent,
    setEditedContent,
    originalContent,
    aiRefinedContent,
    isDirty,

    // Diff
    diffLines,
    diffStats,

    // AI
    refineWithAI,
    isRefining,
    applyAIChanges,
    rejectAIChanges,
    promptHistory,

    // Save
    saveChanges,
    isSaving,
    resetChanges,
  };
}

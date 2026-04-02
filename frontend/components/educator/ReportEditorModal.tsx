'use client';

import { useState, useEffect } from 'react';
import { useReportEditor } from '@/hooks/useReportEditor';
import { ReportEditTab } from './ReportEditTab';
import { ReportAIAssistTab } from './ReportAIAssistTab';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import {
  Pencil, Bot, Save, X, Loader2, FileText, AlertCircle
} from 'lucide-react';

interface ReportEditorModalProps {
  report: any;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  reportTypeLabel: string;
  statusClasses: string;
}

export function ReportEditorModal({
  report,
  isOpen,
  onClose,
  onSaveSuccess,
  reportTypeLabel,
  statusClasses,
}: ReportEditorModalProps) {
  const [activeTab, setActiveTab] = useState<string>('edit');

  const {
    editedContent,
    setEditedContent,
    isDirty,
    isSaving,
    isRefining,
    diffLines,
    diffStats,
    aiRefinedContent,
    promptHistory,
    saveChanges,
    resetChanges,
    refineWithAI,
    applyAIChanges,
    rejectAIChanges,
  } = useReportEditor({
    report,
    onSaveSuccess: () => {
      onSaveSuccess();
      onClose();
    },
  });

  // Reset state when modal opens with new report
  useEffect(() => {
    if (isOpen) {
      setActiveTab('edit');
    }
  }, [isOpen, report?.id]);

  // Switch to edit tab after applying AI changes
  const handleApplyAIChanges = () => {
    applyAIChanges();
    setActiveTab('edit');
  };

  const handleClose = () => {
    if (isDirty) {
      const confirm = window.confirm('You have unsaved changes. Discard them?');
      if (!confirm) return;
    }
    onClose();
  };

  if (!report) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-[95vw] w-[1200px] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-slate-50 to-blue-50/30 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-foreground text-base truncate">{report.title || 'Edit Report'}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-xs">{reportTypeLabel}</Badge>
                <Badge className={`text-xs border ${statusClasses}`}>{report.status || 'DRAFT'}</Badge>
                {isDirty && (
                  <Badge className="text-xs bg-warning/10 text-warning border-warning/20 animate-pulse">
                    Unsaved changes
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Tabs ─── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
          <div className="px-6 pt-3 pb-0 bg-background border-b border-border flex-shrink-0">
            <TabsList className="h-10 bg-muted/80 p-1 rounded-lg">
              <TabsTrigger value="edit" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md px-4">
                <Pencil className="h-3.5 w-3.5" />
                Edit Report
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:text-purple-700 data-[state=active]:shadow-sm rounded-md px-4">
                <Bot className="h-3.5 w-3.5" />
                AI Assist
                {isRefining && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <TabsContent value="edit" className="flex-1 min-h-0 mt-0 overflow-hidden">
            <ReportEditTab
              content={editedContent}
              onChange={setEditedContent}
              onReset={resetChanges}
              isDirty={isDirty}
            />
          </TabsContent>

          <TabsContent value="ai" className="flex-1 min-h-0 mt-0 overflow-hidden">
            <ReportAIAssistTab
              diffLines={diffLines}
              diffStats={diffStats}
              isRefining={isRefining}
              promptHistory={promptHistory}
              aiRefinedContent={aiRefinedContent}
              onRefine={refineWithAI}
              onApply={handleApplyAIChanges}
              onReject={rejectAIChanges}
            />
          </TabsContent>
        </Tabs>

        {/* ─── Footer ─── */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/40/50 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isDirty && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1 text-warning"
              >
                <AlertCircle className="h-3 w-3" /> You have unsaved changes
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleClose} className="rounded-xl gap-1.5">
              <X className="h-3.5 w-3.5" /> Cancel
            </Button>
            <Button
              onClick={saveChanges}
              disabled={!isDirty || isSaving}
              className="rounded-xl gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-200/50 disabled:opacity-50 disabled:shadow-none"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

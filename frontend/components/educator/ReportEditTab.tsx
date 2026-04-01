'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { parseReportSections, markdownToHtml } from '@/lib/reportUtils';
import { BookOpen, Hash, RotateCcw, Save, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

/* Section color configs — matches ASSESSMENT_SECTIONS order (10 sections) */
const SECTION_STYLES = [
  { bgClass: 'bg-rose-50',   borderClass: 'border-rose-200',   titleClass: 'text-rose-800',   editBg: 'bg-white' },
  { bgClass: 'bg-cyan-50',   borderClass: 'border-cyan-200',   titleClass: 'text-cyan-800',   editBg: 'bg-white' },
  { bgClass: 'bg-violet-50', borderClass: 'border-violet-200', titleClass: 'text-violet-800', editBg: 'bg-white' },
  { bgClass: 'bg-blue-50',   borderClass: 'border-blue-200',   titleClass: 'text-blue-800',   editBg: 'bg-white' },
  { bgClass: 'bg-purple-50', borderClass: 'border-purple-200', titleClass: 'text-purple-800', editBg: 'bg-white' },
  { bgClass: 'bg-amber-50',  borderClass: 'border-amber-200',  titleClass: 'text-amber-800',  editBg: 'bg-white' },
  { bgClass: 'bg-teal-50',   borderClass: 'border-teal-200',   titleClass: 'text-teal-800',   editBg: 'bg-white' },
  { bgClass: 'bg-green-50',  borderClass: 'border-green-200',  titleClass: 'text-green-800',  editBg: 'bg-white' },
  { bgClass: 'bg-indigo-50', borderClass: 'border-indigo-200', titleClass: 'text-indigo-800', editBg: 'bg-white' },
  { bgClass: 'bg-gray-50',   borderClass: 'border-gray-200',   titleClass: 'text-gray-800',   editBg: 'bg-white' },
];

/* ────────────────────────────────────────────────
   Editable section card — looks like the preview
   but allows inline editing of the body text
   ──────────────────────────────────────────────── */
function EditableSection({
  heading,
  body,
  index,
  onChange,
}: {
  heading: string;
  body: string;
  index: number;
  onChange: (newBody: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(body);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const style = SECTION_STYLES[index] || SECTION_STYLES[SECTION_STYLES.length - 1];

  const renderedHtml = useMemo(() => markdownToHtml(body), [body]);

  const handleStartEdit = () => {
    setEditText(body);
    setIsEditing(true);
    // Auto-focus textarea after render
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleSaveEdit = () => {
    onChange(editText);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(body);
    setIsEditing(false);
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(e.target.value);
    // Auto-resize
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`${style.bgClass} border ${style.borderClass} rounded-xl overflow-hidden shadow-sm`}
    >
      {/* Section header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:brightness-95"
      >
        <div className="flex items-center gap-3">
          <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${style.titleClass} bg-white/70 border ${style.borderClass}`}>
            {index + 1}
          </span>
          <h4 className={`font-semibold text-base ${style.titleClass}`}>{heading}</h4>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </button>

      {/* Section body */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 pt-1 border-t border-dashed border-opacity-50" style={{ borderColor: 'inherit' }}>
              {isEditing ? (
                /* Editing mode — styled textarea */
                <div className="space-y-2">
                  <textarea
                    ref={textareaRef}
                    value={editText}
                    onChange={handleTextareaChange}
                    className="w-full min-h-[120px] p-3 rounded-lg border border-gray-300 text-sm text-gray-800 
                             leading-relaxed bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/40 
                             focus:border-blue-400 resize-none transition-all"
                    style={{ height: 'auto' }}
                    onFocus={(e) => { e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; }}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="text-xs h-7">
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit} className="text-xs h-7 bg-blue-600 hover:bg-blue-700 text-white gap-1">
                      <Save className="h-3 w-3" /> Save Section
                    </Button>
                  </div>
                </div>
              ) : (
                /* View mode — rendered markdown, click to edit */
                <div
                  onClick={handleStartEdit}
                  className="cursor-text group relative rounded-lg p-1 -m-1 transition-all hover:bg-white/60 hover:shadow-sm"
                  title="Click to edit this section"
                >
                  <div
                    className="prose prose-sm max-w-none leading-relaxed text-gray-700"
                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
                  />
                  {/* Edit hint overlay */}
                  <div className="absolute inset-0 rounded-lg border-2 border-dashed border-transparent group-hover:border-blue-300/50 transition-colors pointer-events-none" />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-medium">
                      Click to edit
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════
   MAIN: ReportEditTab
   ════════════════════════════════════════════════ */
interface ReportEditTabProps {
  content: string;
  onChange: (content: string) => void;
  onReset: () => void;
  isDirty: boolean;
}

export function ReportEditTab({ content, onChange, onReset, isDirty }: ReportEditTabProps) {
  const sections = useMemo(() => parseReportSections(content || ''), [content]);
  const wordCount = useMemo(() => content.trim().split(/\s+/).filter(Boolean).length, [content]);

  // Rebuild full markdown when a section body is edited
  const handleSectionChange = useCallback((index: number, newBody: string) => {
    const allSections = parseReportSections(content || '');
    // Reconstruct the full markdown string
    const parts = allSections.map((section, i) => {
      const heading = `## ${i + 1}. ${section.heading}`;
      const body = i === index ? newBody : section.body;
      return `${heading}\n${body}`;
    });
    onChange(parts.join('\n\n'));
  }, [content, onChange]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{sections.length} sections</span>
          <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{wordCount.toLocaleString()} words</span>
          <span className="text-gray-400">•</span>
          <span className="text-blue-600 font-medium">Click any section to edit</span>
        </div>
        {isDirty && (
          <Button variant="ghost" size="sm" onClick={onReset} className="text-xs gap-1 h-7 text-gray-500 hover:text-gray-700">
            <RotateCcw className="h-3 w-3" /> Reset
          </Button>
        )}
      </div>

      {/* Sections list — scrollable */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {sections.length > 0 ? (
          sections.map((section, i) => (
            <EditableSection
              key={i}
              heading={section.heading}
              body={section.body}
              index={i}
              onChange={(newBody) => handleSectionChange(i, newBody)}
            />
          ))
        ) : (
          /* Fallback for non-sectioned content */
          <FallbackEditor content={content} onChange={onChange} />
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   Fallback for reports without ## sections
   ──────────────────────────────────────────────── */
function FallbackEditor({ content, onChange }: { content: string; onChange: (c: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(content);
  const renderedHtml = useMemo(() => markdownToHtml(content), [content]);

  const handleSave = () => {
    onChange(editText);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="w-full min-h-[300px] p-4 rounded-lg border border-gray-300 text-sm text-gray-800 
                   leading-relaxed bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/40 
                   focus:border-blue-400 resize-y transition-all"
        />
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setEditText(content); setIsEditing(false); }}>Cancel</Button>
          <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
            <Save className="h-3 w-3" /> Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => { setEditText(content); setIsEditing(true); }}
      className="bg-white border border-gray-200 rounded-xl p-5 cursor-text group relative hover:shadow-sm transition-all"
      title="Click to edit"
    >
      <div
        className="prose prose-sm max-w-none leading-relaxed text-gray-700"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
      <div className="absolute inset-0 rounded-xl border-2 border-dashed border-transparent group-hover:border-blue-300/50 transition-colors pointer-events-none" />
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-medium">Click to edit</span>
      </div>
    </div>
  );
}

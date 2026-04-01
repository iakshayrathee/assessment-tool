'use client';

import { useMemo } from 'react';
import { DiffLine, getDiffStats } from '@/lib/reportUtils';
import { motion } from 'framer-motion';
import { Plus, Minus, Equal, ChevronDown } from 'lucide-react';
import { useState } from 'react';

/* ────────────────────────────────────────────────
   Collapsible unchanged block
   ──────────────────────────────────────────────── */
function CollapsedBlock({ count, onExpand }: { count: number; onExpand: () => void }) {
  return (
    <button
      onClick={onExpand}
      className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs text-gray-400 bg-gray-50/50 
                hover:bg-gray-100/80 hover:text-gray-600 transition-colors border-y border-gray-100"
    >
      <ChevronDown className="h-3 w-3" />
      <span>{count} unchanged line{count > 1 ? 's' : ''}</span>
      <ChevronDown className="h-3 w-3" />
    </button>
  );
}

/* ────────────────────────────────────────────────
   Single diff line
   ──────────────────────────────────────────────── */
function DiffLineRow({ line }: { line: DiffLine }) {
  const config = {
    added: {
      bg: 'bg-green-50',
      border: 'border-l-green-500',
      text: 'text-green-900',
      numBg: 'bg-green-100 text-green-700',
      icon: <Plus className="h-3 w-3 text-green-600" />,
      prefix: '+',
    },
    removed: {
      bg: 'bg-red-50',
      border: 'border-l-red-500',
      text: 'text-red-900',
      numBg: 'bg-red-100 text-red-700',
      icon: <Minus className="h-3 w-3 text-red-600" />,
      prefix: '-',
    },
    unchanged: {
      bg: 'bg-white',
      border: 'border-l-transparent',
      text: 'text-gray-600',
      numBg: 'bg-gray-50 text-gray-400',
      icon: null,
      prefix: ' ',
    },
  }[line.type];

  return (
    <div className={`flex items-stretch ${config.bg} border-l-4 ${config.border} group hover:brightness-[0.98] transition-all`}>
      {/* Old line number */}
      <div className={`w-12 flex-shrink-0 text-right px-2 py-0.5 text-xs font-mono select-none ${config.numBg} border-r border-gray-200`}>
        {line.oldLineNumber ?? ''}
      </div>
      {/* New line number */}
      <div className={`w-12 flex-shrink-0 text-right px-2 py-0.5 text-xs font-mono select-none ${config.numBg} border-r border-gray-200`}>
        {line.newLineNumber ?? ''}
      </div>
      {/* Prefix (+/-/space) */}
      <div className="w-6 flex-shrink-0 flex items-center justify-center">
        {config.icon}
      </div>
      {/* Content */}
      <div className={`flex-1 px-3 py-0.5 text-sm font-mono whitespace-pre-wrap break-all ${config.text}`}>
        {line.content || '\u00A0'}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   Diff Stats Header
   ──────────────────────────────────────────────── */
function DiffStatsHeader({ diffLines }: { diffLines: DiffLine[] }) {
  const stats = useMemo(() => getDiffStats(diffLines), [diffLines]);

  return (
    <div className="flex items-center gap-4 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium">
      <span className="text-gray-500">Changes:</span>
      <span className="flex items-center gap-1 text-green-700">
        <Plus className="h-3.5 w-3.5" />
        {stats.added} added
      </span>
      <span className="flex items-center gap-1 text-red-700">
        <Minus className="h-3.5 w-3.5" />
        {stats.removed} removed
      </span>
      <span className="flex items-center gap-1 text-gray-500">
        <Equal className="h-3.5 w-3.5" />
        {stats.unchanged} unchanged
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN: DiffViewer Component
   ════════════════════════════════════════════════ */
export function DiffViewer({ diffLines, maxCollapsedLines = 4 }: { diffLines: DiffLine[]; maxCollapsedLines?: number }) {
  const [expandedBlocks, setExpandedBlocks] = useState<Set<number>>(new Set());

  // Group consecutive unchanged lines into collapsible blocks
  const renderedElements: React.ReactNode[] = [];
  let i = 0;
  let blockIndex = 0;

  while (i < diffLines.length) {
    const line = diffLines[i];

    if (line.type === 'unchanged') {
      // Collect consecutive unchanged
      const start = i;
      while (i < diffLines.length && diffLines[i].type === 'unchanged') i++;
      const unchangedBlock = diffLines.slice(start, i);
      const currentBlockIndex = blockIndex++;

      if (unchangedBlock.length > maxCollapsedLines && !expandedBlocks.has(currentBlockIndex)) {
        // Show first 2 and last 2, collapse middle
        const head = unchangedBlock.slice(0, 2);
        const tail = unchangedBlock.slice(-2);
        const collapsedCount = unchangedBlock.length - 4;

        head.forEach((l, idx) => renderedElements.push(<DiffLineRow key={`${start}-h-${idx}`} line={l} />));
        if (collapsedCount > 0) {
          renderedElements.push(
            <CollapsedBlock
              key={`collapsed-${currentBlockIndex}`}
              count={collapsedCount}
              onExpand={() => setExpandedBlocks(prev => { const next = new Set(Array.from(prev)); next.add(currentBlockIndex); return next; })}
            />
          );
        }
        tail.forEach((l, idx) => renderedElements.push(<DiffLineRow key={`${start}-t-${idx}`} line={l} />));
      } else {
        unchangedBlock.forEach((l, idx) => renderedElements.push(<DiffLineRow key={`${start}-${idx}`} line={l} />));
      }
    } else {
      renderedElements.push(<DiffLineRow key={`line-${i}`} line={diffLines[i]} />);
      i++;
    }
  }

  if (diffLines.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No differences to display
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <DiffStatsHeader diffLines={diffLines} />

      {/* Diff table header */}
      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center bg-gray-100 border-b border-gray-200 text-xs text-gray-500 font-medium">
          <div className="w-12 text-center px-2 py-1.5 border-r border-gray-200">Old</div>
          <div className="w-12 text-center px-2 py-1.5 border-r border-gray-200">New</div>
          <div className="w-6" />
          <div className="flex-1 px-3 py-1.5">Content</div>
        </div>

        <div className="max-h-[450px] overflow-y-auto">
          {renderedElements}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Formats inline markdown (bold, italic, code) within a single line of text.
 * Does NOT process block-level syntax like headers or lists.
 */
function formatInline(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
        .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
        .replace(/`([^`\n]+)`/g, '<code class="px-1 py-0.5 bg-gray-100 rounded text-xs font-mono">$1</code>');
}

/**
 * Detects "Sub-Title — Body content" patterns in report text.
 * Returns the title and body parts, or null if the line is a regular sentence.
 */
const SENTENCE_STARTERS = /^(The|A|An|This|That|It|He|She|We|They|However|Therefore|Furthermore|Additionally|Due|Based|According|As|If|When|While|Although|Since|Because|Despite|During|After|Before|Also|There|Here|Its|His|Her|Our|Their|My|Your|No|Not)\s/;

function splitSubSection(line: string): { title: string; body: string } | null {
    const m = line.match(/^(.+?)\s*[—–]\s*(.+)$/);
    if (!m) return null;
    const title = m[1].trim();
    const body = m[2].trim();
    const words = title.split(/\s+/);
    if (words.length > 8 || words.length < 1) return null;
    if (!/^[A-Z]/.test(title)) return null;
    if (SENTENCE_STARTERS.test(title)) return null;
    return { title, body };
}

/**
 * Converts markdown text to styled HTML for report rendering.
 * Handles ### Title — Content splitting, sub-section detection, and bullet lists.
 */
export function markdownToHtml(text: string): string {
    if (!text) return '';

    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const parts: string[] = [];
    let listItems: string[] = [];
    let listKind: 'ul' | 'ol' | null = null;

    const flushList = () => {
        if (!listKind || !listItems.length) return;
        const cls = listKind === 'ul'
            ? 'class="my-2 pl-5 space-y-0.5 list-disc text-gray-700"'
            : 'class="my-2 pl-5 space-y-0.5 list-decimal text-gray-700"';
        parts.push(`<${listKind} ${cls}>${listItems.join('')}</${listKind}>`);
        listItems = [];
        listKind = null;
    };

    const H5 = 'class="font-semibold text-sm mt-5 mb-2 text-gray-800 pb-1 border-b border-gray-200"';
    const P = 'class="mb-2 leading-relaxed text-gray-700"';

    for (const line of lines) {
        const t = line.trimEnd();

        if (/^###\s/.test(t)) {
            flushList();
            const headerText = t.replace(/^###\s+/, '');
            const split = splitSubSection(headerText);
            if (split) {
                parts.push(`<h5 ${H5}>${formatInline(split.title)}</h5>`);
                parts.push(`<p ${P}>${formatInline(split.body)}</p>`);
            } else {
                parts.push(`<h5 ${H5}>${formatInline(headerText)}</h5>`);
            }
        } else if (/^##\s/.test(t)) {
            flushList();
            parts.push(`<h4 class="text-base font-semibold mt-5 mb-2 text-blue-800 border-b border-blue-100 pb-1">${formatInline(t.replace(/^##\s+/, ''))}</h4>`);
        } else if (/^#\s/.test(t)) {
            flushList();
            parts.push(`<h3 class="text-lg font-bold mt-6 mb-2 text-blue-900">${formatInline(t.replace(/^#\s+/, ''))}</h3>`);
        } else if (/^[-•*]\s/.test(t)) {
            if (listKind !== 'ul') { flushList(); listKind = 'ul'; }
            listItems.push(`<li class="mb-0.5">${formatInline(t.replace(/^[-•*]\s+/, ''))}</li>`);
        } else if (/^\d+[.)]\s/.test(t)) {
            if (listKind !== 'ol') { flushList(); listKind = 'ol'; }
            listItems.push(`<li class="mb-0.5">${formatInline(t.replace(/^\d+[.)]\s+/, ''))}</li>`);
        } else if (t.trim() === '') {
            flushList();
        } else {
            flushList();
            const sub = splitSubSection(t);
            if (sub) {
                parts.push(`<h5 ${H5}>${formatInline(sub.title)}</h5>`);
                parts.push(`<p ${P}>${formatInline(sub.body)}</p>`);
            } else {
                parts.push(`<p ${P}>${formatInline(t)}</p>`);
            }
        }
    }
    flushList();

    return parts.join('');
}

/**
 * Converts markdown to HTML with inline styles for PDF rendering.
 * Handles ### Title — Content splitting and sub-section detection.
 */
export function markdownToHtmlForPdf(text: string): string {
    if (!text) return '';

    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const parts: string[] = [];
    let listItems: string[] = [];
    let listKind: 'ul' | 'ol' | null = null;

    const inlinePdf = (s: string) => s
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
        .replace(/`([^`\n]+)`/g, '<code style="font-family:monospace;font-size:10px;background:#f0f0f0;padding:0 2px;">$1</code>');

    const flush = () => {
        if (!listKind || !listItems.length) return;
        parts.push(`<${listKind} style="margin:4px 0;padding-left:18px;">${listItems.join('')}</${listKind}>`);
        listItems = [];
        listKind = null;
    };

    const H5_PDF = 'style="font-size:11.5px;font-weight:700;margin:10px 0 4px 0;color:#111;padding-bottom:3px;border-bottom:0.5px solid #ccc;"';
    const P_PDF = 'style="font-size:11.5px;line-height:1.5;color:#222;margin-bottom:4px;"';

    for (const line of lines) {
        const t = line.trimEnd();

        if (/^###\s/.test(t)) {
            flush();
            const headerText = t.replace(/^###\s+/, '');
            const split = splitSubSection(headerText);
            if (split) {
                parts.push(`<p ${H5_PDF}>${inlinePdf(split.title)}</p>`);
                parts.push(`<p ${P_PDF}>${inlinePdf(split.body)}</p>`);
            } else {
                parts.push(`<p ${H5_PDF}>${inlinePdf(headerText)}</p>`);
            }
        } else if (/^##\s/.test(t)) {
            flush();
            parts.push(`<p style="font-size:12px;font-weight:700;margin:10px 0 4px 0;color:#1a1a1a;border-bottom:0.5px solid #999;padding-bottom:2px;">${inlinePdf(t.replace(/^##\s+/, ''))}</p>`);
        } else if (/^#\s/.test(t)) {
            flush();
            parts.push(`<p style="font-size:13px;font-weight:700;margin:12px 0 5px 0;color:#1a1a1a;">${inlinePdf(t.replace(/^#\s+/, ''))}</p>`);
        } else if (/^[-•*]\s/.test(t)) {
            if (listKind !== 'ul') { flush(); listKind = 'ul'; }
            listItems.push(`<li style="margin-bottom:2px;font-size:11px;">${inlinePdf(t.replace(/^[-•*]\s+/, ''))}</li>`);
        } else if (/^\d+[.)]\s/.test(t)) {
            if (listKind !== 'ol') { flush(); listKind = 'ol'; }
            listItems.push(`<li style="margin-bottom:2px;font-size:11px;">${inlinePdf(t.replace(/^\d+[.)]\s+/, ''))}</li>`);
        } else if (t.trim() === '') {
            flush();
        } else {
            flush();
            const sub = splitSubSection(t);
            if (sub) {
                parts.push(`<p ${H5_PDF}>${inlinePdf(sub.title)}</p>`);
                parts.push(`<p ${P_PDF}>${inlinePdf(sub.body)}</p>`);
            } else {
                parts.push(`<p ${P_PDF}>${inlinePdf(t)}</p>`);
            }
        }
    }
    flush();

    return parts.join('');
}

/**
 * Strips markdown syntax from text, returning clean plain text.
 * Use this for truncated summaries and preview snippets.
 */
export function stripMarkdown(text: string): string {
    if (!text) return '';
    return text
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/^[-•]\s+/gm, '')
        .replace(/^\d+[.)]\s+/gm, '')
        .replace(/\n{2,}/g, ' ')
        .replace(/\n/g, ' ')
        .trim();
}

/**
 * Section config for the assessment report (6 top-level sections).
 * Reading/Writing/Numeracy are sub-sections (A/B/C) within Assessment Findings.
 */
export const ASSESSMENT_SECTIONS = [
    { key: '1', title: 'Reason for Referral',       color: 'rose',   bgClass: 'bg-rose-50',   borderClass: 'border-rose-200',   titleClass: 'text-rose-800' },
    { key: '2', title: 'Assessment Findings',        color: 'violet', bgClass: 'bg-violet-50', borderClass: 'border-violet-200', titleClass: 'text-violet-800' },
    { key: '3', title: 'Behaviour & Attention',      color: 'teal',   bgClass: 'bg-teal-50',   borderClass: 'border-teal-200',   titleClass: 'text-teal-800' },
    { key: '4', title: 'Key Strengths',              color: 'green',  bgClass: 'bg-green-50',  borderClass: 'border-green-200',  titleClass: 'text-green-800' },
    { key: '5', title: 'Recommended Interventions',  color: 'indigo', bgClass: 'bg-indigo-50', borderClass: 'border-indigo-200', titleClass: 'text-indigo-800' },
    { key: '6', title: 'Closing Statement',          color: 'gray',   bgClass: 'bg-gray-50',   borderClass: 'border-gray-200',   titleClass: 'text-gray-800' },
];

export const LESSON_PLAN_SECTIONS = [
    { key: '1', title: 'Executive Summary', color: 'blue', bgClass: 'bg-blue-50', borderClass: 'border-blue-200', titleClass: 'text-blue-800' },
    { key: '2', title: 'Lesson Plan Analysis', color: 'purple', bgClass: 'bg-purple-50', borderClass: 'border-purple-200', titleClass: 'text-purple-800' },
    { key: '3', title: 'Teaching Strategies Effectiveness', color: 'green', bgClass: 'bg-green-50', borderClass: 'border-green-200', titleClass: 'text-green-800' },
    { key: '4', title: 'Student Progress Patterns', color: 'amber', bgClass: 'bg-amber-50', borderClass: 'border-amber-200', titleClass: 'text-amber-800' },
    { key: '5', title: 'Areas of Remediation', color: 'teal', bgClass: 'bg-teal-50', borderClass: 'border-teal-200', titleClass: 'text-teal-800' },
    { key: '6', title: 'Recommendations', color: 'indigo', bgClass: 'bg-indigo-50', borderClass: 'border-indigo-200', titleClass: 'text-indigo-800' },
    { key: '7', title: 'Next Steps', color: 'sky', bgClass: 'bg-sky-50', borderClass: 'border-sky-200', titleClass: 'text-sky-800' },
    { key: '8', title: 'Closing Statement', color: 'gray', bgClass: 'bg-gray-50', borderClass: 'border-gray-200', titleClass: 'text-gray-800' },
];

/**
 * Parses the report content (## section headers) into individual sections.
 * Handles both numbered (## 1. Title) and unnumbered (## Title) formats.
 */
export function parseReportSections(content: string): { heading: string; body: string }[] {
    if (!content) return [];

    const sectionRegex = /^##\s+(?:\d+\.\s+)?(.+)$/gm;
    const sections: { heading: string; body: string }[] = [];
    const matches: { index: number; heading: string }[] = [];

    let match;
    while ((match = sectionRegex.exec(content)) !== null) {
        matches.push({ index: match.index, heading: match[1].trim() });
    }

    for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index + content.substring(matches[i].index).indexOf('\n') + 1;
        const end = i + 1 < matches.length ? matches[i + 1].index : content.length;
        sections.push({
            heading: matches[i].heading,
            body: content.substring(start, end).trim(),
        });
    }

    return sections;
}

/** PDF section colors (6 top-level sections) */
export const PDF_SECTION_COLORS: Record<string, { bg: string; border: string; title: string }> = {
    '0': { bg: '#fff1f2', border: '#fecdd3', title: '#9f1239' },  // rose   - Reason for Referral
    '1': { bg: '#f5f3ff', border: '#ddd6fe', title: '#4c1d95' },  // violet - Assessment Findings
    '2': { bg: '#f0fdfa', border: '#99f6e4', title: '#115e59' },  // teal   - Behaviour & Attention
    '3': { bg: '#f0fdf4', border: '#bbf7d0', title: '#166534' },  // green  - Key Strengths
    '4': { bg: '#eef2ff', border: '#c7d2fe', title: '#3730a3' },  // indigo - Recommended Interventions
    '5': { bg: '#f9fafb', border: '#e5e7eb', title: '#374151' },  // gray   - Closing Statement
};

/**
 * Returns word count and section count for a report's content.
 */
export function getReportStats(content: string): { wordCount: number; sectionCount: number; readingTime: string } {
    if (!content) return { wordCount: 0, sectionCount: 0, readingTime: '0 min' };
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const sections = parseReportSections(content).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return { wordCount: words, sectionCount: sections, readingTime: `${minutes} min read` };
}

/**
 * Returns TailwindCSS classes for a report status badge.
 */
export function getStatusBadgeClasses(status: string): string {
    switch (status?.toUpperCase()) {
        case 'SUBMITTED':
            return 'bg-green-100 text-green-800 border-green-200';
        case 'COMPLETED':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'APPROVED':
            return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'REJECTED':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'AI_DRAFT':
        case 'DRAFT':
        default:
            return 'bg-gray-100 text-gray-700 border-gray-200';
    }
}

export function getStatusLabel(status: string): string {
    switch (status?.toUpperCase()) {
        case 'AI_DRAFT':
        case 'DRAFT':    return 'Draft';
        case 'SUBMITTED': return 'Submitted';
        case 'COMPLETED': return 'Completed';
        case 'APPROVED':  return 'Approved';
        case 'REJECTED':  return 'Rejected';
        default:          return status || 'Draft';
    }
}

/**
 * Returns an accent border class for the left-side of a report card.
 */
export function getReportTypeBorderColor(type: string): string {
    switch (type?.toUpperCase()) {
        case 'ASSESSMENT':
            return 'border-l-blue-500';
        case 'LESSON_PLAN':
            return 'border-l-purple-500';
        default:
            return 'border-l-gray-400';
    }
}

/**
 * Represents a single line in a diff comparison.
 */
export interface DiffLine {
    type: 'added' | 'removed' | 'unchanged';
    content: string;
    oldLineNumber?: number;
    newLineNumber?: number;
}

/**
 * Computes a line-by-line diff between two text strings using LCS.
 * Returns an array of DiffLine objects for rendering in a diff viewer.
 */
export function computeLineDiff(oldText: string, newText: string): DiffLine[] {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');

    // Build LCS table
    const m = oldLines.length;
    const n = newLines.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (oldLines[i - 1] === newLines[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    // Backtrack to produce diff
    const result: DiffLine[] = [];
    let i = m, j = n;

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
            result.push({ type: 'unchanged', content: oldLines[i - 1], oldLineNumber: i, newLineNumber: j });
            i--; j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            result.push({ type: 'added', content: newLines[j - 1], newLineNumber: j });
            j--;
        } else {
            result.push({ type: 'removed', content: oldLines[i - 1], oldLineNumber: i });
            i--;
        }
    }

    return result.reverse();
}

/**
 * Returns summary stats for a diff result.
 */
export function getDiffStats(diffLines: DiffLine[]): { added: number; removed: number; unchanged: number } {
    return diffLines.reduce(
        (acc, line) => {
            acc[line.type]++;
            return acc;
        },
        { added: 0, removed: 0, unchanged: 0 }
    );
}

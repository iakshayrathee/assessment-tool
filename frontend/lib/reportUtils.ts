/**
 * Converts markdown text to styled HTML for report rendering.
 * Handles headings, bold, italic, lists, and line breaks.
 */
export function markdownToHtml(text: string): string {
    if (!text) return '';

    let html = text
        // Escape any existing HTML tags first (except <strong>, <em>)
        .replace(/<(?!\/?(?:strong|em|br)\b)[^>]+>/g, (match) =>
            match.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        )
        // Headers - ## before #
        .replace(/^###\s+(.*)$/gm, '<h5 class="text-base font-semibold mt-4 mb-2 text-gray-800">$1</h5>')
        .replace(/^##\s+(.*)$/gm, '<h4 class="text-lg font-semibold mt-5 mb-3 text-blue-800 border-b border-blue-100 pb-1">$1</h4>')
        .replace(/^#\s+(.*)$/gm, '<h3 class="text-xl font-bold mt-6 mb-3 text-blue-900">$1</h3>')
        // Bold and italic
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>')
        .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
        // Numbered lists: "1. item" or "1) item"
        .replace(/^(\d+)[.)]\s+(.*)$/gm, '<li class="ml-6 mb-1 list-decimal">$2</li>')
        // Bullet lists: "- item" or "• item"
        .replace(/^[-•]\s+(.*)$/gm, '<li class="ml-6 mb-1 list-disc">$1</li>')
        // Wrap consecutive <li> items in <ul> or <ol> (simplified)
        .replace(/((?:<li class="ml-6 mb-1 list-disc">.*<\/li>\n?)+)/g, '<ul class="my-2 space-y-1">$1</ul>')
        .replace(/((?:<li class="ml-6 mb-1 list-decimal">.*<\/li>\n?)+)/g, '<ol class="my-2 space-y-1 list-decimal">$1</ol>')
        // Double newlines = paragraph break
        .replace(/\n\n/g, '</p><p class="mb-3">')
        // Single newlines = line break
        .replace(/\n/g, '<br />');

    // Wrap in paragraph
    html = `<p class="mb-3">${html}</p>`;

    return html;
}

/**
 * Converts markdown to inline HTML suitable for PDF rendering (with inline styles).
 */
export function markdownToHtmlForPdf(text: string): string {
    if (!text) return '';

    let html = text
        .replace(/^###\s+(.*)$/gm, '<h5 style="font-size:14px;font-weight:600;margin:12px 0 8px 0;color:#2d3748;">$1</h5>')
        .replace(/^##\s+(.*)$/gm, '<h4 style="font-size:16px;font-weight:600;margin:16px 0 10px 0;color:#2b6cb0;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">$1</h4>')
        .replace(/^#\s+(.*)$/gm, '<h3 style="font-size:18px;font-weight:700;margin:20px 0 10px 0;color:#2a4365;">$1</h3>')
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#2d3748;">$1</strong>')
        .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
        .replace(/^(\d+)[.)]\s+(.*)$/gm, '<li style="margin:0 0 4px 24px;list-style-type:decimal;">$2</li>')
        .replace(/^[-•]\s+(.*)$/gm, '<li style="margin:0 0 4px 24px;list-style-type:disc;">$2</li>')
        .replace(/((?:<li style="margin:0 0 4px 24px;list-style-type:disc;">.*<\/li>\n?)+)/g, '<ul style="margin:8px 0;">$1</ul>')
        .replace(/((?:<li style="margin:0 0 4px 24px;list-style-type:decimal;">.*<\/li>\n?)+)/g, '<ol style="margin:8px 0;">$1</ol>')
        .replace(/\n\n/g, '</p><p style="margin-bottom:10px;">')
        .replace(/\n/g, '<br />');

    return `<p style="margin-bottom:10px;">${html}</p>`;
}

/**
 * Section config for the 8 assessment report sections.
 */
export const ASSESSMENT_SECTIONS = [
    { key: '1', title: '📊 Overall Interpretation of Assessment', color: 'blue', bgClass: 'bg-blue-50', borderClass: 'border-blue-200', titleClass: 'text-blue-800' },
    { key: '2', title: '💪 Key Strengths of the Child', color: 'green', bgClass: 'bg-green-50', borderClass: 'border-green-200', titleClass: 'text-green-800' },
    { key: '3', title: '📋 Major Skill Gaps Identified', color: 'amber', bgClass: 'bg-amber-50', borderClass: 'border-amber-200', titleClass: 'text-amber-800' },
    { key: '4', title: '🔍 Areas to Investigate Further', color: 'purple', bgClass: 'bg-purple-50', borderClass: 'border-purple-200', titleClass: 'text-purple-800' },
    { key: '5', title: '👨‍👩‍👧 How to Explain This to Parents/Teachers', color: 'sky', bgClass: 'bg-sky-50', borderClass: 'border-sky-200', titleClass: 'text-sky-800' },
    { key: '6', title: '🎯 Recommended Interventions', color: 'teal', bgClass: 'bg-teal-50', borderClass: 'border-teal-200', titleClass: 'text-teal-800' },
    { key: '7', title: '📅 Suggested Goals for Next 6 Months', color: 'indigo', bgClass: 'bg-indigo-50', borderClass: 'border-indigo-200', titleClass: 'text-indigo-800' },
    { key: '8', title: '✅ Closing Statement', color: 'gray', bgClass: 'bg-gray-50', borderClass: 'border-gray-200', titleClass: 'text-gray-800' },
];

export const LESSON_PLAN_SECTIONS = [
    { key: '1', title: '📊 Executive Summary', color: 'blue', bgClass: 'bg-blue-50', borderClass: 'border-blue-200', titleClass: 'text-blue-800' },
    { key: '2', title: '📝 Lesson Plan Analysis', color: 'purple', bgClass: 'bg-purple-50', borderClass: 'border-purple-200', titleClass: 'text-purple-800' },
    { key: '3', title: '🎯 Teaching Strategies Effectiveness', color: 'green', bgClass: 'bg-green-50', borderClass: 'border-green-200', titleClass: 'text-green-800' },
    { key: '4', title: '📈 Student Progress Patterns', color: 'amber', bgClass: 'bg-amber-50', borderClass: 'border-amber-200', titleClass: 'text-amber-800' },
    { key: '5', title: '🔧 Areas of Remediation', color: 'teal', bgClass: 'bg-teal-50', borderClass: 'border-teal-200', titleClass: 'text-teal-800' },
    { key: '6', title: '💡 Recommendations', color: 'indigo', bgClass: 'bg-indigo-50', borderClass: 'border-indigo-200', titleClass: 'text-indigo-800' },
    { key: '7', title: '⏭️ Next Steps', color: 'sky', bgClass: 'bg-sky-50', borderClass: 'border-sky-200', titleClass: 'text-sky-800' },
    { key: '8', title: '✅ Closing Statement', color: 'gray', bgClass: 'bg-gray-50', borderClass: 'border-gray-200', titleClass: 'text-gray-800' },
];

/**
 * Parses the report content (which has ## numbered sections) into individual sections.
 */
export function parseReportSections(content: string): { heading: string; body: string }[] {
    if (!content) return [];

    // Split by "## N." pattern
    const sectionRegex = /^##\s+\d+\.\s+(.*)$/gm;
    const sections: { heading: string; body: string }[] = [];
    const matches: { index: number; heading: string }[] = [];

    let match;
    while ((match = sectionRegex.exec(content)) !== null) {
        matches.push({ index: match.index, heading: match[1] });
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

/** PDF section colors */
export const PDF_SECTION_COLORS: Record<string, { bg: string; border: string; title: string }> = {
    '0': { bg: '#eff6ff', border: '#bfdbfe', title: '#1e40af' },  // blue
    '1': { bg: '#f0fdf4', border: '#bbf7d0', title: '#166534' },  // green
    '2': { bg: '#fffbeb', border: '#fde68a', title: '#92400e' },  // amber
    '3': { bg: '#faf5ff', border: '#e9d5ff', title: '#6b21a8' },  // purple
    '4': { bg: '#f0f9ff', border: '#bae6fd', title: '#0369a1' },  // sky
    '5': { bg: '#f0fdfa', border: '#99f6e4', title: '#115e59' },  // teal
    '6': { bg: '#eef2ff', border: '#c7d2fe', title: '#3730a3' },  // indigo
    '7': { bg: '#f9fafb', border: '#e5e7eb', title: '#374151' },  // gray
};

import {
  markdownToHtml,
  markdownToHtmlForPdf,
  stripMarkdown,
  ASSESSMENT_SECTIONS,
  LESSON_PLAN_SECTIONS,
  parseReportSections,
  PDF_SECTION_COLORS,
  getReportStats,
  getStatusBadgeClasses,
  getReportTypeBorderColor,
  computeLineDiff,
  getDiffStats,
  DiffLine,
} from '@/lib/reportUtils';

// ─── markdownToHtml ──────────────────────────────────────────────────────────

describe('markdownToHtml', () => {
  it('returns empty string for empty input', () => {
    expect(markdownToHtml('')).toBe('');
    expect(markdownToHtml(null as any)).toBe('');
    expect(markdownToHtml(undefined as any)).toBe('');
  });

  it('wraps plain text in a paragraph', () => {
    const result = markdownToHtml('Hello world');
    expect(result).toContain('<p');
    expect(result).toContain('Hello world');
  });

  it('converts # headings to h3', () => {
    const result = markdownToHtml('# Title');
    expect(result).toContain('<h3');
    expect(result).toContain('Title');
  });

  it('converts ## headings to h4', () => {
    const result = markdownToHtml('## Subtitle');
    expect(result).toContain('<h4');
    expect(result).toContain('Subtitle');
  });

  it('converts ### headings to h5', () => {
    const result = markdownToHtml('### Sub-subtitle');
    expect(result).toContain('<h5');
    expect(result).toContain('Sub-subtitle');
  });

  it('converts unordered list items with -', () => {
    const result = markdownToHtml('- Item one\n- Item two');
    expect(result).toContain('<ul');
    expect(result).toContain('<li');
    expect(result).toContain('Item one');
    expect(result).toContain('Item two');
  });

  it('converts ordered list items', () => {
    const result = markdownToHtml('1. First\n2. Second');
    expect(result).toContain('<ol');
    expect(result).toContain('<li');
    expect(result).toContain('First');
    expect(result).toContain('Second');
  });

  it('handles bold markdown (**text**)', () => {
    const result = markdownToHtml('This is **bold** text');
    expect(result).toContain('<strong');
    expect(result).toContain('bold');
  });

  it('handles italic markdown (*text*)', () => {
    const result = markdownToHtml('This is *italic* text');
    expect(result).toContain('<em>italic</em>');
  });

  it('handles inline code (`code`)', () => {
    const result = markdownToHtml('Use `console.log` here');
    expect(result).toContain('<code');
    expect(result).toContain('console.log');
  });

  it('escapes HTML characters', () => {
    const result = markdownToHtml('Use <script> tag');
    expect(result).toContain('&lt;script&gt;');
    expect(result).not.toContain('<script>');
  });

  it('handles mixed content', () => {
    const md = '# Title\n\nSome paragraph.\n\n- Item 1\n- Item 2\n\nAnother paragraph.';
    const result = markdownToHtml(md);
    expect(result).toContain('<h3');
    expect(result).toContain('<ul');
    expect(result).toContain('<p');
  });

  it('normalizes CRLF line endings', () => {
    const result = markdownToHtml('Line one\r\nLine two');
    // Should not contain raw \r
    expect(result).not.toContain('\r');
  });
});

// ─── markdownToHtmlForPdf ────────────────────────────────────────────────────

describe('markdownToHtmlForPdf', () => {
  it('returns empty string for empty input', () => {
    expect(markdownToHtmlForPdf('')).toBe('');
  });

  it('uses inline styles instead of class names', () => {
    const result = markdownToHtmlForPdf('# Title');
    expect(result).toContain('style=');
    expect(result).not.toContain('class=');
  });

  it('handles unordered lists', () => {
    const result = markdownToHtmlForPdf('- Item A\n- Item B');
    expect(result).toContain('<ul');
    expect(result).toContain('<li');
  });

  it('handles ordered lists', () => {
    const result = markdownToHtmlForPdf('1. First\n2. Second');
    expect(result).toContain('<ol');
  });
});

// ─── stripMarkdown ───────────────────────────────────────────────────────────

describe('stripMarkdown', () => {
  it('returns empty string for falsy input', () => {
    expect(stripMarkdown('')).toBe('');
    expect(stripMarkdown(null as any)).toBe('');
  });

  it('removes headers', () => {
    expect(stripMarkdown('# Title')).toBe('Title');
    expect(stripMarkdown('## Subtitle')).toBe('Subtitle');
    expect(stripMarkdown('### Sub')).toBe('Sub');
  });

  it('removes bold markers', () => {
    expect(stripMarkdown('This is **bold** text')).toBe('This is bold text');
  });

  it('removes italic markers', () => {
    expect(stripMarkdown('This is *italic* text')).toBe('This is italic text');
  });

  it('removes bold+italic markers', () => {
    expect(stripMarkdown('***both***')).toBe('both');
  });

  it('removes inline code backticks', () => {
    expect(stripMarkdown('Use `code` here')).toBe('Use code here');
  });

  it('removes bullet list markers', () => {
    expect(stripMarkdown('- Item one')).toBe('Item one');
  });

  it('removes numbered list markers', () => {
    expect(stripMarkdown('1. First item')).toBe('First item');
  });

  it('collapses multiple newlines to space', () => {
    const result = stripMarkdown('Para one\n\nPara two');
    expect(result).toBe('Para one Para two');
  });
});

// ─── ASSESSMENT_SECTIONS & LESSON_PLAN_SECTIONS ──────────────────────────────

describe('section config arrays', () => {
  it('ASSESSMENT_SECTIONS has 10 entries', () => {
    expect(ASSESSMENT_SECTIONS).toHaveLength(10);
  });

  it('each assessment section has required properties', () => {
    for (const sec of ASSESSMENT_SECTIONS) {
      expect(sec).toHaveProperty('key');
      expect(sec).toHaveProperty('title');
      expect(sec).toHaveProperty('color');
      expect(sec).toHaveProperty('bgClass');
      expect(sec).toHaveProperty('borderClass');
      expect(sec).toHaveProperty('titleClass');
    }
  });

  it('LESSON_PLAN_SECTIONS has 8 entries', () => {
    expect(LESSON_PLAN_SECTIONS).toHaveLength(8);
  });

  it('each lesson plan section has required properties', () => {
    for (const sec of LESSON_PLAN_SECTIONS) {
      expect(sec).toHaveProperty('key');
      expect(sec).toHaveProperty('title');
    }
  });
});

// ─── parseReportSections ─────────────────────────────────────────────────────

describe('parseReportSections', () => {
  it('returns empty array for empty content', () => {
    expect(parseReportSections('')).toEqual([]);
    expect(parseReportSections(null as any)).toEqual([]);
  });

  it('parses numbered sections', () => {
    const content = `## 1. Introduction\nThis is the intro.\n\n## 2. Findings\nThese are findings.`;
    const sections = parseReportSections(content);
    expect(sections).toHaveLength(2);
    expect(sections[0].heading).toBe('Introduction');
    expect(sections[1].heading).toBe('Findings');
  });

  it('captures body text between sections', () => {
    const content = `## 1. First\nBody of first section.\n\n## 2. Second\nBody of second section.`;
    const sections = parseReportSections(content);
    expect(sections[0].body).toContain('Body of first section');
    expect(sections[1].body).toContain('Body of second section');
  });

  it('handles content with no sections', () => {
    const content = 'Just plain text without any section headers.';
    const sections = parseReportSections(content);
    expect(sections).toHaveLength(0);
  });
});

// ─── PDF_SECTION_COLORS ──────────────────────────────────────────────────────

describe('PDF_SECTION_COLORS', () => {
  it('has entries for indices 0 through 9', () => {
    for (let i = 0; i <= 9; i++) {
      expect(PDF_SECTION_COLORS[String(i)]).toBeDefined();
      expect(PDF_SECTION_COLORS[String(i)]).toHaveProperty('bg');
      expect(PDF_SECTION_COLORS[String(i)]).toHaveProperty('border');
      expect(PDF_SECTION_COLORS[String(i)]).toHaveProperty('title');
    }
  });
});

// ─── getReportStats ──────────────────────────────────────────────────────────

describe('getReportStats', () => {
  it('returns zeros for empty content', () => {
    const stats = getReportStats('');
    expect(stats.wordCount).toBe(0);
    expect(stats.sectionCount).toBe(0);
    expect(stats.readingTime).toBe('0 min');
  });

  it('counts words correctly', () => {
    const stats = getReportStats('one two three four five');
    expect(stats.wordCount).toBe(5);
  });

  it('calculates reading time (200 wpm, minimum 1 min)', () => {
    const shortText = 'Hello world';
    expect(getReportStats(shortText).readingTime).toBe('1 min read');

    // 400 words → ceil(400/200) = 2 min
    const longText = Array(400).fill('word').join(' ');
    expect(getReportStats(longText).readingTime).toBe('2 min read');
  });

  it('counts sections from ## numbered headers', () => {
    const content = '## 1. Intro\nBody\n\n## 2. Methods\nBody';
    const stats = getReportStats(content);
    expect(stats.sectionCount).toBe(2);
  });
});

// ─── getStatusBadgeClasses ───────────────────────────────────────────────────

describe('getStatusBadgeClasses', () => {
  it('returns green classes for SUBMITTED', () => {
    expect(getStatusBadgeClasses('SUBMITTED')).toContain('bg-green-100');
  });

  it('returns blue classes for COMPLETED', () => {
    expect(getStatusBadgeClasses('COMPLETED')).toContain('bg-blue-100');
  });

  it('returns emerald classes for APPROVED', () => {
    expect(getStatusBadgeClasses('APPROVED')).toContain('bg-emerald-100');
  });

  it('returns red classes for REJECTED', () => {
    expect(getStatusBadgeClasses('REJECTED')).toContain('bg-red-100');
  });

  it('returns gray classes for DRAFT (default)', () => {
    expect(getStatusBadgeClasses('DRAFT')).toContain('bg-gray-100');
  });

  it('is case-insensitive', () => {
    expect(getStatusBadgeClasses('submitted')).toContain('bg-green-100');
    expect(getStatusBadgeClasses('Completed')).toContain('bg-blue-100');
  });

  it('returns gray classes for unknown status', () => {
    expect(getStatusBadgeClasses('UNKNOWN')).toContain('bg-gray-100');
  });

  it('handles null/undefined safely', () => {
    expect(getStatusBadgeClasses(null as any)).toContain('bg-gray-100');
    expect(getStatusBadgeClasses(undefined as any)).toContain('bg-gray-100');
  });
});

// ─── getReportTypeBorderColor ────────────────────────────────────────────────

describe('getReportTypeBorderColor', () => {
  it('returns blue border for ASSESSMENT', () => {
    expect(getReportTypeBorderColor('ASSESSMENT')).toBe('border-l-blue-500');
  });

  it('returns purple border for LESSON_PLAN', () => {
    expect(getReportTypeBorderColor('LESSON_PLAN')).toBe('border-l-purple-500');
  });

  it('returns gray border for unknown type', () => {
    expect(getReportTypeBorderColor('OTHER')).toBe('border-l-gray-400');
  });

  it('is case-insensitive', () => {
    expect(getReportTypeBorderColor('assessment')).toBe('border-l-blue-500');
  });

  it('handles null/undefined safely', () => {
    expect(getReportTypeBorderColor(null as any)).toBe('border-l-gray-400');
  });
});

// ─── computeLineDiff ─────────────────────────────────────────────────────────

describe('computeLineDiff', () => {
  it('returns unchanged lines for identical text', () => {
    const lines = computeLineDiff('abc\ndef', 'abc\ndef');
    expect(lines).toHaveLength(2);
    expect(lines.every(l => l.type === 'unchanged')).toBe(true);
  });

  it('detects added lines', () => {
    const lines = computeLineDiff('line1', 'line1\nline2');
    const added = lines.filter(l => l.type === 'added');
    expect(added).toHaveLength(1);
    expect(added[0].content).toBe('line2');
  });

  it('detects removed lines', () => {
    const lines = computeLineDiff('line1\nline2', 'line1');
    const removed = lines.filter(l => l.type === 'removed');
    expect(removed).toHaveLength(1);
    expect(removed[0].content).toBe('line2');
  });

  it('detects modified lines as remove + add', () => {
    const lines = computeLineDiff('old line', 'new line');
    expect(lines.some(l => l.type === 'removed' && l.content === 'old line')).toBe(true);
    expect(lines.some(l => l.type === 'added' && l.content === 'new line')).toBe(true);
  });

  it('assigns correct line numbers', () => {
    const lines = computeLineDiff('a\nb\nc', 'a\nb\nc');
    expect(lines[0].oldLineNumber).toBe(1);
    expect(lines[0].newLineNumber).toBe(1);
    expect(lines[2].oldLineNumber).toBe(3);
    expect(lines[2].newLineNumber).toBe(3);
  });

  it('handles empty old text (all additions)', () => {
    const lines = computeLineDiff('', 'new');
    expect(lines.filter(l => l.type === 'added').length).toBeGreaterThanOrEqual(1);
  });

  it('handles empty new text (all removals)', () => {
    const lines = computeLineDiff('old', '');
    expect(lines.filter(l => l.type === 'removed').length).toBeGreaterThanOrEqual(1);
  });
});

// ─── getDiffStats ────────────────────────────────────────────────────────────

describe('getDiffStats', () => {
  it('counts added, removed, and unchanged lines', () => {
    const lines: DiffLine[] = [
      { type: 'unchanged', content: 'same', oldLineNumber: 1, newLineNumber: 1 },
      { type: 'removed', content: 'old', oldLineNumber: 2 },
      { type: 'added', content: 'new', newLineNumber: 2 },
      { type: 'added', content: 'extra', newLineNumber: 3 },
    ];
    const stats = getDiffStats(lines);
    expect(stats.unchanged).toBe(1);
    expect(stats.removed).toBe(1);
    expect(stats.added).toBe(2);
  });

  it('returns zeros for empty array', () => {
    const stats = getDiffStats([]);
    expect(stats).toEqual({ added: 0, removed: 0, unchanged: 0 });
  });
});

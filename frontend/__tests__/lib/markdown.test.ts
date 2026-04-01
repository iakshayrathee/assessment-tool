import { markdownToHtml, sanitizeHtml, safeMarkdownToHtml } from '@/lib/markdown';

describe('markdownToHtml (lib/markdown.ts)', () => {
  it('returns empty string for empty input', () => {
    expect(markdownToHtml('')).toBe('');
    expect(markdownToHtml(null as any)).toBe('');
  });

  it('converts bold text', () => {
    const result = markdownToHtml('This is **bold** text');
    expect(result).toContain('<strong>bold</strong>');
  });

  it('converts italic text', () => {
    const result = markdownToHtml('This is *italic* text');
    expect(result).toContain('<em>italic</em>');
  });

  it('converts # headers to h3', () => {
    const result = markdownToHtml('# My Title');
    expect(result).toContain('<h3');
    expect(result).toContain('My Title');
  });

  it('converts ## headers to h4', () => {
    const result = markdownToHtml('## Sub Title');
    expect(result).toContain('<h4');
    expect(result).toContain('Sub Title');
  });

  it('converts paragraph breaks', () => {
    const result = markdownToHtml('Para one\n\nPara two');
    expect(result).toContain('</p><p');
  });

  it('converts single newlines to <br>', () => {
    const result = markdownToHtml('Line one\nLine two');
    expect(result).toContain('<br>');
  });

  it('wraps plain text in a paragraph if it does not start with HTML', () => {
    const result = markdownToHtml('Just text');
    expect(result).toMatch(/^<p.*>Just text<\/p>$/);
  });

  it('cleans up empty paragraph tags', () => {
    const result = markdownToHtml('Text\n\n\n\nMore text');
    expect(result).not.toContain('<p class="mb-3"></p>');
  });
});

describe('sanitizeHtml', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null as any)).toBe('');
  });

  it('removes script tags', () => {
    const result = sanitizeHtml('<p>Safe</p><script>alert("xss")</script>');
    expect(result).not.toContain('<script');
    expect(result).toContain('<p>Safe</p>');
  });

  it('removes inline event handlers', () => {
    const result = sanitizeHtml('<div onclick="alert(1)">text</div>');
    expect(result).not.toContain('onclick');
    expect(result).toContain('text');
  });

  it('removes javascript: protocol', () => {
    const result = sanitizeHtml('<a href=javascript:"alert(1)">link</a>');
    expect(result).not.toContain('javascript:');
  });
});

describe('safeMarkdownToHtml', () => {
  it('converts markdown and sanitizes output', () => {
    const result = safeMarkdownToHtml('**Bold** text');
    expect(result).toContain('<strong>Bold</strong>');
  });

  it('removes XSS from markdown content', () => {
    const result = safeMarkdownToHtml('Normal text <script>alert(1)</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('Normal text');
  });
});

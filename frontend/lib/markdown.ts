/**
 * Simple markdown to HTML converter for report content
 * Handles basic markdown syntax used in reports
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  let html = markdown;
  
  // Handle bold text (**text**)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Handle italic text (*text*)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Handle headers (# Header)
  html = html.replace(/^#\s+(.*)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
  html = html.replace(/^##\s+(.*)$/gm, '<h4 class="text-md font-medium mt-3 mb-1">$1</h4>');
  
  // Handle lists (* item)
  html = html.replace(/^\*\s+(.*)$/gm, '<li class="ml-4 list-disc">$1</li>');
  
  // Handle numbered lists (1. item)
  html = html.replace(/^\d+\.\s+(.*)$/gm, '<li class="ml-4 list-decimal">$1</li>');
  
  // Wrap list items in ul/ol
  if (html.includes('<li')) {
    // Check if it's an ordered list (starts with number)
    if (/^\d+\./.test(markdown)) {
      html = html.replace(/(<li[^>]*>.*<\/li>)/gs, '<ol class="pl-6 mb-3">$1</ol>');
    } else {
      html = html.replace(/(<li[^>]*>.*<\/li>)/gs, '<ul class="pl-6 mb-3">$1</ul>');
    }
  }
  
  // Handle paragraphs (ensure proper spacing)
  html = html.replace(/\n\n+/g, '</p><p class="mb-3">');
  html = html.replace(/\n/g, '<br>');
  
  // Wrap the entire content in paragraphs if needed
  if (!html.startsWith('<')) {
    html = `<p class="mb-3">${html}</p>`;
  }
  
  // Clean up any empty tags
  html = html.replace(/<p class="mb-3"><\/p>/g, '');
  html = html.replace(/<p class="mb-3"><br><\/p>/g, '');
  
  return html.trim();
}

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Basic sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:\s*["'][^"']*["']/gi, '');
}

/**
 * Converts markdown to safe HTML for display
 */
export function safeMarkdownToHtml(markdown: string): string {
  const html = markdownToHtml(markdown);
  return sanitizeHtml(html);
}
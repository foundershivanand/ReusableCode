export interface MarkdownRenderer {
  render(markdown: string): Promise<string>;
}

export class SimpleMarkdownRenderer implements MarkdownRenderer {
  async render(markdown: string): Promise<string> {
    // Basic HTML parser for tests and fallback
    return markdown
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
      .replace(/\*(.*)\*/gim, "<em>$1</em>");
  }
}

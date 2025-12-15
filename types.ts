
export enum Category {
  PROCEDURE = 'Procedimiento',
  DEFINITION = 'Definición',
  TROUBLESHOOTING = 'Solución de Problemas',
  GENERAL = 'General',
  SNIPPET = 'Fragmento de Código'
}

export interface CodeSnippet {
  language: string; // e.g., 'bash', 'javascript', 'python', 'sql'
  code: string;
  description: string; // Brief explanation of what the code does
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  rawContent: string;
  category: Category;
  summary: string;
  steps: string[]; // For procedures
  codeSnippets: CodeSnippet[]; // NEW: Structured code blocks
  mermaidChart: string | null; // AI generated diagram code
  tags: string[];
  imageUrls: string[]; // Base64 strings
  createdAt: number;
}

export interface AIAnalysisResult {
  summary: string;
  steps: string[];
  codeSnippets: CodeSnippet[];
  mermaidChart: string;
  suggestedTags: string[];
  suggestedCategory: string;
  titleSuggestion: string;
  extractedContent: string;
}
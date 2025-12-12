export enum Category {
  PROCEDURE = 'Procedimiento',
  DEFINITION = 'Definición',
  TROUBLESHOOTING = 'Solución de Problemas',
  GENERAL = 'General',
  SNIPPET = 'Fragmento de Código'
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  rawContent: string;
  category: Category;
  summary: string;
  steps: string[]; // For procedures
  mermaidChart: string | null; // AI generated diagram code
  tags: string[];
  imageUrls: string[]; // Base64 strings
  createdAt: number;
}

export interface AIAnalysisResult {
  summary: string;
  steps: string[];
  mermaidChart: string;
  suggestedTags: string[];
  suggestedCategory: string;
  titleSuggestion: string;
}
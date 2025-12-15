import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Un resumen conciso del conocimiento proporcionado.",
    },
    steps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Si el texto describe un procedimiento, extrae los pasos secuenciales claramente. Si es una definición simple, devuelve array vacío.",
    },
    codeSnippets: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          language: { type: Type.STRING, description: "El lenguaje de programación o entorno (ej: bash, javascript, sql, python)." },
          code: { type: Type.STRING, description: "El código exacto o comando. NO uses bloques markdown (```) aquí, solo el texto plano del código." },
          description: { type: Type.STRING, description: "Una breve descripción de qué hace este comando o bloque." }
        },
        required: ["language", "code", "description"]
      },
      description: "Extrae cualquier comando de terminal, función de código, consulta SQL o configuración importante mencionada."
    },
    mermaidChart: {
      type: Type.STRING,
      description: "Genera un diagrama Mermaid (graph TD) que represente la lógica. REGLAS DE SINTAXIS CRÍTICAS PARA EVITAR ERRORES: 1. Usa SIEMPRE nodos rectangulares con corchetes y COMILLAS DOBLES para el texto. Ejemplo: A[\"Texto del nodo\"]. 2. NUNCA uses paréntesis redondos () para definir la forma del nodo, usa siempre []. 3. Si el texto del nodo contiene paréntesis, es OBLIGATORIO usar comillas dobles. Ejemplo: B[\"Token (JWT)\"]. 4. Usa saltos de línea explícitos (\\n) entre cada relación.",
    },
    suggestedTags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Hasta 5 etiquetas técnicas relevantes.",
    },
    suggestedCategory: {
      type: Type.STRING,
      enum: ["Procedimiento", "Definición", "Solución de Problemas", "General", "Fragmento de Código"],
      description: "La categoría que mejor se ajuste a este contenido.",
    },
    titleSuggestion: {
      type: Type.STRING,
      description: "Un título corto y descriptivo.",
    },
    extractedContent: {
      type: Type.STRING,
      description: "ESTE ES EL CAMPO MÁS IMPORTANTE. Debe ser una transcripción detallada y técnica de TODO el conocimiento inferido. REGLA CLAVE: Si hay comparaciones (ej. 'X vs Y'), USA TABLAS MARKDOWN ESTÁNDAR. Ejemplo: | Característica | Opción A | Opción B | \n |---|---|---| \n | Velocidad | Rápida | Lenta |. Si hay código, explícalo.",
    }
  },
  required: ["summary", "steps", "codeSnippets", "mermaidChart", "suggestedTags", "suggestedCategory", "titleSuggestion", "extractedContent"],
};

export const analyzeKnowledge = async (
  text: string,
  base64Images: string[]
): Promise<AIAnalysisResult> => {
  try {
    const parts: any[] = [{ text: `Actúa como un Analista Técnico Senior y Documentador.
    
    TU OBJETIVO PRINCIPAL:
    Transformar entradas visuales (imágenes de diagramas, capturas de pantalla) o texto breve en una Documentación Técnica Completa.

    INSTRUCCIONES ESPECÍFICAS PARA 'extractedContent':
    1. Si se proporcionan IMÁGENES: Analízalas visualmente. Si es un diagrama, describe cada paso, decisión y flujo en formato de texto narrativo detallado. Si es código, explícalo.
    2. Si se proporciona TEXTO: Úsalo como base, pero mejóralo, correge la gramática y dale formato profesional.
    3. Si se proporcionan AMBOS: Combínalos. Usa la imagen para enriquecer el texto del usuario.
    4. FORMATO: Usa Markdown para dar formato. IMPORTANTE: Para comparaciones, listas de propiedades o diferencias, USA SIEMPRE TABLAS MARKDOWN.

    INSTRUCCIONES PARA 'codeSnippets':
    - Detecta CUALQUIER comando, fragmento de código, JSON o configuración.
    - Sepáralos claramente en el array codeSnippets para que el usuario pueda copiarlos fácilmente.
    
    INSTRUCCIONES PARA 'mermaidChart':
    - Crea siempre una representación visual de la lógica inferida usando 'graph TD'.
    - IMPORTANTE: Para evitar errores de sintaxis, TODOS los textos de los nodos deben estar entre comillas dobles y dentro de corchetes.
    - Ejemplo CORRECTO: A["Inicio"] --> B["Proceso (con detalles)"]
    - Ejemplo INCORRECTO: A(Inicio) --> B(Proceso (con detalles))
    
    Contenido a analizar:
    ${text}` }];

    // Append images if they exist
    base64Images.forEach((img) => {
      const base64Data = img.split(',')[1] || img;
      const mimeType = img.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)?.[0] || 'image/png';
      
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AIAnalysisResult;
    }
    throw new Error("No response text from Gemini");

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      summary: "No se pudo analizar el contenido automáticamente.",
      steps: [],
      codeSnippets: [],
      mermaidChart: "",
      suggestedTags: ["Error"],
      suggestedCategory: "General",
      titleSuggestion: "Error de Análisis",
      extractedContent: text || "Intente nuevamente. La IA no pudo inferir información."
    };
  }
};

// --- Practice Mode Functions ---

interface PracticeChallenge {
  question: string;
  contextType: 'code' | 'concept';
}

export const generatePracticeChallenge = async (contextContent: string): Promise<PracticeChallenge> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Contexto Técnico: ${contextContent}
      
      Genera un único ejercicio práctico breve o pregunta de desafío basada en el contexto anterior.
      Si el contexto es código, pide al usuario que escriba un comando o función similar.
      Si el contexto es conceptual, haz una pregunta situacional difícil.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING, description: "La pregunta o desafío para el usuario." },
            contextType: { type: Type.STRING, enum: ['code', 'concept'], description: "Tipo de respuesta esperada." }
          }
        }
      }
    });
    
    return JSON.parse(response.text!) as PracticeChallenge;
  } catch (e) {
    return { question: "Describe los conceptos principales de esta nota.", contextType: "concept" };
  }
};

export interface EvaluationResult {
  isCorrect: boolean;
  score: number; // 0-100
  feedback: string;
  correctSolution: string;
}

export const evaluatePracticeResponse = async (
  originalContext: string,
  challenge: string,
  userAnswer: string
): Promise<EvaluationResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
      Actúa como un tutor técnico estricto.
      
      Material de Estudio (Verdad Absoluta): ${originalContext}
      Pregunta/Desafío: ${challenge}
      Respuesta del Estudiante: ${userAnswer}
      
      Evalúa la respuesta del estudiante. 
      1. ¿Es técnicamente correcta?
      2. Si es código, ¿es sintaxis válida y segura?
      3. Si es conceptual, ¿cubre los puntos clave?
      
      Sé constructivo pero señala los errores específicos.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN },
            score: { type: Type.NUMBER, description: "Puntaje del 0 al 100" },
            feedback: { type: Type.STRING, description: "Explicación detallada de por qué está bien o mal, y qué faltó." },
            correctSolution: { type: Type.STRING, description: "La respuesta ideal o el código corregido." }
          }
        }
      }
    });

    return JSON.parse(response.text!) as EvaluationResult;
  } catch (e) {
    return {
      isCorrect: false,
      score: 0,
      feedback: "Error al evaluar la respuesta. Intenta de nuevo.",
      correctSolution: ""
    };
  }
};
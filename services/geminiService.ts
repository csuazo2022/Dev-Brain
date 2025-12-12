import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Un resumen conciso del conocimiento proporcionado. Mantenlo claro y profesional.",
    },
    steps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Si el contenido implica un proceso o procedimiento, lista los pasos aquí. Devuelve un array vacío si no aplica.",
    },
    mermaidChart: {
      type: Type.STRING,
      description: "Una cadena válida de Mermaid.js (ej. flowchart TD, sequenceDiagram) visualizando el concepto o proceso. Devuelve cadena vacía si no aplica. No incluyas bloques de código markdown.",
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
      description: "Un título corto y descriptivo para esta entrada de conocimiento.",
    }
  },
  required: ["summary", "steps", "suggestedTags", "suggestedCategory", "titleSuggestion"],
};

export const analyzeKnowledge = async (
  text: string,
  base64Images: string[]
): Promise<AIAnalysisResult> => {
  try {
    const parts: any[] = [{ text: `Analiza el siguiente contenido técnico (notas/imágenes) sobre desarrollo de software o sistemas. Estructúralo en una entrada de base de conocimientos. Si describe un proceso, genera un diagrama de flujo en sintaxis mermaid. \n\nIMPORTANTE: Todo el contenido generado (resumen, título, pasos) DEBE estar en ESPAÑOL.\n\nContenido:\n${text}` }];

    // Append images if they exist
    base64Images.forEach((img) => {
      // Remove data url prefix if present for the API call, though the API often handles raw base64 data better if cleanly separated
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
        systemInstruction: "Eres un redactor técnico senior y arquitecto de sistemas. Tu objetivo es sintetizar notas desordenadas y capturas de pantalla en documentación estructurada, clara y procesable. Responde siempre en Español."
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AIAnalysisResult;
    }
    throw new Error("No response text from Gemini");

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Return a fallback so the app doesn't crash
    return {
      summary: "No se pudo analizar el contenido automáticamente.",
      steps: [],
      mermaidChart: "",
      suggestedTags: ["Sin Categoría"],
      suggestedCategory: "General",
      titleSuggestion: "Nueva Entrada"
    };
  }
};
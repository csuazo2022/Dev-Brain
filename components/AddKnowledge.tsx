import React, { useState, useRef } from 'react';
import { analyzeKnowledge } from '../services/geminiService';
import { Category, KnowledgeEntry } from '../types';
import { Loader2, Upload, Sparkles, X, Image as ImageIcon } from 'lucide-react';

interface AddKnowledgeProps {
  onSave: (entry: KnowledgeEntry) => void;
  onCancel: () => void;
}

const AddKnowledge: React.FC<AddKnowledgeProps> = ({ onSave, onCancel }) => {
  const [rawText, setRawText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    if (!rawText && images.length === 0) return;

    setIsAnalyzing(true);
    try {
      const result = await analyzeKnowledge(rawText, images);
      
      const newEntry: KnowledgeEntry = {
        id: crypto.randomUUID(),
        title: result.titleSuggestion,
        rawContent: rawText,
        category: result.suggestedCategory as Category,
        summary: result.summary,
        steps: result.steps,
        mermaidChart: result.mermaidChart,
        tags: result.suggestedTags,
        imageUrls: images,
        createdAt: Date.now(),
      };

      onSave(newEntry);
    } catch (error) {
      console.error(error);
      alert("Error al analizar el contenido. Por favor intenta de nuevo.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-900 min-h-screen">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
          Agregar Nuevo Conocimiento
        </h2>
        <p className="text-slate-400">
          Pega tus apuntes, registros o definiciones. Sube capturas de pantalla de errores o diagramas. 
          La IA lo estructurará por ti.
        </p>
      </div>

      <div className="space-y-6">
        {/* Text Input */}
        <div className="relative group">
          <textarea
            className="w-full h-64 bg-slate-800 text-slate-100 p-4 rounded-xl border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none font-mono text-sm shadow-inner"
            placeholder="Pega tus notas desestructuradas, fragmentos de código o pasos de procedimientos aquí..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
          <div className="absolute bottom-4 right-4 text-xs text-slate-500 pointer-events-none">
            Soporta Markdown
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Adjuntos
            </label>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              + Agregar Imagen
            </button>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/*" 
            multiple 
            onChange={handleImageUpload} 
          />

          <div className="flex gap-4 overflow-x-auto py-2">
            {images.length === 0 && (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:border-slate-500 hover:bg-slate-800 transition-all"
              >
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-[10px]">Subir</span>
              </div>
            )}
            {images.map((img, idx) => (
              <div key={idx} className="relative w-24 h-24 shrink-0 group">
                <img src={img} alt="preview" className="w-full h-full object-cover rounded-lg border border-slate-700" />
                <button 
                  onClick={() => removeImage(idx)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-slate-800">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleProcess}
            disabled={isAnalyzing || (!rawText && images.length === 0)}
            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Analizar y Guardar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddKnowledge;
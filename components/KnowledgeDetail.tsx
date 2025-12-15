import React, { useState, useEffect } from 'react';
import { KnowledgeEntry, Category } from '../types';
import MermaidDiagram from './MermaidDiagram';
import { generatePracticeChallenge, evaluatePracticeResponse, EvaluationResult } from '../services/geminiService';
import { ArrowLeft, Calendar, Tag, Layers, AlertCircle, Terminal, FileText, X, Maximize2, Eraser, Copy, Check, Code, BrainCircuit, Send, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface KnowledgeDetailProps {
  entry: KnowledgeEntry;
  onBack: () => void;
}

const KnowledgeDetail: React.FC<KnowledgeDetailProps> = ({ entry, onBack }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  // Practice Mode State
  const [practiceMode, setPracticeMode] = useState<'idle' | 'loading_challenge' | 'active' | 'evaluating' | 'result'>('idle');
  const [challenge, setChallenge] = useState<{question: string, contextType: string} | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  // State for highlighted text, initialized from localStorage based on entry ID
  const [highlightTerm, setHighlightTerm] = useState<string | null>(() => {
    return localStorage.getItem(`highlight-${entry.id}`);
  });

  // Effect to update localStorage whenever highlightTerm changes
  useEffect(() => {
    if (highlightTerm) {
      localStorage.setItem(`highlight-${entry.id}`, highlightTerm);
    } else {
      localStorage.removeItem(`highlight-${entry.id}`);
    }
  }, [highlightTerm, entry.id]);
  
  const getCategoryIcon = (cat: Category) => {
    switch(cat) {
      case Category.PROCEDURE: return <Layers className="w-5 h-5 text-purple-400" />;
      case Category.TROUBLESHOOTING: return <AlertCircle className="w-5 h-5 text-red-400" />;
      case Category.SNIPPET: return <Terminal className="w-5 h-5 text-emerald-400" />;
      default: return <Tag className="w-5 h-5 text-blue-400" />;
    }
  };

  const handleNodeClick = (text: string) => {
    // Clean text (remove common mermaid garbage if any) and toggle
    const cleanText = text.replace(/["\[\]\(\)]/g, '').trim();
    if (highlightTerm === cleanText) {
      setHighlightTerm(null); // Toggle off if clicked again
    } else {
      setHighlightTerm(cleanText);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Practice Mode Functions
  const startPractice = async () => {
    setPracticeMode('loading_challenge');
    setUserAnswer('');
    setEvaluation(null);
    try {
      // Combine summary and raw content for context
      const context = `${entry.summary}\n${entry.rawContent}`;
      const newChallenge = await generatePracticeChallenge(context);
      setChallenge(newChallenge);
      setPracticeMode('active');
    } catch (e) {
      console.error(e);
      setPracticeMode('idle');
    }
  };

  const submitAnswer = async () => {
    if (!challenge || !userAnswer.trim()) return;
    setPracticeMode('evaluating');
    try {
      const context = `${entry.summary}\n${entry.rawContent}`;
      const result = await evaluatePracticeResponse(context, challenge.question, userAnswer);
      setEvaluation(result);
      setPracticeMode('result');
    } catch (e) {
      console.error(e);
      setPracticeMode('active'); // Go back to allow retry
    }
  };

  // Helper function to render text with highlights and clean markdown artifacts
  const highlightText = (text: string) => {
    if (!text) return "";

    // Clean Markdown syntax to ensure plain text readability
    let cleanText = text
      .replace(/\*\*/g, '')          // Bold
      .replace(/__/g, '')            // Bold
      .replace(/#{1,6}\s/g, '')      // Headers (e.g. ## Title)
      .replace(/`/g, '')             // Code ticks
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'); // Links [text](url) -> text

    if (!highlightTerm) return cleanText;

    // Escape special regex characters
    const escapedTerm = highlightTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Split text by the term (case insensitive)
    const parts = cleanText.split(new RegExp(`(${escapedTerm})`, 'gi'));

    return parts.map((part, index) => 
      part.toLowerCase() === highlightTerm.toLowerCase() ? (
        <mark key={index} className="bg-yellow-500/30 text-yellow-200 rounded px-0.5 border-b border-yellow-500/50 animate-pulse">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const hasImages = entry.imageUrls && entry.imageUrls.length > 0;

  // New function to parse and render content with Table detection
  const renderContentWithTables = (content: string) => {
    if (!content) return <p className="text-slate-500 italic">No se proporcionó contenido de texto.</p>;

    const lines = content.split('\n');
    const nodes: React.ReactNode[] = [];
    
    let inTable = false;
    let tableLines: string[] = [];

    const flushTable = (keyPrefix: number) => {
      if (tableLines.length < 2) return null;

      const headers = tableLines[0].split('|')
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0); 

      const rows = tableLines.slice(2).map(line => 
        line.split('|')
          .map(cell => cell.trim())
          .filter(cell => cell.length > 0) 
      );

      return (
        <div key={`table-${keyPrefix}`} className="my-6 overflow-x-auto rounded-lg border border-slate-700 shadow-xl">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-800 text-slate-200">
                {headers.map((h, i) => (
                  <th key={i} className="p-3 font-semibold border-b border-slate-600 whitespace-nowrap">
                    {highlightText(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-slate-900/50">
              {rows.filter(r => r.length > 0).map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-800/50 transition-colors border-b border-slate-800 last:border-0">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-3 text-slate-300 border-r border-slate-800 last:border-0 align-top">
                      {highlightText(cell)}
                    </td>
                  ))}
                  {Array.from({ length: Math.max(0, headers.length - row.length) }).map((_, i) => (
                     <td key={`empty-${i}`} className="p-3 border-r border-slate-800 last:border-0"></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const isTableLine = trimmed.startsWith('|');

      if (isTableLine) {
        if (!inTable) inTable = true;
        tableLines.push(trimmed);
      } else {
        if (inTable) {
          nodes.push(flushTable(index));
          tableLines = [];
          inTable = false;
        }
        if (trimmed.length > 0) {
           nodes.push(
             <p key={index} className="mb-2 text-slate-300 leading-relaxed text-justify">
               {highlightText(line)}
             </p>
           );
        } else {
          nodes.push(<br key={index} />);
        }
      }
    });

    if (inTable) {
       nodes.push(flushTable(lines.length));
    }

    return nodes;
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <button 
        onClick={onBack}
        className="flex items-center text-slate-400 hover:text-white mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Volver a la Biblioteca
      </button>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-8 border-b border-slate-700 bg-slate-900/50">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 border bg-slate-800 border-slate-700 text-slate-300`}>
              {getCategoryIcon(entry.category)}
              {entry.category}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium text-slate-500 flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              {new Date(entry.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
            {entry.title}
          </h1>
          <div className="flex flex-wrap gap-2">
            {entry.tags.map(tag => (
              <span key={tag} className="text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Layout Grid: Summary, Steps, Mermaid and Images */}
        <div className={`p-8 grid gap-8 ${hasImages ? 'md:grid-cols-3' : 'grid-cols-1'}`}>
          {/* Main Content (Structured) */}
          <div className={`space-y-8 ${hasImages ? 'md:col-span-2' : ''}`}>
            
            <section>
              <div className="flex justify-between items-center mb-3">
                 <h3 className="text-sm uppercase tracking-widest text-slate-400 font-semibold">Resumen</h3>
                 {highlightTerm && (
                   <button 
                     onClick={() => setHighlightTerm(null)}
                     className="text-xs text-yellow-500 hover:text-yellow-400 flex items-center gap-1 transition-colors"
                   >
                     <Eraser className="w-3 h-3" /> Limpiar resalte: "{highlightTerm}"
                   </button>
                 )}
              </div>
              <p className="text-lg text-slate-200 leading-relaxed text-justify">
                {highlightText(entry.summary)}
              </p>
            </section>

            {entry.steps && entry.steps.length > 0 && (
              <section>
                <h3 className="text-sm uppercase tracking-widest text-slate-400 mb-4 font-semibold">Procedimiento</h3>
                <div className="space-y-4">
                  {entry.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/30">
                        {idx + 1}
                      </div>
                      <div className="pt-1 text-slate-300 text-justify">
                        {highlightText(step)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Code Snippets Section */}
            {entry.codeSnippets && entry.codeSnippets.length > 0 && (
              <section>
                <h3 className="text-sm uppercase tracking-widest text-slate-400 mb-4 font-semibold flex items-center gap-2">
                  <Terminal className="w-4 h-4" /> Comandos y Código
                </h3>
                <div className="space-y-6">
                  {entry.codeSnippets.map((snippet, idx) => (
                    <div key={idx} className="bg-[#0f172a] rounded-lg border border-slate-700 overflow-hidden shadow-md">
                      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-emerald-400 lowercase">{snippet.language}</span>
                          <span className="text-xs text-slate-500 border-l border-slate-700 pl-3">{snippet.description}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(snippet.code, idx)}
                          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition-all"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">¡Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copiar
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <pre className="text-sm font-mono text-slate-200 whitespace-pre">
                          <code>{snippet.code}</code>
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {entry.mermaidChart && (
              <section>
                 <MermaidDiagram chart={entry.mermaidChart} onNodeClick={handleNodeClick} />
              </section>
            )}
          </div>

          {/* Sidebar / Images: Grid Layout */}
          {hasImages && (
            <div className="md:col-span-1 space-y-6">
               <h3 className="text-sm uppercase tracking-widest text-slate-400 font-semibold mb-2">Imágenes de Referencia</h3>
               <div className="grid grid-cols-2 gap-3">
                 {entry.imageUrls.map((url, i) => (
                   <div 
                    key={i} 
                    onClick={() => setSelectedImage(url)}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500 transition-all cursor-zoom-in bg-slate-900"
                   >
                     <img src={url} alt={`Reference ${i}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="w-6 h-6 text-white drop-shadow-md" />
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>

        {/* Practice Zone Section (New) */}
        <div className="p-8 border-t border-slate-700 bg-gradient-to-br from-slate-900/50 to-blue-900/10">
           <div className="flex items-center gap-3 mb-6">
             <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
               <BrainCircuit className="w-6 h-6" />
             </div>
             <div>
               <h3 className="text-lg font-bold text-white">Zona de Práctica</h3>
               <p className="text-xs text-slate-400">Pon a prueba tu conocimiento. La IA generará un desafío y corregirá tu respuesta.</p>
             </div>
           </div>

           {practiceMode === 'idle' && (
             <button 
               onClick={startPractice}
               className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-blue-900/20"
             >
               <BrainCircuit className="w-5 h-5" />
               Generar Ejercicio de Práctica
             </button>
           )}

           {practiceMode === 'loading_challenge' && (
             <div className="flex items-center gap-3 text-slate-400 p-4 border border-slate-700/50 rounded-lg bg-slate-800/30 w-fit">
               <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
               <span className="text-sm">Analizando la nota y creando un desafío...</span>
             </div>
           )}

           {(practiceMode === 'active' || practiceMode === 'evaluating' || practiceMode === 'result') && challenge && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
               {/* Challenge Display */}
               <div className="bg-slate-800 border-l-4 border-blue-500 p-4 rounded-r-lg shadow-md">
                 <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Desafío</h4>
                 <p className="text-slate-100 font-medium text-lg">{challenge.question}</p>
               </div>

               {/* User Answer Input */}
               <div className="relative">
                 <textarea
                   value={userAnswer}
                   onChange={(e) => setUserAnswer(e.target.value)}
                   disabled={practiceMode !== 'active'}
                   placeholder={challenge.contextType === 'code' ? "// Escribe tu código o comando aquí..." : "Escribe tu respuesta explicativa aquí..."}
                   className={`w-full h-32 bg-slate-950 border ${practiceMode === 'result' ? (evaluation?.isCorrect ? 'border-green-500/50' : 'border-red-500/50') : 'border-slate-700'} rounded-lg p-4 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none transition-all disabled:opacity-70`}
                 />
                 
                 {practiceMode === 'active' && (
                   <div className="flex justify-end mt-2">
                     <button
                       onClick={submitAnswer}
                       disabled={!userAnswer.trim()}
                       className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
                     >
                       <Send className="w-4 h-4" />
                       Enviar Respuesta
                     </button>
                   </div>
                 )}
               </div>

               {/* Evaluating State */}
               {practiceMode === 'evaluating' && (
                 <div className="flex items-center gap-3 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                    <span className="text-sm">Evaluando tu respuesta...</span>
                 </div>
               )}

               {/* Evaluation Result */}
               {practiceMode === 'result' && evaluation && (
                 <div className={`rounded-xl border p-6 ${evaluation.isCorrect ? 'bg-green-500/5 border-green-500/30' : 'bg-red-500/5 border-red-500/30'} animate-in zoom-in-95 duration-300`}>
                   <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-4">
                      {evaluation.isCorrect ? (
                        <div className="bg-green-500/20 p-2 rounded-full">
                          <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                      ) : (
                        <div className="bg-red-500/20 p-2 rounded-full">
                          <XCircle className="w-8 h-8 text-red-400" />
                        </div>
                      )}
                      <div>
                        <h4 className={`text-xl font-bold ${evaluation.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                          {evaluation.isCorrect ? '¡Correcto!' : 'Necesita mejorar'}
                        </h4>
                        <span className="text-xs text-slate-400 font-mono">Puntaje: {evaluation.score}/100</span>
                      </div>
                   </div>

                   <div className="space-y-4">
                     <div>
                       <h5 className="text-xs uppercase text-slate-500 font-bold mb-1">Feedback de la IA</h5>
                       <p className="text-slate-200 leading-relaxed">{evaluation.feedback}</p>
                     </div>

                     {!evaluation.isCorrect && (
                       <div className="bg-slate-950 p-4 rounded-lg border border-slate-700/50">
                         <h5 className="text-xs uppercase text-emerald-500 font-bold mb-2 flex items-center gap-2">
                           <Check className="w-3 h-3" /> Solución Ideal
                         </h5>
                         <pre className="text-sm font-mono text-emerald-200/80 whitespace-pre-wrap overflow-x-auto">
                           {evaluation.correctSolution}
                         </pre>
                       </div>
                     )}

                     <div className="pt-4 flex justify-end">
                       <button 
                         onClick={startPractice}
                         className="text-sm text-slate-400 hover:text-white underline decoration-slate-600 hover:decoration-white underline-offset-4 transition-all"
                       >
                         Intentar otro ejercicio
                       </button>
                     </div>
                   </div>
                 </div>
               )}
             </div>
           )}
        </div>

        {/* Full Width Section for Raw Notes / Documentation */}
        <div className="p-8 border-t border-slate-700 bg-slate-900/20 flex-grow w-full">
           <div className="flex items-center gap-3 mb-6 border-b border-slate-700/50 pb-4">
             <FileText className="w-5 h-5 text-blue-400" />
             <h3 className="text-sm uppercase tracking-widest text-slate-400 font-bold">Documentación Detallada</h3>
           </div>
           
           <div className="w-full font-sans">
             {/* Uses new renderer instead of just printing text */}
             {renderContentWithTables(entry.rawContent || "No se proporcionó contenido de texto.")}
           </div>
        </div>
      </div>

      {/* Image Modal Overlay */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-full transition-all"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={selectedImage}
            alt="Full screen view"
            className="max-w-full max-h-full rounded-lg shadow-2xl border border-slate-800"
            onClick={(e) => e.stopPropagation()} // Prevent close on image click
          />
        </div>
      )}
    </div>
  );
};

export default KnowledgeDetail;
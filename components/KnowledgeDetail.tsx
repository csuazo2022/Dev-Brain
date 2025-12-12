import React from 'react';
import { KnowledgeEntry, Category } from '../types';
import MermaidDiagram from './MermaidDiagram';
import { ArrowLeft, Calendar, Tag, Layers, AlertCircle, Terminal } from 'lucide-react';

interface KnowledgeDetailProps {
  entry: KnowledgeEntry;
  onBack: () => void;
}

const KnowledgeDetail: React.FC<KnowledgeDetailProps> = ({ entry, onBack }) => {
  
  const getCategoryIcon = (cat: Category) => {
    switch(cat) {
      case Category.PROCEDURE: return <Layers className="w-5 h-5 text-purple-400" />;
      case Category.TROUBLESHOOTING: return <AlertCircle className="w-5 h-5 text-red-400" />;
      case Category.SNIPPET: return <Terminal className="w-5 h-5 text-emerald-400" />;
      default: return <Tag className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={onBack}
        className="flex items-center text-slate-400 hover:text-white mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Volver a la Biblioteca
      </button>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
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

        <div className="p-8 grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            
            <section>
              <h3 className="text-sm uppercase tracking-widest text-slate-400 mb-3 font-semibold">Resumen</h3>
              <p className="text-lg text-slate-200 leading-relaxed">
                {entry.summary}
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
                      <div className="pt-1 text-slate-300">
                        {step}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {entry.mermaidChart && (
              <section>
                 <MermaidDiagram chart={entry.mermaidChart} />
              </section>
            )}

            <section>
               <h3 className="text-sm uppercase tracking-widest text-slate-400 mb-3 font-semibold">Notas Originales</h3>
               <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-slate-400 font-mono text-sm whitespace-pre-wrap">
                 {entry.rawContent || "No se proporcionó contenido de texto."}
               </div>
            </section>
          </div>

          {/* Sidebar / Images */}
          <div className="md:col-span-1 space-y-6">
             {entry.imageUrls.length > 0 && (
               <div className="space-y-4">
                 <h3 className="text-sm uppercase tracking-widest text-slate-400 font-semibold">Imágenes de Referencia</h3>
                 {entry.imageUrls.map((url, i) => (
                   <div key={i} className="group relative rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500 transition-colors cursor-zoom-in">
                     <img src={url} alt={`Reference ${i}`} className="w-full object-contain bg-black/50" />
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeDetail;
import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, X, ZoomIn, ZoomOut, Move } from 'lucide-react';

// Declare mermaid globally
declare global {
  interface Window {
    mermaid: any;
  }
}

interface MermaidDiagramProps {
  chart: string;
  onNodeClick?: (text: string) => void;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, onNodeClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100% width of container

  useEffect(() => {
    if (window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: true,
        theme: 'dark',
        securityLevel: 'loose',
        flowchart: {
          useMaxWidth: false,
          htmlLabels: true,
        }
      });
    }
  }, []);

  useEffect(() => {
    const renderChart = async () => {
      if (!containerRef.current || !chart || !window.mermaid) return;

      const cleanUpChart = (inputChart: string) => {
        let clean = inputChart.replace(/```mermaid/g, '').replace(/```/g, '').trim();
        clean = clean.replace(/^mermaid\s+/i, '');
        clean = clean.replace(/\\n/g, '\n');
        clean = clean.replace(/^(graph|flowchart)\s+([a-zA-Z0-9]+)\s+(?![;\n])(.+)/i, '$1 $2\n$3');
        clean = clean.replace(/(["\]])\s*([A-Z][a-zA-Z0-9_]*\[)/g, '$1\n$2');
        clean = clean.replace(/(["\]])\s*([A-Z][a-zA-Z0-9_]*\s*-->)/g, '$1\n$2');
        return clean;
      };

      const setupInteractivity = (container: HTMLElement) => {
        if (onNodeClick) {
          const nodes = container.querySelectorAll('.node');
          nodes.forEach((node) => {
            const htmlNode = node as HTMLElement;
            htmlNode.style.cursor = 'pointer';
            htmlNode.onclick = () => {
              const text = htmlNode.textContent?.trim() || '';
              if (text) onNodeClick(text);
            };
          });
        }
      };

      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      const cleanChart = cleanUpChart(chart);

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      try {
        setError(null);
        const { svg } = await window.mermaid.render(id, cleanChart);
        
        // VITAL CHANGE: Force SVG to be 100% width of its parent. 
        // This allows us to control the size by resizing the parent div in the modal.
        const styledSvg = svg.replace('<svg ', '<svg style="max-width: none; width: 100%; height: auto; display: block;" ');
        
        setSvgContent(styledSvg);

        if (containerRef.current) {
          containerRef.current.innerHTML = styledSvg;
          setupInteractivity(containerRef.current);
        }
      } catch (err) {
        console.warn("Mermaid Render Error (First Attempt):", err);
        try {
          const fallbackChart = cleanChart.replace(/\(/g, '[').replace(/\)/g, ']');
          const { svg } = await window.mermaid.render(id + '-retry', fallbackChart);
          const styledSvg = svg.replace('<svg ', '<svg style="max-width: none; width: 100%; height: auto; display: block;" ');
          
          setSvgContent(styledSvg);

          if (containerRef.current) {
            containerRef.current.innerHTML = styledSvg;
            setupInteractivity(containerRef.current);
          }
        } catch (retryErr) {
          console.error("Mermaid Retry Error", retryErr);
          setError("No se pudo generar la visualización. El diagrama contiene errores de sintaxis complejos.");
        }
      }
    };

    renderChart();
  }, [chart, onNodeClick]);

  if (!chart) return null;

  return (
    <>
      {/* Inline Card View */}
      <div className="my-6 p-4 bg-slate-800 rounded-lg border border-slate-700 shadow-inner group relative">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-xs uppercase tracking-widest text-slate-400 font-semibold flex items-center gap-2">
            Diagrama Interactivo
          </h4>
          <div className="flex items-center gap-2">
            {onNodeClick && <span className="text-[10px] text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded hidden sm:inline-block">Click en nodos para leer</span>}
            <button 
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
              title="Pantalla Completa"
            >
              <Maximize2 className="w-3 h-3" /> Ampliar
            </button>
          </div>
        </div>
        
        {error ? (
          <div className="text-red-400 text-sm p-2 flex items-center gap-2 border border-red-500/20 rounded bg-red-500/5">
             <span className="text-xs font-bold px-2 py-0.5 bg-red-500/20 rounded">!</span>
             {error}
          </div>
        ) : (
          <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50">
            {/* Limited max-height in card view to prevent taking up too much space */}
            <div ref={containerRef} className="w-full max-h-[500px] flex justify-center" />
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-in fade-in duration-200">
          {/* Header Toolbar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900 shadow-lg z-10">
            <div className="flex items-center gap-3">
               <h3 className="text-slate-200 font-medium text-lg">Vista de Diagrama</h3>
               <span className="text-xs text-slate-500 hidden md:inline-block border-l border-slate-700 pl-3">
                 Usa el zoom para ajustar el ancho
               </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
                <button 
                  onClick={() => setZoomLevel(z => Math.max(0.2, z - 0.2))}
                  className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                  title="Reducir ancho"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-xs font-mono w-14 text-center text-slate-300 font-medium">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button 
                   onClick={() => setZoomLevel(z => Math.min(4, z + 0.2))}
                   className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                   title="Aumentar ancho"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </div>
              <button 
                onClick={() => { setIsFullscreen(false); setZoomLevel(1); }}
                className="p-2 hover:bg-red-500/10 rounded-full text-slate-400 hover:text-red-400 transition-colors"
              >
                <X className="w-7 h-7" />
              </button>
            </div>
          </div>

          {/* Scrollable Canvas Area */}
          <div className="flex-1 overflow-auto bg-[#0b1120] relative scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-900">
             <div className="min-h-full min-w-full flex items-center justify-center p-8">
                {/* 
                   Zoom Wrapper: 
                   Controls the width of the diagram relative to the screen width.
                   - At 100% (zoom=1): It fills the screen width.
                   - At >100%: It expands, creating scrollbars.
                   - At <100%: It shrinks and centers.
                */}
                <div 
                  style={{ 
                    width: `${zoomLevel * 100}%`,
                    transition: 'width 0.2s ease-out',
                  }}
                  className="bg-slate-900/0 rounded-xl" // Transparent background for the diagram itself
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                  onClick={(e) => {
                    // Re-bind click events for the modal since dangerouslySetInnerHTML creates new DOM elements
                    const target = e.target as HTMLElement;
                    const node = target.closest('.node');
                    if (node && onNodeClick) {
                      const text = node.textContent?.trim() || '';
                      if (text) {
                        onNodeClick(text);
                        // Optional: close modal on click? setIsFullscreen(false); 
                      }
                    }
                  }}
                />
             </div>
          </div>
          
          <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
              <Move className="w-3 h-3" />
              Haz scroll vertical y horizontal para navegar por el diagrama completo.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default MermaidDiagram;
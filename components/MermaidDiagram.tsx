import React, { useEffect, useRef, useState } from 'react';

// Declare mermaid globally
declare global {
  interface Window {
    mermaid: any;
  }
}

interface MermaidDiagramProps {
  chart: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: true,
        theme: 'dark',
        securityLevel: 'loose',
      });
    }
  }, []);

  useEffect(() => {
    const renderChart = async () => {
      if (!containerRef.current || !chart || !window.mermaid) return;

      try {
        setError(null);
        // Clean the chart string to remove markdown blocks if Gemini accidentally added them
        const cleanChart = chart.replace(/```mermaid/g, '').replace(/```/g, '').trim();
        
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await window.mermaid.render(id, cleanChart);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        console.error("Mermaid Render Error", err);
        setError("No se pudo renderizar el diagrama. La sintaxis podría ser inválida.");
      }
    };

    renderChart();
  }, [chart]);

  if (!chart) return null;

  return (
    <div className="my-6 p-4 bg-slate-800 rounded-lg border border-slate-700 overflow-x-auto">
      <h4 className="text-xs uppercase tracking-widest text-slate-400 mb-4 font-semibold">Diagrama Generado</h4>
      {error ? (
        <div className="text-red-400 text-sm p-2">{error}</div>
      ) : (
        <div ref={containerRef} className="flex justify-center min-w-[300px]" />
      )}
    </div>
  );
};

export default MermaidDiagram;
import React, { useState, useEffect } from 'react';
import { KnowledgeEntry, Category } from './types';
import AddKnowledge from './components/AddKnowledge';
import KnowledgeDetail from './components/KnowledgeDetail';
import { Search, Plus, BookOpen, AlertTriangle, Cpu, HelpCircle, LayoutGrid, List as ListIcon, Calendar, LayoutList, Image as ImageIcon } from 'lucide-react';

// Sample data for demo purposes if empty
const SAMPLE_DATA: KnowledgeEntry[] = [
  {
    id: '1',
    title: 'Cómo deshacer el último commit en Git',
    category: Category.PROCEDURE,
    rawContent: 'Para deshacer un commit, usamos git reset. Si quieres mantener los archivos en tu staging area, usa --soft. Si quieres borrar todo, usa --hard. Ten cuidado con --hard porque elimina tu trabajo.',
    summary: 'Para deshacer el último commit pero mantener tus cambios en el área de preparación (staging area), usa el comando soft reset.',
    steps: [
      'Abre tu terminal.',
      'Navega al repositorio.',
      'Ejecuta el comando: git reset --soft HEAD~1',
      'Tus archivos ahora están preparados y listos para un nuevo commit.'
    ],
    codeSnippets: [
      {
        language: 'bash',
        code: 'git reset --soft HEAD~1',
        description: 'Deshace el commit pero mantiene los cambios en staging.'
      },
      {
        language: 'bash',
        code: 'git reset --hard HEAD~1',
        description: 'PRECAUCIÓN: Deshace el commit y ELIMINA todos los cambios.'
      }
    ],
    mermaidChart: `flowchart LR
      A[Commit Realizado] --> B{¿Error?}
      B -- Sí --> C[Ejecutar git reset --soft]
      C --> D[Cambios en Staging]
      D --> E[Corregir Código]
      E --> F[Hacer Commit de nuevo]`,
    tags: ['git', 'control-de-versiones', 'terminal'],
    imageUrls: [],
    createdAt: Date.now()
  }
];

const App: React.FC = () => {
  const [entries, setEntries] = useState<KnowledgeEntry[]>(() => {
    const saved = localStorage.getItem('devbrain_entries');
    return saved ? JSON.parse(saved) : SAMPLE_DATA;
  });
  
  const [view, setView] = useState<'list' | 'add' | 'detail'>('list');
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Todo');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    localStorage.setItem('devbrain_entries', JSON.stringify(entries));
  }, [entries]);

  const handleSaveEntry = (entry: KnowledgeEntry) => {
    setEntries([entry, ...entries]);
    setView('list');
  };

  const handleViewDetail = (entry: KnowledgeEntry) => {
    setSelectedEntry(entry);
    setView('detail');
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          entry.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = activeCategory === 'Todo' || entry.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Todo', ...Object.values(Category)];

  // -- Render Views --

  if (view === 'add') {
    return <AddKnowledge onSave={handleSaveEntry} onCancel={() => setView('list')} />;
  }

  if (view === 'detail' && selectedEntry) {
    return <KnowledgeDetail entry={selectedEntry} onBack={() => setView('list')} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex-shrink-0 flex flex-col h-auto md:h-screen sticky top-0 z-10">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Cpu className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            DevBrain
          </h1>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Biblioteca</div>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeCategory === cat ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              {cat === 'Todo' && <LayoutGrid className="w-4 h-4" />}
              {cat === Category.PROCEDURE && <ListIcon className="w-4 h-4" />}
              {cat === Category.TROUBLESHOOTING && <AlertTriangle className="w-4 h-4" />}
              {cat === Category.DEFINITION && <BookOpen className="w-4 h-4" />}
              {cat === Category.GENERAL && <HelpCircle className="w-4 h-4" />}
              {cat === Category.SNIPPET && <LayoutGrid className="w-4 h-4" />}
              {cat}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => setView('add')}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5" />
            Nueva Entrada
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        
        {/* Search Header */}
        <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar en la base de conocimiento (ej. 'git', 'deploy', 'error 404')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 shrink-0">
             <button
               onClick={() => setLayoutMode('grid')}
               className={`p-2 rounded-md transition-all ${layoutMode === 'grid' ? 'bg-slate-700 text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
               title="Vista en Cuadrícula"
             >
               <LayoutGrid className="w-4 h-4" />
             </button>
             <button
               onClick={() => setLayoutMode('list')}
               className={`p-2 rounded-md transition-all ${layoutMode === 'list' ? 'bg-slate-700 text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
               title="Vista en Lista Detallada"
             >
               <LayoutList className="w-4 h-4" />
             </button>
          </div>
        </div>

        {/* Content */}
        <div className={`max-w-6xl mx-auto ${layoutMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}`}>
          {filteredEntries.map(entry => (
            layoutMode === 'grid' ? (
              // GRID CARD VIEW
              <div 
                key={entry.id}
                onClick={() => handleViewDetail(entry)}
                className="group bg-slate-800 rounded-xl border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800/80 p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl shadow-black/20 flex flex-col h-64"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wide ${
                    entry.category === Category.TROUBLESHOOTING ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    entry.category === Category.PROCEDURE ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {entry.category}
                  </span>
                  {entry.imageUrls.length > 0 && (
                    <div className="bg-slate-700 text-slate-300 text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> Img
                    </div>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-slate-100 mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                  {entry.title}
                </h3>
                
                <p className="text-slate-400 text-sm line-clamp-3 mb-4 flex-1">
                  {entry.summary}
                </p>

                <div className="flex flex-wrap gap-2 mt-auto">
                  {entry.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded">
                      #{tag}
                    </span>
                  ))}
                  {entry.tags.length > 3 && (
                    <span className="text-xs text-slate-500 py-1">+{entry.tags.length - 3}</span>
                  )}
                </div>
              </div>
            ) : (
              // LIST CARD VIEW
              <div 
                key={entry.id}
                onClick={() => handleViewDetail(entry)}
                className="group bg-slate-800 rounded-xl border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800/80 p-6 cursor-pointer transition-all hover:shadow-lg shadow-black/20 flex gap-6"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wide ${
                      entry.category === Category.TROUBLESHOOTING ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      entry.category === Category.PROCEDURE ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {entry.category}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-blue-400 transition-colors truncate">
                    {entry.title}
                  </h3>
                  
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {entry.summary}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {entry.tags.map(tag => (
                      <span key={tag} className="text-xs text-slate-400 bg-slate-900/50 border border-slate-700 px-2 py-1 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {entry.imageUrls.length > 0 && (
                  <div className="hidden md:block w-32 shrink-0">
                    <div className="aspect-square rounded-lg bg-slate-900 border border-slate-700 overflow-hidden relative">
                      <img src={entry.imageUrls[0]} alt="" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"/>
                      {entry.imageUrls.length > 1 && (
                        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 rounded font-medium">
                          +{entry.imageUrls.length - 1}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          ))}

          {filteredEntries.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center text-slate-500 py-20">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-lg">No se encontraron entradas que coincidan con tu búsqueda.</p>
              <button 
                onClick={() => setView('add')}
                className="mt-4 text-blue-400 hover:text-blue-300 font-medium"
              >
                ¿Crear nueva entrada?
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
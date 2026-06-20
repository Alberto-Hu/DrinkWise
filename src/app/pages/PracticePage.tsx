import { useState, useEffect, useRef } from 'react';
import { RefreshCw, BookOpen, Eye, EyeOff } from 'lucide-react';

const LUNCHES = [
  { id: 1, name: "Chop Suey de Pollo" },
  { id: 2, name: "Pollo Cantones" },
  { id: 3, name: "Pollo con Piña" },
  { id: 4, name: "Gallina Almendrada" },
  { id: 5, name: "Res con Brocoli" },
  { id: 6, name: "Pollo Asado y Papa Frita" },
  { id: 7, name: "Low Mein de Carnitas" },
  { id: 8, name: "Pollo Mongolia" },
  { id: 9, name: "Pollo Kung Pao" },
  { id: 10, name: "Chop Suey de Camarón" },
  { id: 11, name: "Camarón con Brocoli" },
  { id: 12, name: "Camarón Almendrado" },
  { id: 13, name: "Combinación de Mariscos" },
  { id: 14, name: "Pescado Enchilado" },
  { id: 15, name: "Pollo Enchilado" },
  { id: 16, name: "Calamar Enchilado" },
  { id: 17, name: "Camarón Enchilado" },
  { id: 18, name: "Camarón Empanizado" },
  { id: 19, name: "Pollo a la Naranja" },
  { id: 20, name: "Pollo a la Plancha" },
  { id: 21, name: "Pollo con Coco" },
  { id: 22, name: "Low Mein de Pollo" },
  { id: 23, name: "Low Mein de Res" },
  { id: 24, name: "Pollo con Brocoli" },
  { id: 25, name: "Pollo con Teriyaki" },
  { id: 26, name: "Chop Suey de Verdura" },
  { id: 27, name: "Combinación China" },
  { id: 28, name: "Camarón con Piña" },
  { id: 29, name: "Low Mein Camarón" },
  { id: 30, name: "Pollo Asado y Carnita Asada" },
  { id: 31, name: "Res Mongolia" },
  { id: 32, name: "Camarón Mongolia" }
];

export function PracticePage() {
  const [currentLunch, setCurrentLunch] = useState(LUNCHES[0]);
  const [askDish, setAskDish] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [showList, setShowList] = useState(false);
  const [questionMode, setQuestionMode] = useState<'random' | 'askDish' | 'askNumber'>('random');
  const [inactiveIds, setInactiveIds] = useState<number[]>([]);
  const poolRef = useRef<number[]>([]);

  const pickRandom = (mode = questionMode, currentInactive = inactiveIds) => {
    let activePool = poolRef.current.filter(id => !currentInactive.includes(id));
    
    if (activePool.length === 0) {
      activePool = LUNCHES.filter(l => !currentInactive.includes(l.id)).map(l => l.id);
    }
    
    if (activePool.length === 0) return;

    const randomIndex = Math.floor(Math.random() * activePool.length);
    const selectedId = activePool[randomIndex];
    
    poolRef.current = activePool.filter(id => id !== selectedId);

    const randomLunch = LUNCHES.find(l => l.id === selectedId)!;
    setCurrentLunch(randomLunch);
    
    if (mode === 'random') {
      setAskDish(Math.random() > 0.5);
    } else {
      setAskDish(mode === 'askDish');
    }
    setRevealed(false);
  };

  useEffect(() => {
    pickRandom(questionMode, inactiveIds);
  }, []);

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value as 'random' | 'askDish' | 'askNumber';
    setQuestionMode(newMode);
    pickRandom(newMode, inactiveIds);
  };

  const toggleLunch = (id: number) => {
    setInactiveIds(prev => {
      const isNowInactive = !prev.includes(id);
      const nextInactive = isNowInactive ? [...prev, id] : prev.filter(i => i !== id);
      
      if (isNowInactive && currentLunch.id === id) {
         pickRandom(questionMode, nextInactive);
      }
      return nextInactive;
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-2 sm:p-8 h-full">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Práctica de Menú</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <select 
              value={questionMode}
              onChange={handleModeChange}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer shadow-sm"
            >
              <option value="random">Aleatorio</option>
              <option value="askDish">Adivinar platillo</option>
              <option value="askNumber">Adivinar número</option>
            </select>

            <button 
              onClick={() => setShowList(!showList)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              title={showList ? "Ocultar lista" : "Mostrar lista"}
            >
              {showList ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            <button 
              onClick={() => pickRandom(questionMode, inactiveIds)} 
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              title="Saltar Pregunta"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="bg-white p-4 sm:p-10 rounded-2xl shadow-sm border border-gray-200 text-center space-y-6 sm:space-y-8 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-red-500"></div>
           
           <h2 className="text-xl text-gray-500 font-medium">
             {askDish ? '¿Qué platillo es el...' : '¿Qué número de lounch es el...'}
           </h2>
           
           <div className="text-3xl sm:text-5xl font-extrabold text-gray-900 py-4 break-words px-2 leading-tight">
             {askDish ? `Lounch #${currentLunch.id}` : currentLunch.name}
           </div>

           <div className="min-h-[140px] flex flex-col justify-center items-center">
             {!revealed ? (
               <button 
                 onClick={() => setRevealed(true)}
                 className="px-8 py-4 bg-orange-500 text-white font-bold text-lg rounded-xl hover:bg-orange-600 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
               >
                 Mostrar Respuesta
               </button>
             ) : (
               <div className="space-y-6 w-full animate-in fade-in zoom-in duration-300">
                 <div className="p-6 bg-orange-50 rounded-xl border border-orange-100">
                   <div className="text-sm text-orange-600 font-bold mb-2 uppercase tracking-wider">La respuesta es:</div>
                   <div className="text-3xl font-bold text-orange-900">
                     {askDish ? currentLunch.name : `Lounch #${currentLunch.id}`}
                   </div>
                 </div>
                 
                 <div className="flex gap-4 justify-center">
                   <button 
                     onClick={() => pickRandom(questionMode, inactiveIds)}
                     className="px-8 py-4 bg-gray-900 text-white font-bold text-lg rounded-xl hover:bg-gray-800 transition-colors shadow-md"
                   >
                     Siguiente Pregunta
                   </button>
                 </div>
               </div>
             )}
           </div>
        </div>
        
        {showList && (
          <div className="bg-white p-3 sm:p-8 rounded-2xl shadow-sm border border-gray-200 mt-6 sm:mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
               <span>📖</span> Lista de Lonches
             </h3>

             <div className="mb-4 sm:mb-6">
               <div className="flex flex-wrap gap-1.5 sm:gap-2">
                 {[0,1,2,3,4,5,6,7].map(rowIndex => {
                   const rowIds = [rowIndex*4 + 1, rowIndex*4 + 2, rowIndex*4 + 3, rowIndex*4 + 4];
                   const isRowHidden = rowIds.every(id => inactiveIds.includes(id));
                   return (
                     <button
                       key={rowIndex}
                       onClick={() => {
                         if (isRowHidden) {
                           setInactiveIds(prev => prev.filter(id => !rowIds.includes(id)));
                         } else {
                           setInactiveIds(prev => {
                             const next = Array.from(new Set([...prev, ...rowIds]));
                             if (rowIds.includes(currentLunch.id)) {
                                pickRandom(questionMode, next);
                             }
                             return next;
                           });
                         }
                       }}
                       className={`px-2 py-1 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-medium rounded-md sm:rounded-lg border transition-colors ${
                          isRowHidden 
                            ? 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200' 
                            : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                       }`}
                     >
                       Fila {rowIndex + 1}
                     </button>
                   )
                 })}
               </div>
             </div>

             <div className="grid grid-cols-4 gap-1.5 sm:gap-4">
               {LUNCHES.filter(l => !inactiveIds.includes(l.id)).map(l => (
                   <div 
                     key={l.id} 
                     onClick={() => toggleLunch(l.id)}
                     className="flex flex-col p-1 sm:p-4 min-h-[75px] sm:min-h-0 justify-center items-center text-center rounded-lg sm:rounded-xl border border-orange-100 bg-orange-50/50 cursor-pointer hover:bg-orange-100 transition-colors"
                   >
                     <span className="font-bold text-[9px] sm:text-sm mb-0.5 sm:mb-1 text-orange-700">
                       <span className="hidden sm:inline">LOUNCH </span>#{l.id}
                     </span>
                     <span className="text-[9px] sm:text-base font-medium leading-[1.1] sm:leading-tight break-words w-full text-gray-900">
                       {l.name}
                     </span>
                   </div>
               ))}
             </div>
          </div>
        )}
      </div>
     </div>
  );
}

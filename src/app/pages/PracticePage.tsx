import { useState, useEffect } from 'react';
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

  const pickRandom = (mode = questionMode) => {
    const randomLunch = LUNCHES[Math.floor(Math.random() * LUNCHES.length)];
    setCurrentLunch(randomLunch);
    if (mode === 'random') {
      setAskDish(Math.random() > 0.5);
    } else {
      setAskDish(mode === 'askDish');
    }
    setRevealed(false);
  };

  useEffect(() => {
    pickRandom(questionMode);
  }, []);

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value as 'random' | 'askDish' | 'askNumber';
    setQuestionMode(newMode);
    pickRandom(newMode);
  };

  return (
     <div className="flex-1 overflow-y-auto bg-gray-50 p-8 h-full">
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
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
              onClick={() => pickRandom(questionMode)} 
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              title="Saltar Pregunta"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-200 text-center space-y-8 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-red-500"></div>
           
           <h2 className="text-xl text-gray-500 font-medium">
             {askDish ? '¿Qué platillo es el...' : '¿Qué número de lounch es el...'}
           </h2>
           
           <div className="text-5xl font-extrabold text-gray-900 py-4">
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
                     onClick={() => pickRandom(questionMode)}
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
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
               <span>📖</span> Lista de Lonches
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               {LUNCHES.map(l => (
                 <div key={l.id} className="flex flex-col p-4 bg-orange-50/50 hover:bg-orange-50 rounded-xl border border-orange-100 transition-colors">
                   <span className="font-bold text-orange-700 text-sm mb-1">LOUNCH #{l.id}</span>
                   <span className="text-gray-900 font-medium leading-tight">{l.name}</span>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>
     </div>
  );
}

// src/components/LapsList.jsx
import React from 'react';
import { formatTime } from '../utils/formatTime';

const LapsList = ({ laps }) => {
  // Se não houver voltas, mostra mensagem vazia
  if (laps.length === 0) {
    return (
      <div className="w-full max-w-md bg-gray-900/50 rounded-xl border border-gray-800 p-4 h-64 flex items-center justify-center">
        <div className="text-gray-600 text-center italic text-sm">
          Nenhuma volta registrada ainda.
        </div>
      </div>
    );
  }

  return (
    // Container Principal: Agora controla a altura e bordas, mas NÃO tem scroll aqui
    <div className="w-full max-w-md bg-gray-900/50 rounded-xl border border-gray-800 flex flex-col h-64 overflow-hidden">
      
      {/* Cabeçalho FIXO: Fica fora da área de scroll para não bugar */}
      <div className="p-3 border-b border-gray-800 bg-gray-900 text-center z-10 shadow-sm shrink-0">
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">
          Voltas Registradas
        </h3>
      </div>
      
      {/* Área de Scroll: Apenas esta parte rola */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {/* Invertemos a lista para mostrar a mais recente no topo */}
        {laps.slice().reverse().map((lapTime, index) => {
          const boxNumber = laps.length - index;
          
          return (
            <div 
              key={boxNumber} 
              className="flex justify-between items-center bg-gray-800/40 p-3 rounded-lg border border-gray-700/30 hover:bg-gray-800 transition-colors gap-4"
            >
              <span className="text-gray-400 font-mono text-sm whitespace-nowrap">
                Caixa {boxNumber}
              </span>
              <span className="text-blue-400 font-mono font-bold text-base">
                {formatTime(lapTime)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LapsList;
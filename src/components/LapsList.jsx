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
    <div className="w-full max-w-md bg-gray-900/50 rounded-xl border border-gray-800 p-4 h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent flex flex-col">
      <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 sticky top-0 bg-gray-900/95 p-2 border-b border-gray-800 text-center backdrop-blur-sm z-10">
        Voltas Registradas
      </h3>
      
      <div className="space-y-2">
        {/* Invertemos a lista para mostrar a mais recente no topo */}
        {laps.slice().reverse().map((lapTime, index) => {
          // Lógica da Caixa: Total - Índice atual
          const boxNumber = laps.length - index;
          
          return (
            <div 
              key={boxNumber} 
              className="flex justify-between items-center bg-gray-800/40 p-3 rounded-lg border border-gray-700/30 hover:bg-gray-800 transition-colors"
            >
              <span className="text-gray-400 font-mono text-sm">
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
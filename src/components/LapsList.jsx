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

  const processlaps = laps.map((totalTime, index) => {
    const timePrevius = index == 0 ? 0: laps[index -1];
    const interval = index == 0 ? 0: totalTime - timePrevius

    return {
      id: index +1, 
      totalTime: totalTime,
      interval: interval
    }
  })

  const displayLaps = processlaps.reverse();

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
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          
          {/* Invertemos a lista diretamente para exibir a mais recente no topo */}
          {displayLaps.map((lap) => {

            return (
              <div 
                key={lap.id} 
                // Mantivemos o 'flex-col' conforme solicitado, caso queira adicionar mais itens abaixo depois
                className="bg-gray-800/40 p-3 rounded-lg border border-gray-700/30 hover:bg-gray-800 transition-colors flex flex-col gap-2"
              >
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-mono text-sm">
                    Caixa {lap.id} 
                  </span>
                  <span className="text-blue-400 font-mono font-bold text-base">
                    {formatTime(lap.totalTime)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-mono text-sm">
                    Intervalo {lap.id}
                  </span>
                  <span className="text-blue-400 font-mono font-bold text-base">
                    {formatTime(lap.interval)}
                  </span>
                </div>
                
              </div>
            );
          })}
        </div>
          
      </div>
    
  );
};

export default LapsList;
import React from 'react';
import { formatTime } from '../utils/formatTime';

export default function RallyTracker({ timeElapsed, laps }) {
  const TOTAL_BOXES = 34;
  const TIME_PER_BOX = 70; // 1 min e 10s

  const currentBox = laps.length + 1;

  if (currentBox > TOTAL_BOXES) return null;

  // Lógica de cálculo
  const targetTotalTime = currentBox * TIME_PER_BOX;
  const timeToNextBox = targetTotalTime - timeElapsed;
  const delta = timeToNextBox - TIME_PER_BOX;

  // Visualização do sinal (mostra + se excedeu o tempo)
  const isLate = timeToNextBox < 0;
  const absTime = Math.abs(timeToNextBox);

  // Cores
  let statusColor = "text-white";
  let borderColor = "border-gray-600";
  let glow = "";
  
  if (delta > 2) {
    statusColor = "text-blue-400"; 
    borderColor = "border-blue-500";
    glow = "shadow-[0_0_10px_rgba(59,130,246,0.2)]"; 
  } else if (delta < -2) {
    statusColor = "text-red-500"; 
    borderColor = "border-red-500";
    glow = "shadow-[0_0_10px_rgba(239,68,68,0.2)]";
  } else {
    statusColor = "text-green-500";
    borderColor = "border-green-500";
    glow = "shadow-[0_0_10px_rgba(34,197,94,0.2)]";
  }

  return (
    <div className={`
      /* --- CONFIGURAÇÕES GERAIS --- */
      z-50 flex flex-col items-center justify-center
      bg-gray-900/90 backdrop-blur-md 
      rounded-xl border ${borderColor} ${glow}
      transition-all duration-300 ease-in-out shadow-2xl
      
      /* IMPORTANTE: FIXED PARA FICAR PRESO NA TELA */
      fixed 

      /* --- POSICIONAMENTO MOBILE (Celular) --- */
      /* Fica no canto inferior direito, flutuando acima dos controles */
      bottom-32 right-4 
      w-24 h-24 
      
      /* --- POSICIONAMENTO DESKTOP (PC) --- */
      /* Fica centralizado verticalmente, ao lado direito do cronômetro */
      md:top-1/2 md:left-1/2 
      md:ml-36 /* Empurra para o lado do cronômetro central */
      md:bottom-auto md:right-auto 
      md:-translate-y-1/2
      md:w-28 md:h-28
    `}>
      
      {/* 1. Número da Caixa */}
      <div className="absolute top-1.5 text-[8px] text-gray-400 font-bold tracking-widest uppercase">
        CX {currentBox}/{TOTAL_BOXES}
      </div>

      {/* 2. Tempo Principal */}
      <div className={`text-xl md:text-2xl font-mono font-black tracking-tighter ${isLate ? 'animate-pulse text-red-500' : 'text-white'}`}>
        {isLate ? '+' : ''}
        {formatTime(absTime)}
      </div>

      {/* 3. Delta (Diferença) */}
      <div className="absolute bottom-2 flex flex-col items-center w-full px-3">
        <span className={`text-[10px] md:text-xs font-bold ${statusColor}`}>
          {delta > 0 ? '+' : ''}{delta.toFixed(1)}s
        </span>
        
        {/* Barra Visual */}
        <div className="w-full h-0.5 bg-gray-700 rounded-full mt-1 overflow-hidden">
             <div 
                className={`h-full transition-all duration-500 ${delta > 2 ? 'bg-blue-500' : delta < -2 ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: '100%' }}
             />
        </div>
      </div>

    </div>
  );
}
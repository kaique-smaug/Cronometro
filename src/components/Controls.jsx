import React from 'react';
import { Play, Pause, Square, Bookmark } from 'lucide-react';

/**
 * Componente Controls: Mostra os botões de controlo.
 */
function Controls({ isRunning, timeElapsed, onStart, onPause, onReset, onSaveLap }) {
  return (
    <div className="bg-gray-900 p-6 rounded-t-[2.5rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-center gap-6">
        
        {/* Botão Salvar Tempo (Bookmark) */}
        <button 
          onClick={onSaveLap}
          disabled={!isRunning || timeElapsed === 0}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-full flex items-center justify-center border border-blue-500 shadow-lg shadow-blue-900/30 transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          <Bookmark fill="white" size={20} />
        </button>
        
        {/* Botão Play / Pause */}
        {!isRunning ? (
          // Botão Play
          <button 
            onClick={onStart} 
            className="w-20 h-20 bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-full flex items-center justify-center shadow-lg shadow-emerald-900/30 transition-all"
          >
            <Play fill="white" size={36} className="ml-2" />
          </button>
        ) : (
          // Botão Pause
          <button 
            onClick={onPause} 
            className="w-20 h-20 bg-amber-500 hover:bg-amber-400 active:scale-95 rounded-full flex items-center justify-center shadow-lg shadow-amber-900/30 transition-all"
          >
            <Pause fill="white" size={36} />
          </button>
        )}

        {/* Botão Reset (Square) */}
        <button 
          onClick={onReset} 
          disabled={timeElapsed === 0} // Desabilitado se o tempo for 0
          className="w-14 h-14 bg-gray-800 hover:bg-gray-700 active:scale-95 rounded-full flex items-center justify-center border border-gray-700 transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          <Square fill="white" size={20} />
        </button>
      </div>
    </div>
  );
}

export default Controls;
const ActivityDisplay = ({ laps, isTimerActive }) => {

  // Função auxiliar para formatar o tempo (HH:MM:SS)
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s]
      .map(v => v < 10 ? "0" + v : v)
      .join(":");
  };

  // Se não houver voltas e o timer não estiver rodando, não mostra nada
  if (laps.length === 0 && !isTimerActive) {
    return null;
  }

  return (
    <div className="w-full max-w-sm">
      {/* Só mostra a caixa se tiver pelo menos uma volta registrada */}
      {laps.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 backdrop-blur-sm shadow-xl">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider text-center mb-4 border-b border-gray-800 pb-2">
            Caixas da Sessão
          </h3>
          
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {/* Mostra as voltas de trás para frente (mais recente no topo) */}
            {[...laps].reverse().map((lapTime, index) => {
              const realIndex = laps.length - index; // Para manter o número correto da caixa
              return (
                <div 
                  key={index} 
                  className="flex justify-between items-center text-sm p-3 rounded-lg bg-gray-800/40 hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-700"
                >
                  <span className="text-gray-400 font-mono">
                    Caixa {realIndex}
                  </span>
                  <span className="text-blue-400 font-mono font-bold text-base">
                    {formatTime(lapTime)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityDisplay;
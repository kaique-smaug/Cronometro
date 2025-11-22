// src/components/SessionNameModal.jsx
import React, { useState } from 'react';

const SessionNameModal = ({ onConfirm, onCancel }) => {
  const [name, setName] = useState('');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-4">Nome da Sessão</h2>
        <input 
          type="text"
          autoFocus
          placeholder="Ex: Treino de Corrida, Estudo..."
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white mb-4 focus:outline-none focus:border-blue-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onConfirm(name || "Sessão sem nome")}
        />
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 text-gray-400 hover:text-white">Cancelar</button>
          <button 
            onClick={() => onConfirm(name || "Sessão sem nome")}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
          >
            Começar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionNameModal;
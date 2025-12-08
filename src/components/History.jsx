// src/components/History.jsx
import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, deleteDoc, doc, collectionGroup } from "firebase/firestore";
import { db, firebaseConfig } from '../firebaseConfig';
// IMPORT ATUALIZADO: Agora importamos a função de PDF
import { downloadSessionPDF } from '../utils/fileHandler'; 

// LISTA DE E-MAILS ADMINS
const ADMIN_EMAILS = [
  "kaiqueramos826@gmail.com",
  "ricsoja@gmail.com"
];

const History = ({ user }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filterDate, setFilterDate] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  const [viewMode, setViewMode] = useState('mine'); 
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    let q;

    if (viewMode === 'all' && isAdmin) {
      q = query(collectionGroup(db, 'tempos'));
    } else {
      const appId = firebaseConfig.appId || "seu-app-id-padrao";
      const collectionPath = `registros_cronometro/${appId}/users/${user.uid}/tempos`;
      q = query(collection(db, collectionPath));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedSessions = [];
      querySnapshot.forEach((doc) => {
        fetchedSessions.push({ 
          id: doc.id, 
          refPath: doc.ref.path, 
          ...doc.data() 
        });
      });

      fetchedSessions.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA; 
      });

      setSessions(fetchedSessions);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar histórico:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, viewMode, isAdmin]);

  const filteredSessions = sessions.filter(session => {
    if (!filterDate) return true;
    if (!session.createdAt) return false;

    const dateObj = session.createdAt.seconds 
      ? new Date(session.createdAt.seconds * 1000) 
      : new Date(session.createdAt);

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const sessionDateStr = `${year}-${month}-${day}`;

    return sessionDateStr === filterDate;
  });

  const handleDeleteClick = (session) => {
    setSessionToDelete(session); 
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSessionToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;

    try {
      let docRef;
      if (sessionToDelete.refPath) {
        docRef = doc(db, sessionToDelete.refPath);
      } else {
        const appId = firebaseConfig.appId || "seu-app-id-padrao";
        docRef = doc(db, `registros_cronometro/${appId}/users/${user.uid}/tempos`, sessionToDelete.id);
      }
      
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
      alert("Erro ao excluir tarefa.");
    } finally {
      handleCancelDelete();
    }
  };

  const formatDateForDisplay = (timestamp) => {
    if (!timestamp) return "Data desconhecida";
    return new Date(timestamp.seconds * 1000).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 animate-pulse">
        A carregar histórico...
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4 pb-24 relative">
      <h2 className="text-2xl font-bold text-white mb-6 text-center uppercase tracking-widest">
        Histórico de Tarefas
      </h2>

      {/* Painel Admin */}
      {isAdmin && (
        <div className="flex justify-center mb-6 bg-gray-900/50 p-1 rounded-lg border border-gray-800 w-fit mx-auto">
          <button
            onClick={() => setViewMode('mine')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              viewMode === 'mine' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Meus Registros
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              viewMode === 'all' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Ver Tudo (Admin)
          </button>
        </div>
      )}

      {/* Filtro de Data */}
      <div className="flex justify-center items-center gap-3 mb-6">
        <div className="relative flex items-center bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 shadow-sm focus-within:border-blue-500 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-transparent border-none text-white text-sm focus:ring-0 outline-none w-full cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
          />
        </div>
        {filterDate && (
          <button onClick={() => setFilterDate('')} className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/50 rounded-2xl border border-gray-800">
          <p className="text-gray-500 mb-2">Nenhuma tarefa salva ainda.</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/50 rounded-2xl border border-gray-800 border-dashed">
          <p className="text-gray-400 mb-2 font-medium">Nenhuma tarefa encontrada nesta data.</p>
          <button onClick={() => setFilterDate('')} className="text-sm text-blue-400 hover:text-blue-300 underline">Limpar filtro</button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <div key={session.id} className={`bg-gray-900 border rounded-xl p-5 hover:border-gray-700 transition-all shadow-sm relative group ${viewMode === 'all' ? 'border-purple-900/50' : 'border-gray-800'}`}>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  {viewMode === 'all' && (
                    <div className="mb-1">
                      <span className="text-xs bg-purple-900 text-purple-200 px-2 py-0.5 rounded font-bold">
                        {session.userName || session.userEmail || "Usuário"}
                      </span>
                    </div>
                  )}
                  
                  <h3 className="text-lg font-bold text-blue-400 mb-1">
                    {session.sessionName}
                  </h3>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {formatDateForDisplay(session.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold text-white">
                    {session.formattedTime}
                  </div>
                  <p className="text-xs text-gray-500 uppercase">Tempo Total</p>
                </div>
              </div>

              {session.laps && session.laps.length > 0 && (
                <div className="mt-4 border-t border-gray-800/50 pt-2">
                  <div className="flex flex-col divide-y divide-gray-800/50 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {session.laps.map((lap, idx) => (
                      <div key={idx} className="py-2 flex flex-col gap-1 w-full"> 
                        <div className="flex justify-between w-full text-sm">
                          <span className="text-gray-400 font-medium">Spot por caixa {idx + 1}</span>
                          <span className="text-blue-200 font-mono tracking-wider text-right">{lap.formatted}</span>
                        </div>
                        {lap.intervalFormatted && (
                          <div className="flex justify-between w-full text-xs border-t border-gray-700/30 pt-1">
                            <span className="text-gray-500">Spot intervalo por caixa {idx + 1}</span>
                            <span className="text-green-400 font-mono tracking-wider text-right">+{lap.intervalFormatted}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-gray-800/30 flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button
                  onClick={() => handleDeleteClick(session)}
                  className="flex items-center justify-center gap-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Excluir
                </button>

                {/* BOTÃO ATUALIZADO: Agora chama downloadSessionPDF e usa cor vermelha/PDF */}
                <button
                  onClick={() => downloadSessionPDF(session)}
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-red-900/20 w-full sm:w-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Salvar PDF
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl transform transition-all scale-100">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-2">Excluir Tarefa?</h2>
              <p className="text-gray-400 text-sm">
                Tem certeza que deseja excluir esta tarefa permanentemente?
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCancelDelete} className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-medium border border-gray-700 transition-colors">
                Cancelar
              </button>
              <button onClick={handleConfirmDelete} className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg transition-colors">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
// src/components/History.jsx
import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db, firebaseConfig } from '../firebaseConfig';
import { downloadSessionExcel } from '../utils/excelHandler'; 
// Removemos a importação de deleteSession pois faremos a lógica aqui para controlar o modal

const History = ({ user }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para o Modal de Exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  useEffect(() => {
    if (!user) return;

    const appId = firebaseConfig.appId || "seu-app-id-padrao";
    const collectionPath = `registros_cronometro/${appId}/users/${user.uid}/tempos`;
    
    const q = query(collection(db, collectionPath), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedSessions = [];
      querySnapshot.forEach((doc) => {
        fetchedSessions.push({ id: doc.id, ...doc.data() });
      });
      setSessions(fetchedSessions);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar histórico:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // --- Handlers do Modal ---
  const handleDeleteClick = (sessionId) => {
    setSessionToDelete(sessionId);
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSessionToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;

    try {
      const appId = firebaseConfig.appId || "seu-app-id-padrao";
      const docRef = doc(db, `registros_cronometro/${appId}/users/${user.uid}/tempos`, sessionToDelete);
      
      await deleteDoc(docRef);
      // Sucesso
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
      alert("Erro ao excluir tarefa. Verifique sua conexão.");
    } finally {
      handleCancelDelete(); // Fecha o modal
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

      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/50 rounded-2xl border border-gray-800">
          <p className="text-gray-500 mb-2">Nenhuma tarefa salva ainda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all shadow-sm relative group">
              
              <div className="flex justify-between items-start mb-4">
                <div>
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
                <div className="mt-4 pt-4 border-t border-gray-800/50 mb-4">
                  <p className="text-xs text-gray-500 uppercase mb-2 font-bold">Voltas ({session.laps.length})</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                    {session.laps.map((lap, idx) => (
                      <div key={idx} className="bg-gray-800/30 rounded px-2 py-1 text-xs font-mono text-gray-300 flex justify-between">
                        <span className="text-gray-500">#{idx + 1}</span>
                        <span>{typeof lap === 'object' ? lap.formatted : lap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BOTÕES DE AÇÃO */}
              <div className="mt-4 pt-3 border-t border-gray-800/30 flex flex-col-reverse sm:flex-row justify-end gap-3">
                
                {/* Botão Excluir */}
                <button
                  onClick={() => handleDeleteClick(session.id)}
                  className="flex items-center justify-center gap-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
                  title="Excluir Tarefa"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Excluir
                </button>

                {/* Botão Excel */}
                <button
                  onClick={() => downloadSessionExcel(session)}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-green-900/20 w-full sm:w-auto"
                  title="Baixar arquivo .xlsx para o computador"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Salvar Excel
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl transform transition-all scale-100">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-2">Excluir Tarefa?</h2>
              <p className="text-gray-400 text-sm">
                Tem certeza que deseja excluir esta tarefa permanentemente? Essa ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-medium border border-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg transition-colors"
              >
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
// src/components/History.jsx
import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db, firebaseConfig } from '../firebaseConfig';

const History = ({ user }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const appId = firebaseConfig.appId || "seu-app-id-padrao";
    const collectionPath = `registros_cronometro/${appId}/users/${user.uid}/tempos`;
    
    // Query para buscar sessões ordenadas pela data de criação (mais recentes primeiro)
    // Nota: orderBy pode exigir a criação de um índice no console do Firebase. 
    // Se der erro, remova o orderBy temporariamente ou clique no link do erro no console para criar o índice.
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

  // Formata a data do Timestamp do Firestore
  const formatDate = (timestamp) => {
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
    <div className="w-full max-w-3xl mx-auto p-4 pb-24">
      <h2 className="text-2xl font-bold text-white mb-6 text-center uppercase tracking-widest">
        Histórico de Tarefas
      </h2>

      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/50 rounded-2xl border border-gray-800">
          <p className="text-gray-500 mb-2">Nenhuma tarefa salva ainda.</p>
          <p className="text-sm text-gray-600">Use o cronômetro para registar a sua primeira atividade.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-blue-400 mb-1">
                    {session.sessionName}
                  </h3>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {formatDate(session.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold text-white">
                    {session.formattedTime}
                  </div>
                  <p className="text-xs text-gray-500 uppercase">Tempo Total</p>
                </div>
              </div>

              {/* Se houver voltas, mostra um resumo expansível ou lista simples */}
              {session.laps && session.laps.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-800/50">
                  <p className="text-xs text-gray-500 uppercase mb-2 font-bold">Voltas / Parciais ({session.laps.length})</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                    {session.laps.map((lap, idx) => (
                      <div key={idx} className="bg-gray-800/30 rounded px-2 py-1 text-xs font-mono text-gray-300 flex justify-between">
                        <span className="text-gray-500">#{idx + 1}</span>
                        <span>{lap.formatted || lap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
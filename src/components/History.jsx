// src/components/History.jsx
import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db, firebaseConfig } from '../firebaseConfig';
import * as XLSX from 'xlsx';

const History = ({ user }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // --- Função para Baixar Excel ---
  const handleDownloadExcel = (session) => {
    const wb = XLSX.utils.book_new();
    
    const headerInfo = [
      ["Relatório de Tarefa"],
      ["Nome", session.sessionName],
      ["Data", formatDate(session.createdAt)],
      ["Tempo Total", session.formattedTime],
      [], 
      ["Volta Nº", "Tempo"] 
    ];

    const lapsData = session.laps 
      ? session.laps.map((lap, index) => {
          const tempo = typeof lap === 'object' ? (lap.formatted || '-') : lap;
          return [ index + 1, tempo ];
        })
      : [["-", "-"]];

    const wsData = [...headerInfo, ...lapsData];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 15 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(wb, ws, "Relatório");

    const safeName = session.sessionName.replace(/[^a-z0-9]/gi, '_') || 'tarefa';
    XLSX.writeFile(wb, `${safeName}.xlsx`);
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

              {/* BOTÃO ÚNICO DE AÇÃO */}
              <div className="mt-4 pt-3 border-t border-gray-800/30 flex justify-end">
                <button
                  onClick={() => handleDownloadExcel(session)}
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
    </div>
  );
};

export default History;
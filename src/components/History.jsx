import React, { useEffect, useState, useRef } from 'react';
import { collection, query, onSnapshot, deleteDoc, doc, collectionGroup } from "firebase/firestore";
import { db, firebaseConfig } from '../firebaseConfig';
import { downloadSessionPDF, downloadMultipleSessionsPDF } from '../utils/fileHandler'; 

const ADMIN_EMAILS = ["kaiqueramos826@gmail.com", "ricsoja@gmail.com"];

const History = ({ user }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  
  // Estados para Modal de Exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  
  // Estados de Visualização/Admin
  const [viewMode, setViewMode] = useState('mine'); 
  const [selectedIds, setSelectedIds] = useState([]);

  // --- NOVOS ESTADOS ---
  const [activeMenuId, setActiveMenuId] = useState(null); // Qual menu está aberto
  const [previewSession, setPreviewSession] = useState(null); // Qual sessão está sendo visualizada no modal web
  
  // Ref para fechar menu ao clicar fora
  const menuRef = useRef(null);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  // Fecha o menu se clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      fetchedSessions.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setSessions(fetchedSessions);
      setLoading(false);
    }, (error) => {
      console.error("Erro:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, viewMode, isAdmin]);

  const filteredSessions = sessions.filter(session => {
    if (!filterDate) return true;
    const dateObj = session.createdAt?.seconds ? new Date(session.createdAt.seconds * 1000) : new Date(session.createdAt);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}` === filterDate;
  });

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExportSelected = () => {
    const selectedSessions = sessions.filter(s => selectedIds.includes(s.id));
    downloadMultipleSessionsPDF(selectedSessions);
    setSelectedIds([]); 
  };

  const handleDeleteClick = (e, session) => {
    e.stopPropagation(); 
    setSessionToDelete(session); 
    setShowDeleteModal(true);
    setActiveMenuId(null); // Fecha o menu se estiver aberto
  };

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    try {
      const docRef = sessionToDelete.refPath 
        ? doc(db, sessionToDelete.refPath) 
        : doc(db, `registros_cronometro/${firebaseConfig.appId}/users/${user.uid}/tempos`, sessionToDelete.id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(error);
    } finally {
      setShowDeleteModal(false);
      setSessionToDelete(null);
    }
  };

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const handleViewClick = (e, session) => {
    e.stopPropagation();
    setPreviewSession(session);
    setActiveMenuId(null);
  };

  const handleDownloadClick = (e, session) => {
    e.stopPropagation();
    downloadSessionPDF(session);
    setActiveMenuId(null);
  };

  const formatDateForDisplay = (timestamp) => {
    if (!timestamp) return "Data desconhecida";
    return new Date(timestamp.seconds * 1000).toLocaleString('pt-PT', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return <div className="flex items-center justify-center h-full text-gray-500 animate-pulse">A carregar histórico...</div>;

  return (
    <div className="w-full max-w-3xl mx-auto p-4 pb-24 relative">
      <h2 className="text-2xl font-bold text-white mb-6 text-center uppercase tracking-widest">Histórico de Tarefas</h2>

      {/* BOTÃO FLUTUANTE DE EXPORTAÇÃO EM MASSA */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <button 
            onClick={handleExportSelected}
            className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 border-2 border-white/20 whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Salvar {selectedIds.length} em um único PDF
          </button>
        </div>
      )}

      {/* Painel Admin */}
      {isAdmin && (
        <div className="flex justify-center mb-6 bg-gray-900/50 p-1 rounded-lg border border-gray-800 w-fit mx-auto">
          <button onClick={() => setViewMode('mine')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'mine' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Meus Registros</button>
          <button onClick={() => setViewMode('all')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'all' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>Ver Tudo (Admin)</button>
        </div>
      )}

      {/* Filtro de Data */}
      <div className="flex justify-center items-center gap-3 mb-6">
        <div className="relative flex items-center bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="bg-transparent border-none text-white text-sm outline-none cursor-pointer invert" />
        </div>
        {filterDate && <button onClick={() => setFilterDate('')} className="text-gray-400 hover:text-white text-sm">Limpar</button>}
      </div>

      <div className="space-y-4">
        {filteredSessions.map((session) => (
          <div 
            key={session.id} 
            onClick={() => toggleSelection(session.id)}
            className={`cursor-pointer bg-gray-900 border rounded-xl p-5 hover:border-blue-500 transition-all shadow-sm relative group ${selectedIds.includes(session.id) ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-900/10' : 'border-gray-800'}`}
          >
            {/* Checkbox Visual */}
            <div className="absolute top-5 left-4">
               <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedIds.includes(session.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-600 group-hover:border-gray-400'}`}>
                 {selectedIds.includes(session.id) && <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
               </div>
            </div>

            <div className="pl-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  {viewMode === 'all' && <div className="mb-1"><span className="text-xs bg-purple-900 text-purple-200 px-2 py-0.5 rounded font-bold">{session.userName || "Usuário"}</span></div>}
                  <h3 className="text-lg font-bold text-blue-400">{session.sessionName}</h3>
                  <p className="text-xs text-gray-500 uppercase">{formatDateForDisplay(session.createdAt)}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold text-white">{session.formattedTime}</div>
                  <p className="text-xs text-gray-500 uppercase">Tempo Total</p>
                </div>
              </div>

              {/* Botões de Ação com Menu Dropdown */}
              <div className="mt-4 pt-3 border-t border-gray-800/30 flex justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                
                {/* Botão Excluir */}
                <button 
                   onClick={(e) => handleDeleteClick(e, session)} 
                   className="flex items-center gap-1 text-red-400 text-sm hover:bg-red-400/10 px-2 py-1 rounded transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Excluir
                </button>
                
                {/* Dropdown Menu */}
                <div className="relative">
                    <button 
                        onClick={(e) => toggleMenu(e, session.id)}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm font-bold flex items-center gap-1 transition-colors"
                    >
                        Opções
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${activeMenuId === session.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Conteúdo do Dropdown */}
                    {activeMenuId === session.id && (
                        <div ref={menuRef} className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                            <button 
                                onClick={(e) => handleViewClick(e, session)}
                                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Visualizar
                            </button>
                            <button 
                                onClick={(e) => handleDownloadClick(e, session)}
                                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2 border-t border-gray-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Baixar PDF
                            </button>
                        </div>
                    )}
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL DE VISUALIZAÇÃO DE DETALHES --- */}
      {previewSession && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
           <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              
              {/* Header do Modal */}
              <div className="p-6 border-b border-gray-800 bg-gray-900/50 flex justify-between items-start">
                 <div>
                    <h3 className="text-xl font-bold text-white">{previewSession.sessionName}</h3>
                    <p className="text-gray-400 text-sm mt-1">{formatDateForDisplay(previewSession.createdAt)}</p>
                    {previewSession.userName && <span className="inline-block mt-2 px-2 py-0.5 rounded bg-blue-900/30 text-blue-400 text-xs font-bold border border-blue-900/50">{previewSession.userName}</span>}
                 </div>
                 <button onClick={() => setPreviewSession(null)} className="text-gray-400 hover:text-white p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                 </button>
              </div>

              {/* Corpo do Modal (Lista de Voltas) */}
              <div className="flex-1 overflow-y-auto p-0">
                  <div className="sticky top-0 bg-gray-800 text-gray-400 text-xs font-bold uppercase tracking-wider grid grid-cols-3 px-6 py-3 border-b border-gray-700">
                     <div className="text-center">Caixa</div>
                     <div className="text-center">Tempo</div>
                     <div className="text-center">Intervalo</div>
                  </div>
                  {previewSession.laps && previewSession.laps.map((lap, idx) => (
                      <div key={idx} className={`grid grid-cols-3 px-6 py-3 text-sm border-b border-gray-800 ${idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-900/50'}`}>
                         <div className="text-center text-gray-500 font-mono">#{idx + 1}</div>
                         <div className="text-center text-white font-mono font-bold">{lap.formatted}</div>
                         <div className="text-center text-gray-400 font-mono">{lap.intervalFormatted || '-'}</div>
                      </div>
                  ))}
              </div>

              {/* Rodapé do Modal */}
              <div className="p-4 border-t border-gray-800 bg-gray-900 flex justify-between items-center">
                 <div className="text-white font-bold text-lg">
                    Total: <span className="font-mono text-blue-400">{previewSession.formattedTime}</span>
                 </div>
                 <button 
                    onClick={() => downloadSessionPDF(previewSession)}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium border border-gray-700 transition-colors flex items-center gap-2"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Baixar PDF
                 </button>
              </div>

           </div>
        </div>
      )}

      {/* Modal de Exclusão (Mantido) */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-2">Excluir Tarefa?</h2>
              <p className="text-gray-400 text-sm">Esta ação não pode ser desfeita.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 px-4 bg-gray-800 text-gray-300 rounded-xl font-medium border border-gray-700">Cancelar</button>
              <button onClick={handleConfirmDelete} className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-bold">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
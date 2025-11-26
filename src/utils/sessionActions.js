import { doc, deleteDoc } from "firebase/firestore";
import { db, firebaseConfig } from "../firebaseConfig";

// Função isolada para deletar a sessão
export const deleteSession = async (userId, sessionId) => {
  // A confirmação (UI) pode ficar aqui para simplificar, 
  // ou ser feita no componente antes de chamar esta função.
  // Neste caso, mantivemos aqui para encapsular toda a ação "Deletar".
  const confirmDelete = window.confirm("Tem certeza que deseja excluir esta tarefa permanentemente?");
  
  if (!confirmDelete) return false;

  try {
    const appId = firebaseConfig.appId || "seu-app-id-padrao";
    // Monta o caminho exato
    const docRef = doc(db, `registros_cronometro/${appId}/users/${userId}/tempos`, sessionId);
    
    await deleteDoc(docRef);
    return true; // Retorna true se deu certo
  } catch (error) {
    console.error("Erro ao excluir tarefa:", error);
    alert("Erro ao excluir tarefa. Verifique sua conexão.");
    return false; // Retorna false se falhou
  }
};
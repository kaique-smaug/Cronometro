// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';

// Imports dos Componentes (Módulos)
import TimerDisplay from './components/TimerDisplay';
import LapsList from './components/LapsList';
import Controls from './components/Controls';
import SessionNameModal from './components/SessionNameModal';

// Import da Função Auxiliar
import { formatTime } from './utils/formatTime';

// Imports do Firebase
// CORREÇÃO AQUI: googleProvider deve vir deste arquivo, pois foi criado lá
import { db, auth, firebaseConfig, googleProvider } from './firebaseConfig'; 
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { 
  browserSessionPersistence, 
  onAuthStateChanged, 
  setPersistence, 
  signInWithPopup, 
  // googleProvider, // REMOVIDO DAQUI (Isto causava o erro)
  signOut 
} from "firebase/auth";

export default function App() {
  // --- Estados ---
  const [isRunning, setIsRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [laps, setLaps] = useState([]);
  
  const [isNamingSession, setIsNamingSession] = useState(false);
  const [sessionName, setSessionName] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false); 

  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const timerRef = useRef(null);

  // --- Autenticação ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser ? currentUser : null);
      setIsAuthReady(true);
    });
    return () => unsubscribeAuth();
  }, []);

  // --- Lógica do Timer ---
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prevTime => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  // --- Handlers ---
  const handleSaveLap = () => {
    if (isRunning && timeElapsed > 0) {
      setLaps(prevLaps => [...prevLaps, timeElapsed]);
    }
  };

  const handleStopRequest = () => {
    setIsRunning(false);
    if (timeElapsed > 0) {
      setShowSaveModal(true);
    }
  };

  const handleConfirmSave = async () => {
    if (!user) {
      alert("Você precisa estar logado para salvar.");
      setShowSaveModal(false);
      return;
    }

    const appId = firebaseConfig.appId || "seu-app-id-padrao"; 
    const collectionPath = `/registros_cronometro/${appId}/users/${user.uid}/tempos`;

    const newSession = {
      sessionName: sessionName || "Sessão sem nome",
      totalTime: timeElapsed,
      formattedTime: formatTime(timeElapsed),
      laps: laps.map(lapTime => ({
        seconds: lapTime,
        formatted: formatTime(lapTime)
      })),
      createdAt: serverTimestamp(),
      userId: user.uid
    };

    try {
      await addDoc(collection(db, collectionPath), newSession);
      console.log("Sessão salva com sucesso!");
    } catch (e) {
      console.error("Erro ao salvar:", e);
      alert("Erro ao salvar. Verifique suas permissões.");
    }

    resetTimerState();
  };

  const handleDiscard = () => {
    resetTimerState();
  };

  const resetTimerState = () => {
    setShowSaveModal(false);
    setTimeElapsed(0);
    setLaps([]);
    setSessionName(null);
    setIsRunning(false);
  };

  const handleStartRequest = () => {
    if (!isRunning && timeElapsed === 0) {
      setIsNamingSession(true);
    } else {
      setIsRunning(true);
    }
  };

  const handleConfirmName = (name) => {
    setSessionName(name);
    setIsNamingSession(false);
    setIsRunning(true);
  };

  const handleCancelName = () => {
    setIsNamingSession(false);
  };

  const handleLogin = async () => {
    try {
      await setPersistence(auth, browserSessionPersistence);
      // Agora googleProvider está corretamente importado e definido
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Erro login:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro logout", error);
    }
  };

  if (!isAuthReady) return <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">Carregando...</div>;

  // --- Renderização da Tela de Login ---
  if (isAuthReady && !user) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-8">
        <h1 className="text-3xl font-bold text-white mb-4">Cronômetro</h1>
        <button
          onClick={handleLogin}
          className="flex items-center justify-center gap-3 bg-white text-gray-800 font-medium px-6 py-3 rounded-lg shadow-lg hover:bg-gray-200 transition-all"
        >
          <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            <path fill="none" d="M0 0h48v48H0z"></path>
          </svg>
          Fazer Login com Google
        </button>
      </div>
    );
  }

  // --- Renderização da Aplicação Principal ---
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans relative">
      {/* Header */}
      <div className="p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center shadow-md">
        <div className="w-16"></div>
        <h1 className="text-lg font-bold text-blue-400 tracking-widest uppercase truncate max-w-[200px] text-center">
          {sessionName ? sessionName : "Cronômetro"}
        </h1>
        <button onClick={handleLogout} className="text-xs text-red-400 border border-red-900 px-3 py-1 rounded hover:bg-red-900/30 transition-colors">
          Sair
        </button>
      </div>

      {/* Área Principal */}
      <div className="flex-1 flex flex-col items-center p-6 space-y-6 overflow-hidden">
        <TimerDisplay timeElapsed={timeElapsed} isRunning={isRunning} />
        
        {/* Aqui usamos o componente LapsList que criamos */}
        <LapsList laps={laps} />
      </div>

      {/* Controles */}
      <Controls
        isRunning={isRunning}
        timeElapsed={timeElapsed}
        onStart={handleStartRequest}
        onPause={() => setIsRunning(false)}
        onReset={handleStopRequest} 
        onSaveLap={handleSaveLap}
      />

      {/* Modais */}
      {isNamingSession && (
        <SessionNameModal
          onConfirm={handleConfirmName}
          onCancel={handleCancelName}
        />
      )}

      {showSaveModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl transform transition-all scale-100">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-2">Finalizar Sessão?</h2>
              <p className="text-gray-400 text-sm">
                Deseja salvar o registro de <strong>{sessionName || "Cronômetro"}</strong>?
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleDiscard} className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-medium border border-gray-700">
                Descartar
              </button>
              <button onClick={handleConfirmSave} className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// src/App.jsx
import React, { useState, useEffect} from 'react';

// Componentes
import TimerDisplay from './components/TimerDisplay';
import LapsList from './components/LapsList';
import Controls from './components/Controls';
import SessionNameModal from './components/SessionNameModal';
import Menu from './components/Menu';
import History from './components/History';
import CarTabs from './components/CarTabs';

// Hooks e Utilitários
import { useCarTimer } from './hooks/useCarTimer'; 
import { formatTime } from './utils/formatTime';
import { db, auth, firebaseConfig, googleProvider } from './firebaseConfig'; 
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { 
  browserSessionPersistence, 
  onAuthStateChanged, 
  setPersistence, 
  signInWithPopup, 
  signOut 
} from "firebase/auth";

export default function App() {
  // --- Estados Globais ---
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentView, setCurrentView] = useState('timer'); 
  
  // --- Hook do Cronômetro ---
  const { 
    cars, 
    activeCarId, 
    activeCar, 
    setActiveCarId, 
    actions 
  } = useCarTimer();

  // --- Estados de UI ---
  const [isNamingSession, setIsNamingSession] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false); 
  
  // NOVO: Estado para o modal de Erro
  const [showErrorModal, setShowErrorModal] = useState(false);

  // --- Autenticação ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser ? currentUser : null);
      setIsAuthReady(true);
    });
    return () => unsubscribeAuth();
  }, []);

  // --- Handlers de UI ---
  const handleStartRequest = () => {
    if (!activeCar.isRunning && activeCar.time === 0) {
      setIsNamingSession(true);
    } else {
      actions.start();
    }
  };

  const handleConfirmName = (name) => {
    const finalName = name.trim() ? name : `Carro ${activeCarId}`;
    actions.setTaskName(finalName);
    actions.start();
    setIsNamingSession(false);
  };

  const handleCancelName = () => setIsNamingSession(false);
  
  const handleStopRequest = () => {
    actions.stop(); 
    if (activeCar.time > 0) {
      setShowSaveModal(true); 
    }
  };

  const handleConfirmSave = async () => {
    if (!user) {
      alert("Precisa de estar autenticado para salvar.");
      setShowSaveModal(false);
      return;
    }

    const appId = firebaseConfig.appId || "seu-app-id-padrao"; 
    const collectionPath = `registros_cronometro/${appId}/users/${user.uid}/tempos`;

    const finalSessionName = activeCar.taskName || `Carro ${activeCarId} - Sem Título`;
    
    let previousLapTime = 0;
    const lapsData = activeCar.laps.map((currentLapTime, index) => {
      
      const interval = index ==  0 ? 0: currentLapTime - previousLapTime;
      previousLapTime = currentLapTime;

      return {
        seconds: currentLapTime,
        formatted: formatTime(currentLapTime),
        intervalFormatted: formatTime(interval) 
      };
    });

    const newSession = {
      sessionName: finalSessionName,
      carId: activeCarId,
      totalTime: activeCar.time,
      formattedTime: formatTime(activeCar.time),
      laps: lapsData, 
      createdAt: serverTimestamp(),
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName || "Usuário Anônimo"
    };

    try {
      await addDoc(collection(db, collectionPath), newSession);
      console.log(`Sessão do Carro ${activeCarId} salva!`);
      // Fecha o modal de salvar e reseta APENAS se der sucesso
      handleDiscard(); 
    } catch (e) {
      console.error("Erro ao salvar:", e);
      // CORREÇÃO: Abre o modal de erro em vez do alert
      setShowSaveModal(false); // Fecha o modal de confirmação primeiro
      setShowErrorModal(true); // Abre o modal de erro
    }
  };

  const handleDiscard = () => {
    setShowSaveModal(false);
    actions.reset(); 
  };

  const handleCloseError = () => {
    setShowErrorModal(false);
  };

  // --- Auth ---
  const handleLogin = async () => {
    try {
      await setPersistence(auth, browserSessionPersistence);
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

  if (!isAuthReady) return <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">A carregar...</div>;

  if (isAuthReady && !user) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-8">
        <h1 className="text-3xl font-bold text-white mb-4">Cronômetro Multi-Carros</h1>
        <button onClick={handleLogin} className="flex items-center justify-center gap-3 bg-white text-gray-800 font-medium px-6 py-3 rounded-lg shadow-lg hover:bg-gray-200 transition-all">
          Entrar com Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans relative overflow-hidden">
      
      <Menu 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        onLogout={handleLogout}
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
        
        <div className={`flex flex-col items-center p-6 pt-10 space-y-4 min-h-full ${currentView === 'timer' ? 'block' : 'hidden'}`}>
          <CarTabs 
            activeCarId={activeCarId} 
            onSelectCar={setActiveCarId} 
            cars={cars} 
          />

          {activeCar.taskName && (
            <div className="text-gray-500 text-sm uppercase tracking-widest font-bold">
              {activeCar.taskName}
            </div>
          )}

          <TimerDisplay timeElapsed={activeCar.time} isRunning={activeCar.isRunning} />
          <LapsList laps={activeCar.laps} />
        </div>

        <div className={`p-4 pt-10 min-h-full ${currentView === 'history' ? 'block' : 'hidden'}`}>
          <History user={user} />
        </div>

      </div>

      {currentView === 'timer' && (
        <Controls
          isRunning={activeCar.isRunning}
          timeElapsed={activeCar.time}
          onStart={handleStartRequest}
          onPause={actions.pause}
          onReset={handleStopRequest} 
          onSaveLap={actions.addLap}
        />
      )}

      {isNamingSession && (
        <SessionNameModal
          onConfirm={handleConfirmName}
          onCancel={handleCancelName}
        />
      )}

      {/* MODAL DE CONFIRMAÇÃO DE SALVAMENTO */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl transform transition-all scale-100">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-2">Finalizar Sessão - {activeCar.name}?</h2>
              <p className="text-gray-400 text-sm mb-4">
                Deseja salvar os dados desta sessão?
              </p>
              
              <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                <span className="block text-xs text-gray-500 uppercase">Tarefa</span>
                <span className="block text-white font-medium">
                  {activeCar.taskName || `${activeCar.name} - Sem Título`}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleDiscard} className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-medium border border-gray-700 transition-colors">
                Descartar
              </button>
              <button onClick={handleConfirmSave} className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg transition-colors">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOVO: MODAL DE ERRO */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-red-900/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl transform transition-all scale-100">
            <div className="text-center mb-6">
              <div className="bg-red-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Erro ao Salvar</h2>
              <p className="text-gray-400 text-sm">
                Não foi possível salvar a sessão. Verifique se você tem permissão ou se está conectado à internet.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCloseError} className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium border border-gray-700 transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
// src/App.jsx
import React, { useState, useEffect } from 'react';

// Componentes
import TimerDisplay from './components/TimerDisplay';
import LapsList from './components/LapsList';
import Controls from './components/Controls';
import SessionNameModal from './components/SessionNameModal';
import Menu from './components/Menu';
import History from './components/History';
import CarTabs from './components/CarTabs';

// Hooks e Utilitários
import { useCarTimer } from './hooks/useCarTimer'; // <--- IMPORTAÇÃO NOVA
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
  
  // --- Hook do Cronômetro (Toda a lógica complexa está aqui agora) ---
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

  // --- Autenticação ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser ? currentUser : null);
      setIsAuthReady(true);
    });
    return () => unsubscribeAuth();
  }, []);

  // --- Handlers de UI (Conectam o botão à lógica do Hook) ---
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
    actions.stop(); // Para o tempo
    if (activeCar.time > 0) {
      setShowSaveModal(true); // Abre modal
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

    let timePrevius =  0;
    const processTime = activeCar.laps.map((lapTime) => {
      const interval = lapTime - timePrevius
      timePrevius = lapTime

      return {
        seconds: lapTime == 0 ? 0 : lapTime,
        formatted: formatTime(lapTime == 0 ? 0 : lapTime),
        // Salvamos o intervalo formatado corretamente aqui
        intervalFormatted: formatTime(interval) 
      };

    });
    
    console.log(processTime)

    const newSession = {
      sessionName: finalSessionName,
      carId: activeCarId,
      totalTime: activeCar.time,
      formattedTime: formatTime(activeCar.time),
      laps: processTime,
      createdAt: serverTimestamp(),
      userId: user.uid
    };

    try {
      await addDoc(collection(db, collectionPath), newSession);
      console.log(`Sessão do Carro ${activeCarId} salva!`);
    } catch (e) {
      console.error("Erro ao salvar:", e);
      alert("Erro ao salvar. Verifique as permissões.");
    }

    handleDiscard(); // Reseta e fecha modal
  };

  const handleDiscard = () => {
    setShowSaveModal(false);
    actions.reset(); // Reseta o cronômetro do hook
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
        
        {/* TELA DO CRONÔMETRO */}
        <div className={`flex flex-col items-center p-6 pt-10 space-y-4 min-h-full ${currentView === 'timer' ? 'block' : 'hidden'}`}>
          
          <CarTabs 
            activeCarId={activeCarId} 
            onSelectCar={setActiveCarId} 
            cars={cars} 
          />

          {/* Nome da Tarefa (Apenas Exibição Discreta se já definida) */}
          {activeCar.taskName && (
            <div className="text-gray-500 text-sm uppercase tracking-widest font-bold">
              {activeCar.taskName}
            </div>
          )}

          <TimerDisplay timeElapsed={activeCar.time} isRunning={activeCar.isRunning} />
          
          <LapsList laps={activeCar.laps} />
        </div>

        {/* TELA DO HISTÓRICO */}
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
    </div>
  );
}
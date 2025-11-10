import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, MapPin, Clock, Navigation } from 'lucide-react';

// =========================================
// UTILITÁRIOS MATEMÁTICOS
// =========================================
const deg2rad = (deg) => deg * (Math.PI / 180);

// Fórmula de Haversine para distância em metros
const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// =========================================
// FILTRO DE KALMAN SIMPLIFICADO (1D para Lat/Lon separado)
// =========================================
class KalmanFilter {
  constructor(processNoise = 1, measurementNoise = 10, estimationError = 10, initialValue = 0) {
    this.Q = processNoise; // Ruído do processo (o quanto confiamos no modelo de movimento)
    this.R = measurementNoise; // Ruído da medição (incerteza do GPS)
    this.P = estimationError; // Erro da estimativa atual
    this.X = initialValue; // Estado atual estimado (posição)
  }

  update(measurement, accuracy) {
    // Atualiza o ruído da medição com a precisão real do GPS no momento
    this.R = accuracy * accuracy; 

    // Previsão (simples: assumimos que ficou parado, movimento entra como ruído Q)
    this.P = this.P + this.Q;

    // Ganho de Kalman
    const K = this.P / (this.P + this.R);

    // Atualização do estado com a nova medição
    this.X = this.X + K * (measurement - this.X);

    // Atualização da covariância do erro
    this.P = (1 - K) * this.P;

    return this.X;
  }
}

// =========================================
// COMPONENTE PRINCIPAL
// =========================================
function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Refs para manter estado entre renderizações sem re-render
  const lastPositionRef = useRef(null);
  const watchIdRef = useRef(null);
  const timerRef = useRef(null);
  
  // Refs para os filtros de Kalman (um para Latitude, um para Longitude)
  const latKalmanRef = useRef(new KalmanFilter(3, 10, 10, 0)); 
  const lonKalmanRef = useRef(new KalmanFilter(3, 10, 10, 0));
  const isFirstReadingRef = useRef(true);

  // Cronômetro
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => setTimeElapsed(p => p + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  // Geolocalização com Filtro Kalman
  useEffect(() => {
    if (isRunning) {
      if (!navigator.geolocation) return setErrorMsg('Sem suporte a GPS.');

      const success = (pos) => {
        let { latitude, longitude, accuracy, speed } = pos.coords;

        // 1. Filtro Grosso: Ignora leituras absurdamente ruins (> 60m)
        if (accuracy > 60) {
            setGpsAccuracy(accuracy); return; 
        }
        
        setGpsAccuracy(accuracy);
        setCurrentSpeed(speed || 0);

        // 2. Inicialização dos Filtros na primeira leitura válida
        if (isFirstReadingRef.current) {
            latKalmanRef.current = new KalmanFilter(3, accuracy, accuracy, latitude);
            lonKalmanRef.current = new KalmanFilter(3, accuracy, accuracy, longitude);
            isFirstReadingRef.current = false;
            lastPositionRef.current = { latitude, longitude, timestamp: pos.timestamp };
            return;
        }

        // 3. Aplica o Filtro de Kalman
        const smoothLat = latKalmanRef.current.update(latitude, accuracy);
        const smoothLon = lonKalmanRef.current.update(longitude, accuracy);

        // 4. Cálculo de Distância com dados suavizados
        if (lastPositionRef.current) {
          const dist = getDistanceFromLatLonInMeters(
            lastPositionRef.current.latitude,
            lastPositionRef.current.longitude,
            smoothLat,
            smoothLon
          );

          // 5. Deadband Dinâmico: Só conta se moveu mais que a "incerteza" atual filtrada
          // Usei 0.8m como base mínima para tentar pegar passos lentos, mas exigindo consistência.
          const timeDiff = (pos.timestamp - lastPositionRef.current.timestamp) / 1000;
          const calculatedSpeed = timeDiff > 0 ? dist / timeDiff : 0;

          // Se moveu > 0.8m E velocidade < 30km/h (para evitar teleportes)
          if (dist > 0.8 && calculatedSpeed < 8.3) {
             setDistance(d => d + dist);
             lastPositionRef.current = { latitude: smoothLat, longitude: smoothLon, timestamp: pos.timestamp };
          }
        }
        setErrorMsg('');
      };

      const error = (err) => setErrorMsg(err.code === 1 ? 'Permissão negada.' : 'Sinal GPS perdido.');

      watchIdRef.current = navigator.geolocation.watchPosition(success, error, {
        enableHighAccuracy: true, timeout: 20000, maximumAge: 0
      });

    } else {
      // Cleanup ao pausar/parar
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      lastPositionRef.current = null;
      isFirstReadingRef.current = true;
    }
    return () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [isRunning]);

  // Reset total
  const handleReset = () => {
    setIsRunning(false); setTimeElapsed(0); setDistance(0);
    setCurrentSpeed(0); setGpsAccuracy(null); setErrorMsg('');
    lastPositionRef.current = null; isFirstReadingRef.current = true;
  };

  // Formatação de Tempo HH:MM:SS
  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s].map(v => v < 10 ? "0" + v : v).join(":");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans">
      <div className="p-4 bg-gray-900 border-b border-gray-800 text-center">
        <h1 className="text-lg font-bold text-blue-400 tracking-widest uppercase">Rastreador Pro V2</h1>
      </div>

      <div className="flex-1 flex flex-col items-center p-6 space-y-8">
        {errorMsg && <div className="bg-red-900/50 text-red-200 p-2 rounded text-sm">{errorMsg}</div>}

        {/* Círculo Principal de Distância */}
        <div className="relative flex flex-col items-center justify-center w-72 h-72 rounded-full bg-gradient-to-br from-gray-900 to-black border-4 border-gray-800 shadow-2xl">
          <MapPin className="w-8 h-8 text-emerald-500 opacity-70 mb-1" />
          
          {/* Exibição com Metros e Centímetros */}
          <span className="text-6xl font-bold font-mono tracking-tighter">
            {distance < 1000 
              ? distance.toFixed(2) // Mostra 2 casas decimais (centímetros)
              : (distance / 1000).toFixed(3) // Mostra 3 casas para KM (metros)
            }
          </span>
          <span className="text-gray-400 text-xl uppercase mt-2 font-medium">
            {distance < 1000 ? 'Metros' : 'KM'}
          </span>

          {isRunning && (
            <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500/80 border-r-emerald-500/20 border-b-transparent border-l-transparent animate-spin [animation-duration:3s]"></div>
          )}
        </div>

        {/* Cards de Métricas Secundárias */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 flex flex-col items-center">
            <Clock className="text-blue-500 w-6 h-6 mb-2" />
            <span className="text-2xl font-mono font-bold">{formatTime(timeElapsed)}</span>
            <span className="text-xs text-gray-500 uppercase">Tempo</span>
          </div>
          <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 flex flex-col items-center">
            <Navigation className="text-purple-500 w-6 h-6 mb-2" />
            <span className="text-2xl font-mono font-bold">{(currentSpeed * 3.6).toFixed(1)}</span>
            <span className="text-xs text-gray-500 uppercase">km/h</span>
          </div>
        </div>

        {/* Indicador de Precisão */}
        {gpsAccuracy !== null && isRunning && (
          <div className="flex items-center space-x-2 bg-gray-900 px-3 py-1.5 rounded-full text-xs font-medium text-gray-400 border border-gray-800">
            <div className={`w-2.5 h-2.5 rounded-full ${gpsAccuracy < 10 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : gpsAccuracy < 30 ? 'bg-yellow-500' : 'bg-red-500'}`} />
            <span>Precisão: ±{gpsAccuracy.toFixed(1)}m</span>
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="bg-gray-900 p-6 rounded-t-[2.5rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-center gap-6">
           {!isRunning ? (
            <button onClick={() => { setErrorMsg('Aguardando GPS...'); setIsRunning(true); }} className="w-20 h-20 bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-full flex items-center justify-center shadow-lg shadow-emerald-900/30 transition-all">
              <Play fill="white" size={36} className="ml-2" />
            </button>
           ) : (
            <button onClick={() => setIsRunning(false)} className="w-20 h-20 bg-amber-500 hover:bg-amber-400 active:scale-95 rounded-full flex items-center justify-center shadow-lg shadow-amber-900/30 transition-all">
              <Pause fill="white" size={36} />
            </button>
           )}
           <button onClick={handleReset} disabled={isRunning && timeElapsed === 0} className="w-14 h-14 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:pointer-events-none active:scale-95 rounded-full flex items-center justify-center border border-gray-700 transition-all">
             <Square fill="white" size={20} />
           </button>
        </div>
      </div>
    </div>
  );
}

export default App;
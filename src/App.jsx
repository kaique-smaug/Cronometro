import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, MapPin, Clock, Navigation } from 'lucide-react';

// Função auxiliar para converter graus em radianos
const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

// Fórmula de Haversine para calcular a distância entre dois pontos lat/long em metros
const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Raio da Terra em metros
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Componente para formatar o tempo (HH:MM:SS)
const formatTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map(v => v < 10 ? "0" + v : v)
    .join(":");
};

function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Referências para manter valores entre renderizações
  const lastPositionRef = useRef(null);
  const watchIdRef = useRef(null);
  const timerRef = useRef(null);
  // Histórico recente de posições para média móvel
  const positionHistoryRef = useRef([]);

  // Efeito para o Cronômetro
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  // Efeito para a Geolocalização com filtragem
  useEffect(() => {
    if (isRunning) {
      if (!navigator.geolocation) {
        setErrorMsg('Geolocalização não é suportada pelo seu navegador.');
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      };

      const success = (pos) => {
        let { latitude, longitude, accuracy, speed } = pos.coords;

        // 1. Filtro de Precisão Básica: Ignora leituras muito ruins (> 50m)
        if (accuracy > 50) {
            setGpsAccuracy(accuracy);
            return; 
        }

        setGpsAccuracy(accuracy);
        setCurrentSpeed(speed || 0);

        // 2. Filtro de Média Móvel (Suavização)
        const history = positionHistoryRef.current;
        history.push({ latitude, longitude });
        if (history.length > 5) history.shift();

        if (history.length > 0) {
            const avgLat = history.reduce((sum, p) => sum + p.latitude, 0) / history.length;
            const avgLon = history.reduce((sum, p) => sum + p.longitude, 0) / history.length;
            latitude = avgLat;
            longitude = avgLon;
        }

        if (lastPositionRef.current) {
          const dist = getDistanceFromLatLonInMeters(
            lastPositionRef.current.latitude,
            lastPositionRef.current.longitude,
            latitude,
            longitude
          );

          // 3. Filtro de Movimento Mínimo e Velocidade Realista
          const timeDiff = (pos.timestamp - lastPositionRef.current.timestamp) / 1000; // segundos
          const calculatedSpeed = timeDiff > 0 ? dist / timeDiff : 0; // m/s

          // Se moveu > 1.5m E a velocidade calculada é < 36km/h (10m/s)
          if (dist > 1.5 && calculatedSpeed < 10) {
             setDistance(prevDist => prevDist + dist);
             lastPositionRef.current = { latitude, longitude, timestamp: pos.timestamp };
          }
        } else {
           lastPositionRef.current = { latitude, longitude, timestamp: pos.timestamp };
        }
        setErrorMsg('');
      };

      const error = (err) => {
        let msg = 'Erro desconhecido de localização.';
        if (err.code === 1) msg = 'Permissão de localização negada.';
        if (err.code === 2) msg = 'Sinal de GPS indisponível. Vá para uma área aberta.';
        if (err.code === 3) msg = 'Tempo esgotado ao buscar localização.';
        setErrorMsg(msg);
      };

      watchIdRef.current = navigator.geolocation.watchPosition(success, error, options);

    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      lastPositionRef.current = null;
      positionHistoryRef.current = [];
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isRunning]);

  const handleStart = () => {
    setErrorMsg('Aguardando sinal de GPS estável...');
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeElapsed(0);
    setDistance(0);
    setCurrentSpeed(0);
    setGpsAccuracy(null);
    setErrorMsg('');
    lastPositionRef.current = null;
    positionHistoryRef.current = [];
  };

  const speedKmh = (currentSpeed * 3.6).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans">
      {/* Header */}
      <div className="p-6 bg-gray-800 shadow-md border-b border-gray-700">
        <h1 className="text-center text-xl font-semibold tracking-wider text-blue-400 uppercase">
          Rastreador Pro (Filtro Ativo)
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-start p-6 space-y-8">
        
        {errorMsg && (
          <div className={`w-full max-w-md p-3 rounded-lg text-center text-sm font-medium ${errorMsg.includes('Aguardando') ? 'bg-blue-900/50 text-blue-200' : 'bg-red-900/50 text-red-200'}`}>
            {errorMsg}
          </div>
        )}

        <div className="relative flex items-center justify-center w-72 h-72 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 shadow-[0_0_30px_rgba(0,0,0,0.5)] border-4 border-gray-700">
          <div className="text-center z-10 flex flex-col items-center">
            <MapPin className="w-8 h-8 text-emerald-500 mb-2 opacity-80" />
            <span className="text-6xl font-bold tracking-tighter font-mono">
              {distance < 1000 
                ? Math.floor(distance) 
                : (distance / 1000).toFixed(2)}
            </span>
            <span className="text-gray-400 text-xl uppercase mt-1">
              {distance < 1000 ? 'Metros' : 'KM'}
            </span>
          </div>
          {isRunning && (
            <div className="absolute w-full h-full rounded-full border-4 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent animate-spin duration-3000"></div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          <div className="bg-gray-800 p-4 rounded-2xl flex flex-col items-center shadow-lg border border-gray-700">
            <Clock className="w-6 h-6 text-blue-400 mb-2" />
            <span className="text-2xl font-mono font-semibold">
              {formatTime(timeElapsed)}
            </span>
            <span className="text-xs text-gray-400 uppercase mt-1">Tempo</span>
          </div>
          <div className="bg-gray-800 p-4 rounded-2xl flex flex-col items-center shadow-lg border border-gray-700">
            <Navigation className="w-6 h-6 text-purple-400 mb-2" />
            <span className="text-2xl font-mono font-semibold">
              {speedKmh}
            </span>
            <span className="text-xs text-gray-400 uppercase mt-1">km/h</span>
          </div>
        </div>
        
        {gpsAccuracy !== null && isRunning && (
             <div className="text-xs text-gray-500 flex items-center">
               <div className={`w-2 h-2 rounded-full mr-2 ${gpsAccuracy < 15 ? 'bg-green-500' : gpsAccuracy < 30 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
               Precisão do GPS: ±{Math.round(gpsAccuracy)}m
             </div>
        )}

      </div>

      <div className="bg-gray-800 p-6 pb-10 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
        <div className="flex justify-center items-center space-x-6">
          {!isRunning ? (
            <button 
              onClick={handleStart}
              className="flex flex-col items-center justify-center w-20 h-20 bg-emerald-600 active:bg-emerald-700 rounded-full shadow-lg transition-transform active:scale-95"
            >
              <Play fill="white" size={32} className="ml-1" />
            </button>
          ) : (
            <button 
              onClick={handlePause}
              className="flex flex-col items-center justify-center w-20 h-20 bg-amber-500 active:bg-amber-600 rounded-full shadow-lg transition-transform active:scale-95"
            >
              <Pause fill="white" size={32} />
            </button>
          )}

          <button 
            onClick={handleReset}
            disabled={isRunning && timeElapsed === 0}
            className="flex flex-col items-center justify-center w-14 h-14 bg-gray-700 active:bg-gray-600 rounded-full shadow-md transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Square fill="white" size={20} />
          </button>
        </div>
      </div>

    </div>
  );
}

export default App;
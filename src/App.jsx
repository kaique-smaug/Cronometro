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
  const distance = R * c;
  return distance;
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

  // Referências para manter valores entre renderizações sem causar re-renders desnecessários
  const lastPositionRef = useRef(null);
  const watchIdRef = useRef(null);
  const timerRef = useRef(null);

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

  // Efeito para a Geolocalização
  useEffect(() => {
    if (isRunning) {
      if (!navigator.geolocation) {
        setErrorMsg('Geolocalização não é suportada pelo seu navegador.');
        return;
      }

      const options = {
        enableHighAccuracy: true, // Solicita a melhor precisão possível (usa GPS)
        timeout: 15000,
        maximumAge: 0
      };

      const success = (pos) => {
        const { latitude, longitude, accuracy, speed } = pos.coords;

        setGpsAccuracy(accuracy);
        // Se o speed vier null (comum em alguns dispositivos parados), assumimos 0
        setCurrentSpeed(speed || 0);

        if (lastPositionRef.current) {
          const dist = getDistanceFromLatLonInMeters(
            lastPositionRef.current.latitude,
            lastPositionRef.current.longitude,
            latitude,
            longitude
          );

          // Filtro de ruído: só conta se moveu mais que a precisão do GPS ou um mínimo razoável (ex: 2 metros)
          // Isso evita que o boneco "ande sozinho" enquanto parado devido a flutuações do GPS.
          if (dist > 2 && accuracy < 30) { 
             setDistance(prevDist => prevDist + dist);
             lastPositionRef.current = { latitude, longitude };
          }
          // Se a precisão for muito ruim, não atualizamos a posição de referência para não gerar saltos falsos,
          // mas se for a primeira leitura, aceitamos.
        } else {
          // Primeira leitura válida
           lastPositionRef.current = { latitude, longitude };
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
      // Limpa o rastreador se parar
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      // Reseta a última posição para evitar saltos grandes se pausar e voltar a andar longe
      lastPositionRef.current = null;
    }

    // Cleanup ao desmontar
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isRunning]);

  const handleStart = () => {
    setErrorMsg('Buscando sinal de GPS...');
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
  };

  // Conversão de m/s para km/h para exibição
  const speedKmh = (currentSpeed * 3.6).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans">
      {/* Header */}
      <div className="p-6 bg-gray-800 shadow-md border-b border-gray-700">
        <h1 className="text-center text-xl font-semibold tracking-wider text-blue-400 uppercase">
          Rastreador Pro
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-start p-6 space-y-8">
        
        {/* Error / Status Message */}
        {errorMsg && (
          <div className={`w-full max-w-md p-3 rounded-lg text-center text-sm font-medium ${errorMsg.includes('Buscando') ? 'bg-blue-900/50 text-blue-200' : 'bg-red-900/50 text-red-200'}`}>
            {errorMsg}
          </div>
        )}

        {/* Main Metrics Circle */}
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
          {/* Decorative ring indicating active state */}
          {isRunning && (
            <div className="absolute w-full h-full rounded-full border-4 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent animate-spin duration-3000"></div>
          )}
        </div>

        {/* Secondary Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {/* Tempo */}
          <div className="bg-gray-800 p-4 rounded-2xl flex flex-col items-center shadow-lg border border-gray-700">
            <Clock className="w-6 h-6 text-blue-400 mb-2" />
            <span className="text-2xl font-mono font-semibold">
              {formatTime(timeElapsed)}
            </span>
            <span className="text-xs text-gray-400 uppercase mt-1">Tempo</span>
          </div>
          {/* Velocidade */}
          <div className="bg-gray-800 p-4 rounded-2xl flex flex-col items-center shadow-lg border border-gray-700">
            <Navigation className="w-6 h-6 text-purple-400 mb-2" />
            <span className="text-2xl font-mono font-semibold">
              {speedKmh}
            </span>
            <span className="text-xs text-gray-400 uppercase mt-1">km/h</span>
          </div>
        </div>
        
        {/* GPS Accuracy Indicator (Only show if we have data) */}
        {gpsAccuracy !== null && isRunning && (
             <div className="text-xs text-gray-500 flex items-center">
               <div className={`w-2 h-2 rounded-full mr-2 ${gpsAccuracy < 15 ? 'bg-green-500' : gpsAccuracy < 50 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
               Precisão do GPS: ±{Math.round(gpsAccuracy)}m
             </div>
        )}

      </div>

      {/* Controls Fixed Bottom */}
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
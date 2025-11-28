import { useState, useEffect, useRef } from 'react';

export const useCarTimer = () => {
  // Estado inicial dos carros
  const [cars, setCars] = useState({
    1: { id: 1, name: 'Carro 1', taskName: '', time: 0, isRunning: false, laps: [] },
    2: { id: 2, name: 'Carro 2', taskName: '', time: 0, isRunning: false, laps: [] },
    3: { id: 3, name: 'Carro 3', taskName: '', time: 0, isRunning: false, laps: [] },
    4: { id: 4, name: 'Carro 4', taskName: '', time: 0, isRunning: false, laps: [] },
    5: { id: 5, name: 'Comissão de Frente', taskName: '', time: 0, isRunning: false, laps: [] }
  });

  const [activeCarId, setActiveCarId] = useState(1);
  const timerRef = useRef(null);

  // Helper para pegar o carro ativo rapidamente
  const activeCar = cars[activeCarId];

  // Função interna para atualizar o carro ativo
  const updateActiveCar = (updates) => {
    setCars(prev => ({
      ...prev,
      [activeCarId]: { ...prev[activeCarId], ...updates }
    }));
  };

  // --- Lógica do Intervalo (O Coração do Cronômetro) ---
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCars(prevCars => {
        const newCars = { ...prevCars };
        let hasChanges = false;

        Object.keys(newCars).forEach(key => {
          if (newCars[key].isRunning) {
            newCars[key] = { 
              ...newCars[key], 
              time: newCars[key].time + 1 
            };
            hasChanges = true;
          }
        });

        return hasChanges ? newCars : prevCars;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  // --- Ações Exportadas ---

  const startCar = () => updateActiveCar({ isRunning: true });
  
  const pauseCar = () => updateActiveCar({ isRunning: false });
  
  const stopCar = () => updateActiveCar({ isRunning: false }); // Apenas para, não reseta

  const addLap = () => {
    if (activeCar.isRunning && activeCar.time > 0) {
      updateActiveCar({ laps: [...activeCar.laps, activeCar.time] });
    }
  };

  const setTaskName = (name) => updateActiveCar({ taskName: name });

  const resetCar = () => {
    updateActiveCar({
      time: 0,
      laps: [],
      isRunning: false,
      taskName: '' 
    });
  };

  // Retornamos tudo que o componente precisa
  return {
    cars,
    activeCarId,
    activeCar,
    setActiveCarId,
    actions: {
      start: startCar,
      pause: pauseCar,
      stop: stopCar,
      addLap: addLap,
      setTaskName: setTaskName,
      reset: resetCar
    }
  };
};
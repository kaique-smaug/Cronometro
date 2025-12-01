import React from 'react';

const CarTabs = ({ activeCarId, onSelectCar, cars }) => {
  const carList = Object.values(cars);

  return (
    <div className="flex w-full max-w-md bg-gray-900 rounded-xl p-1 mb-6 border border-gray-800 flex-wrap scrollbar-hide gap-1">
      {carList.map((car) => {
        const isActive = activeCarId === car.id;
        
        return (
          <button
            key={car.id}
            onClick={() => onSelectCar(car.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all relative whitespace-nowrap ${
              isActive 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {/* Indicador de "Rodando" */}
            {car.isRunning && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            )}
            
            {/* CORREÇÃO: Envolver o texto em um span evita o erro de "Node not found" */}
            <span>{car.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CarTabs;
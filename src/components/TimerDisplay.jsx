// src/components/TimerDisplay.jsx
import React from 'react';
import { formatTime } from '../utils/formatTime';

const TimerDisplay = ({ timeElapsed, isRunning }) => {
  const formatted = formatTime(timeElapsed);
  
  return (
    <div className="flex flex-col items-center justify-center py-10 relative">
      <div className={`w-64 h-64 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-500 ${isRunning ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'border-gray-700'}`}>
        <div className="text-gray-400 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-5xl font-mono font-bold text-white tracking-wider">
          {formatted}
        </div>
        <div className="text-xs text-gray-500 mt-2 uppercase tracking-widest">Tempo Total</div>
      </div>
    </div>
  );
};

export default TimerDisplay;
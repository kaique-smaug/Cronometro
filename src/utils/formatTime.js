/**
 * Formata o tempo total em segundos para o formato HH:MM:SS.
 * @param {number} totalSeconds - O número total de segundos.
 * @returns {string} O tempo formatado como "HH:MM:SS".
 */
export const formatTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const h = hours.toString().padStart(2, '0');
  const m = minutes.toString().padStart(2, '0');
  const s = seconds.toString().padStart(2, '0');

  return `${h}:${m}:${s}`;
};
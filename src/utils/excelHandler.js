import * as XLSX from 'xlsx';
import { formatTime } from '../utils/formatTime';

// Função auxiliar para formatar a data (vinda do Firebase Timestamp)
const formatDate = (timestamp) => {
  if (!timestamp) return "Data desconhecida";
  // Verifica se é um objeto Timestamp do Firebase (tem .seconds) ou Date normal
  const dateObj = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  
  return dateObj.toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Função Principal de Exportação
export const downloadSessionExcel = (session) => {
  const wb = XLSX.utils.book_new();
  
  // Cabeçalho com 3 colunas
  const headerInfo = [
    ["Relatório de Tarefa"],
    ["Nome", session.sessionName],
    ["Data", formatDate(session.createdAt)],
    ["Tempo Total", session.formattedTime],
    [], 
    ["Caixa Nº", "Tempo Acumulado", "Intervalo de Tempo"] 
  ];

  let previousSeconds = 0; 

  // Calculamos as linhas
  let timePevius = 0 
    const lapsData = session.laps 
      ? session.laps.map((lap, index) => {
          const time = typeof lap === 'object' ? (lap.formatted || '-') : lap;
          const timeSeconds = typeof lap === 'object' ? (lap.seconds || '-') : lap;
          
          const intervalTime = timeSeconds - timePevius
          

          timePevius = timeSeconds

          return [ index + 1, time, formatTime(intervalTime)];
        })
      : [["-", "-"]];

  // Junta cabeçalho + dados
  const wsData = [...headerInfo, ...lapsData];
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [{ wch: 10 }, { wch: 20 }, { wch: 20 }];

  XLSX.utils.book_append_sheet(wb, ws, "Relatório");

  const safeName = session.sessionName.replace(/[^a-z0-9]/gi, '_') || 'tarefa';
  XLSX.writeFile(wb, `${safeName}.xlsx`);
};
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatTime } from './formatTime'; // Certifique-se que o caminho está correto

const formatDate = (timestamp) => {
  if (!timestamp) return "Data desconhecida";
  // Verifica se é Timestamp do Firestore ou string/Date normal
  const dateObj = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  return dateObj.toLocaleString('pt-PT');
};

// Função auxiliar interna para desenhar o conteúdo de uma sessão no documento
const drawSessionContent = (doc, session, startY = 22) => {
  // --- CABEÇALHO ---
  doc.setFontSize(18);
  doc.setTextColor(40);
  doc.text("Relatório de Tarefa", 14, startY);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Nome da Tarefa: ${session.sessionName}`, 14, startY + 8);
  doc.text(`Data: ${formatDate(session.createdAt)}`, 14, startY + 13);
  
  if (session.userName) {
    doc.text(`Piloto/Responsável: ${session.userName}`, 14, startY + 18);
  }

  // Preparar dados da tabela
  const tableBody = session.laps 
    ? session.laps.map((lap, index) => [
        index + 1, 
        typeof lap === 'object' ? lap.formatted : '-', 
        typeof lap === 'object' ? (lap.intervalFormatted || '-') : '-'
      ])
    : [];

  // --- TABELA ---
  autoTable(doc, {
    startY: startY + 25,
    head: [['Caixa Nº', 'Tempo Acumulado', 'Intervalo']],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] }, // Azul
    styles: { fontSize: 10, cellPadding: 3, halign: 'center' },
    columnStyles: {
      0: { cellWidth: 30 }, // Coluna Caixa menor
    },
  });

  // --- TOTALIZADOR (RESUMO) ---
  // Pegamos a posição Y onde a tabela acabou
  let finalY = doc.lastAutoTable.finalY + 10;

  // Verifica se cabe na página (Altura A4 ~297mm). Se estiver muito embaixo, cria nova página.
  if (finalY > 250) {
    doc.addPage();
    finalY = 20;
  }

  // Cálculos Básicos
  const totalCaixas = session.laps ? session.laps.length : 0;
  const tempoFinal = session.formattedTime || "00:00:00";
  
  // --- CÁLCULO DA MÉDIA ---
  let mediaTexto = "-";
  if (session.totalTime && totalCaixas > 0) {
      const mediaSegundos = session.totalTime / totalCaixas;
      
      // 1. Math.round: Arredonda para o inteiro mais próximo (tira a vírgula)
      // Ex: 70.8s vira 71s
      const segundosArredondados = Math.round(mediaSegundos);

      // 2. formatTime: Transforma de volta no formato de relógio 
      // Ex: 71s vira "00:01:11"
      mediaTexto = formatTime(segundosArredondados); 
  }

  // Desenhar Quadro de Resumo
  doc.setDrawColor(200);
  doc.setFillColor(245, 247, 250); // Cinza muito claro
  doc.rect(14, finalY, 182, 25, 'FD'); // FD = Fill e Draw (Borda e Preenchimento)

  // Título do Resumo
  doc.setFontSize(10);
  doc.setTextColor(41, 128, 185); // Azul igual ao header da tabela
  doc.setFont(undefined, 'bold');
  doc.text("RESUMO DO DESEMPENHO", 19, finalY + 8);

  // Linha divisória interna
  doc.setDrawColor(220);
  doc.line(19, finalY + 10, 190, finalY + 10);

  // Dados do Resumo
  doc.setFont(undefined, 'normal');
  doc.setTextColor(60);
  doc.setFontSize(9);

  // Coluna 1
  doc.text(`Total de Caixas:`, 19, finalY + 18);
  doc.setFont(undefined, 'bold');
  doc.text(`${totalCaixas}`, 45, finalY + 18);

  // Coluna 2
  doc.text(`Tempo Total:`, 80, finalY + 18);
  doc.setFont(undefined, 'bold');
  doc.text(`${tempoFinal}`, 105, finalY + 18);

  // Coluna 3 (Média)
  doc.setFont(undefined, 'normal');
  doc.text(`Média p/ Caixa:`, 140, finalY + 18);
  doc.setFont(undefined, 'bold');
  
  // Imprime a média já formatada e arredondada
  doc.text(`${mediaTexto}`, 170, finalY + 18);
};

// --- FUNÇÕES EXPORTADAS ---

export const downloadSessionPDF = (session) => {
  const doc = new jsPDF();
  drawSessionContent(doc, session);
  const safeName = session.sessionName ? session.sessionName.replace(/[^a-z0-9]/gi, '_') : 'tarefa';
  doc.save(`${safeName}.pdf`);
};

export const downloadMultipleSessionsPDF = (sessions) => {
  const doc = new jsPDF();

  sessions.forEach((session, index) => {
    if (index > 0) doc.addPage();
    drawSessionContent(doc, session);
    
    // Rodapé
    //const pageCount = doc.internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Gerado pelo Cronômetro Multi-Carros', 14, doc.internal.pageSize.height - 10);
    doc.text(`Página ${index + 1}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
  });

  doc.save(`Relatorio_Agrupado_${new Date().getTime()}.pdf`);
};
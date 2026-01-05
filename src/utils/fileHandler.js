import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatDate = (timestamp) => {
  if (!timestamp) return "Data desconhecida";
  const dateObj = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  return dateObj.toLocaleString('pt-PT');
};

// Função auxiliar interna para desenhar o conteúdo de uma sessão no documento
const drawSessionContent = (doc, session, startY = 22) => {
  doc.setFontSize(18);
  doc.setTextColor(40);
  doc.text("Relatório de Tarefa", 14, startY);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Nome da Tarefa: ${session.sessionName}`, 14, startY + 10);
  doc.text(`Data: ${formatDate(session.createdAt)}`, 14, startY + 16);
  doc.text(`Tempo Total: ${session.formattedTime}`, 14, startY + 22);
  
  if (session.userName) {
    doc.text(`Responsável: ${session.userName}`, 14, startY + 28);
  }

  const tableBody = session.laps 
    ? session.laps.map((lap, index) => [
        index + 1, 
        typeof lap === 'object' ? lap.formatted : '-', 
        typeof lap === 'object' ? (lap.intervalFormatted || '-') : '-'
      ])
    : [];

  autoTable(doc, {
    startY: startY + 35,
    head: [['Caixa Nº', 'Tempo Acumulado', 'Intervalo']],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 30, halign: 'center' },
      1: { halign: 'center' },
      2: { halign: 'center' }
    },
  });
};

// EXPORTAÇÃO INDIVIDUAL (Já existente)
export const downloadSessionPDF = (session) => {
  const doc = new jsPDF();
  drawSessionContent(doc, session);
  const safeName = session.sessionName.replace(/[^a-z0-9]/gi, '_') || 'tarefa';
  doc.save(`${safeName}.pdf`);
};

// EXPORTAÇÃO MÚLTIPLA (Nova Funcionalidade)
export const downloadMultipleSessionsPDF = (sessions) => {
  const doc = new jsPDF();

  sessions.forEach((session, index) => {
    if (index > 0) doc.addPage(); // Adiciona nova página para cada sessão a partir da segunda
    drawSessionContent(doc, session);
    
    // Rodapé em cada página
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.text('Gerado pelo Cronômetro Multi-Carros', 14, doc.internal.pageSize.height - 10);
    doc.text(`Página ${index + 1}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
  });

  doc.save(`Relatorio_Agrupado_${new Date().getTime()}.pdf`);
};
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Importa o autoTable explicitamente

// Função auxiliar para formatar a data
const formatDate = (timestamp) => {
  if (!timestamp) return "Data desconhecida";
  const dateObj = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  return dateObj.toLocaleString('pt-PT');
};

export const downloadSessionPDF = (session) => {
  const doc = new jsPDF();

  // --- CABEÇALHO ---
  doc.setFontSize(18);
  doc.setTextColor(40);
  doc.text("Relatório de Tarefa", 14, 22);

  // --- INFORMAÇÕES GERAIS ---
  doc.setFontSize(11);
  doc.setTextColor(100);
  
  // Cria uma mini-tabela ou texto para os metadados
  doc.text(`Nome da Tarefa: ${session.sessionName}`, 14, 32);
  doc.text(`Data: ${formatDate(session.createdAt)}`, 14, 38);
  doc.text(`Tempo Total: ${session.formattedTime}`, 14, 44);
  
  if (session.userName) {
    doc.text(`Responsável: ${session.userName}`, 14, 50);
  }

  // --- TABELA DE VOLTAS ---
  
  // Prepara os dados para a tabela
  const tableBody = session.laps 
    ? session.laps.map((lap, index) => {
        const currentFormatted = typeof lap === 'object' ? lap.formatted : '-';
        const intervalFormatted = typeof lap === 'object' ? (lap.intervalFormatted || '-') : '-';
        
        return [ 
          index + 1, 
          currentFormatted, 
          intervalFormatted 
        ];
      })
    : [];

  // Gera a tabela usando a função importada diretamente
  // Em versões mais novas, podemos passar o 'doc' como primeiro argumento ou usar doc.autoTable se o plugin foi registrado globalmente.
  // A forma mais segura com ES modules modernos é chamar autoTable(doc, options) ou garantir a aplicação do plugin.
  
  // Tentativa 1: Método padrão se o plugin se auto-registrou (o que falhou antes)
  // doc.autoTable({ ... });

  // Tentativa 2 (Correção Robusta): Usar a função importada passando o doc
  autoTable(doc, {
    startY: 60, // Começa um pouco abaixo das informações
    head: [['Caixa Nº', 'Tempo Acumulado', 'Intervalo']],
    body: tableBody,
    theme: 'striped', // Estilo zebrado (profissional)
    headStyles: { fillColor: [41, 128, 185] }, // Azul bonito para o cabeçalho
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 30, halign: 'center' }, // Coluna Caixa
      1: { halign: 'center' }, // Coluna Tempo
      2: { halign: 'center' }  // Coluna Intervalo
    },
  });

  // --- RODAPÉ ---
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFontSize(8);
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text('Gerado pelo Cronômetro Multi-Carros', 14, doc.internal.pageSize.height - 10);
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
  }

  // --- SALVAR ---
  const safeName = session.sessionName.replace(/[^a-z0-9]/gi, '_') || 'tarefa';
  doc.save(`${safeName}.pdf`);
};
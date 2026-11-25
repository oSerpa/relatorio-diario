import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { TIPOS, PRODUTOS, DIAS, brl, dataBR } from './constantes'

export function exportarPDF({ nome, data, lancamentos, r }) {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text('Relatório diário', 14, 18)
  doc.setFontSize(11)
  doc.text(`${nome}  |  ${dataBR(data)}`, 14, 26)

  autoTable(doc, {
    startY: 32,
    head: [['Atividade', 'Quantidade']],
    body: Object.entries(TIPOS).map(([k, v]) => [v, r.contagem[k]]),
    theme: 'grid',
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    head: [['Recebido por produto', 'Valor']],
    body: [
      ...Object.entries(PRODUTOS).map(([k, v]) => [v, brl(r.porProduto[k])]),
      ['Total recebido', brl(r.recebidoTotal)],
    ],
    theme: 'grid',
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    head: [['Negociado na semana', 'Valor']],
    body: DIAS.map((d, i) => [d, brl(r.negociadoSemana[i])]),
    theme: 'grid',
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    head: [['Hora', 'Tipo', 'Produto', 'Cliente', 'Valor', 'Observação']],
    body: lancamentos.map((l) => [
      new Date(l.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      TIPOS[l.tipo] + (l.quantidade > 1 ? ' x' + l.quantidade : ''),
      l.produto ? PRODUTOS[l.produto] : '',
      l.cliente || '',
      l.valor != null ? brl(l.valor) : '',
      l.descricao || '',
    ]),
    theme: 'striped',
    styles: { fontSize: 9 },
  })

  doc.save(`relatorio-${data}.pdf`)
}

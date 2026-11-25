export const TIPOS = {
  cobranca: 'Cobrança',
  ligacao: 'Ligação',
  mensagem: 'Mensagem',
  recebimento: 'Recebimento',
  negociacao: 'Negociação',
}

export const PRODUTOS = {
  multa: 'Multas de trânsito',
  km_excedente: 'Km excedente',
  arrendamento: 'Arrendamento',
}

export const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

export const brl = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const hojeISO = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

export const dataBR = (iso) => iso.split('-').reverse().join('/')

// segunda e domingo da semana que contém a data
export const semanaDe = (iso) => {
  const d = new Date(iso + 'T12:00:00')
  const idx = (d.getDay() + 6) % 7
  const seg = new Date(d); seg.setDate(d.getDate() - idx)
  const dom = new Date(seg); dom.setDate(seg.getDate() + 6)
  const f = (x) => x.toISOString().slice(0, 10)
  return [f(seg), f(dom)]
}

export const diaDaSemana = (iso) => (new Date(iso + 'T12:00:00').getDay() + 6) % 7

export function resumo(doDia, daSemana) {
  const contagem = Object.fromEntries(Object.keys(TIPOS).map((t) => [t, 0]))
  const porProduto = Object.fromEntries(Object.keys(PRODUTOS).map((p) => [p, 0]))
  let recebidoTotal = 0
  let negociadoDia = 0
  for (const l of doDia) {
    contagem[l.tipo]++
    if (l.tipo === 'recebimento') {
      recebidoTotal += Number(l.valor || 0)
      if (l.produto) porProduto[l.produto] += Number(l.valor || 0)
    }
    if (l.tipo === 'negociacao') negociadoDia += Number(l.valor || 0)
  }
  const negociadoSemana = DIAS.map(() => 0)
  for (const l of daSemana) {
    if (l.tipo === 'negociacao') negociadoSemana[diaDaSemana(l.data)] += Number(l.valor || 0)
  }
  return { contagem, porProduto, recebidoTotal, negociadoDia, negociadoSemana }
}

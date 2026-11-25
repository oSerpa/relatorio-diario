import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import Login from './Login'
import Form from './Form'
import { TIPOS, PRODUTOS, DIAS, brl, hojeISO, dataBR, semanaDe, resumo } from './constantes'
import { exportarPDF } from './pdf'

export default function App() {
  const [sessao, setSessao] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSessao(data.session); setCarregando(false) })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSessao(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (carregando) return null
  return sessao ? <Painel usuario={sessao.user} /> : <Login />
}

function Painel({ usuario }) {
  const [data, setData] = useState(hojeISO())
  const [semana, setSemana] = useState([])
  const [editando, setEditando] = useState(null)
  const [erro, setErro] = useState('')
  const nome = usuario.user_metadata?.nome || usuario.email

  const carregar = useCallback(async () => {
    const [ini, fim] = semanaDe(data)
    const { data: rows, error } = await supabase
      .from('lancamentos').select('*')
      .gte('data', ini).lte('data', fim)
      .order('created_at')
    if (error) setErro(error.message)
    else setSemana(rows)
  }, [data])

  useEffect(() => { carregar() }, [carregar])

  const doDia = semana.filter((l) => l.data === data)
  const r = resumo(doDia, semana)

  async function salvar(campos) {
    setErro('')
    const q = editando
      ? supabase.from('lancamentos').update(campos).eq('id', editando.id)
      : supabase.from('lancamentos').insert({ ...campos, data })
    const { error } = await q
    if (error) { setErro(error.message); return false }
    setEditando(null)
    carregar()
    return true
  }

  async function excluir(l) {
    if (!window.confirm('Excluir este lançamento?')) return
    const { error } = await supabase.from('lancamentos').delete().eq('id', l.id)
    if (error) setErro(error.message)
    else carregar()
  }

  const totalSemana = r.negociadoSemana.reduce((a, b) => a + b, 0)
  const maxSemana = Math.max(...r.negociadoSemana, 1)
  const maxProduto = Math.max(...Object.values(r.porProduto), 1)
  const hojeIdx = (new Date(data + 'T12:00:00').getDay() + 6) % 7
  const dataLonga = new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="app">
      <header className="topo">
        <div>
          <h1>Relatório diário</h1>
          <p className="sub">{dataLonga}</p>
        </div>
        <div className="acoes-topo">
          <span className="chip">{nome}</span>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          <button onClick={() => exportarPDF({ nome, data, lancamentos: doDia, r })}>Exportar PDF</button>
          <button className="sec" onClick={() => supabase.auth.signOut()}>Sair</button>
        </div>
      </header>
      {erro && <p className="erro">{erro}</p>}

      <section className="kpis">
        <div className="kpi destaque verde"><small>Recebido no dia</small><strong>{brl(r.recebidoTotal)}</strong></div>
        <div className="kpi destaque azul"><small>Negociado no dia</small><strong>{brl(r.negociadoDia)}</strong></div>
        <div className="kpi destaque roxo"><small>Negociado na semana</small><strong>{brl(totalSemana)}</strong></div>
      </section>

      <section className="contagens">
        {Object.entries(TIPOS).map(([k, v]) => (
          <div className="contagem" key={k}><span>{v}</span><strong>{r.contagem[k]}</strong></div>
        ))}
      </section>

      <div className="grade">
        <div className="coluna">
          <Form onSalvar={salvar} editando={editando} onCancelar={() => setEditando(null)} />

          <div className="card">
            <div className="card-titulo"><h2>Lançamentos do dia</h2><span className="badge">{doDia.length}</span></div>
            {doDia.length === 0 ? <p className="vazio">Nada registrado nesse dia ainda.</p> : (
              <div className="tabela-wrap">
                <table className="lista">
                  <thead><tr><th>Hora</th><th>Tipo</th><th>Produto</th><th>Cliente</th><th className="num">Valor</th><th>Observação</th><th></th></tr></thead>
                  <tbody>
                    {doDia.map((l) => (
                      <tr key={l.id} className={editando?.id === l.id ? 'editando' : ''}>
                        <td className="hora">{new Date(l.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td><span className={'tag ' + l.tipo}>{TIPOS[l.tipo]}{l.quantidade > 1 ? ' × ' + l.quantidade : ''}</span></td>
                        <td>{l.produto ? PRODUTOS[l.produto] : '-'}</td>
                        <td>{l.cliente || '-'}</td>
                        <td className="num">{l.valor != null ? brl(l.valor) : '-'}</td>
                        <td className="obs">{l.descricao}</td>
                        <td className="acoes">
                          <button className="icone" title="Editar" onClick={() => setEditando(l)}>Editar</button>
                          <button className="icone perigo" title="Excluir" onClick={() => excluir(l)}>Excluir</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <aside className="coluna">
          <div className="card">
            <h2>Recebido por produto</h2>
            {Object.entries(PRODUTOS).map(([k, v]) => (
              <div className="barra-item" key={k}>
                <div className="barra-rotulo"><span>{v}</span><span>{brl(r.porProduto[k])}</span></div>
                <div className="barra"><div style={{ width: (r.porProduto[k] / maxProduto) * 100 + '%' }} /></div>
              </div>
            ))}
            <div className="total-linha"><span>Total</span><strong>{brl(r.recebidoTotal)}</strong></div>
          </div>

          <div className="card">
            <h2>Negociado na semana</h2>
            {DIAS.map((d, i) => (
              <div className={'barra-item' + (i === hojeIdx ? ' atual' : '')} key={d}>
                <div className="barra-rotulo"><span>{d}</span><span>{brl(r.negociadoSemana[i])}</span></div>
                <div className="barra roxo"><div style={{ width: (r.negociadoSemana[i] / maxSemana) * 100 + '%' }} /></div>
              </div>
            ))}
            <div className="total-linha"><span>Total</span><strong>{brl(totalSemana)}</strong></div>
          </div>
        </aside>
      </div>
    </div>
  )
}

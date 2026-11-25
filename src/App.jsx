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

  return (
    <div className="app">
      <header>
        <h1>Relatório diário</h1>
        <div className="linha">
          <span>{nome}</span>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          <button onClick={() => exportarPDF({ nome, data, lancamentos: doDia, r })}>Exportar PDF</button>
          <button className="sec" onClick={() => supabase.auth.signOut()}>Sair</button>
        </div>
      </header>
      {erro && <p className="erro">{erro}</p>}

      <section className="cards">
        {Object.entries(TIPOS).map(([k, v]) => (
          <div className="card mini" key={k}><small>{v}</small><strong>{r.contagem[k]}</strong></div>
        ))}
      </section>

      <div className="grade">
        <Form onSalvar={salvar} editando={editando} onCancelar={() => setEditando(null)} />
        <div className="card">
          <h2>Recebido em {dataBR(data)}</h2>
          <table><tbody>
            {Object.entries(PRODUTOS).map(([k, v]) => <tr key={k}><td>{v}</td><td>{brl(r.porProduto[k])}</td></tr>)}
            <tr className="total"><td>Total</td><td>{brl(r.recebidoTotal)}</td></tr>
          </tbody></table>
          <h2>Negociado na semana</h2>
          <table><tbody>
            {DIAS.map((d, i) => <tr key={d}><td>{d}</td><td>{brl(r.negociadoSemana[i])}</td></tr>)}
            <tr className="total"><td>Total</td><td>{brl(r.negociadoSemana.reduce((a, b) => a + b, 0))}</td></tr>
          </tbody></table>
        </div>
      </div>

      <div className="card">
        <h2>Lançamentos do dia ({doDia.length})</h2>
        {doDia.length === 0 ? <p className="vazio">Nada registrado nesse dia.</p> : (
          <table className="lista">
            <thead><tr><th>Hora</th><th>Tipo</th><th>Produto</th><th>Cliente</th><th>Valor</th><th>Observação</th><th></th></tr></thead>
            <tbody>
              {doDia.map((l) => (
                <tr key={l.id}>
                  <td>{new Date(l.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{TIPOS[l.tipo]}</td>
                  <td>{l.produto ? PRODUTOS[l.produto] : ''}</td>
                  <td>{l.cliente}</td>
                  <td>{l.valor != null ? brl(l.valor) : ''}</td>
                  <td>{l.descricao}</td>
                  <td className="acoes">
                    <button className="sec" onClick={() => setEditando(l)}>Editar</button>
                    <button className="sec" onClick={() => excluir(l)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

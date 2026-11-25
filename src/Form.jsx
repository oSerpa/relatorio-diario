import { useState, useEffect } from 'react'
import { TIPOS, PRODUTOS } from './constantes'

const vazio = { tipo: 'cobranca', produto: '', cliente: '', valor: '', descricao: '' }

export default function Form({ onSalvar, editando, onCancelar }) {
  const [f, setF] = useState(vazio)
  useEffect(() => {
    setF(editando ? { ...vazio, ...editando, produto: editando.produto || '', valor: editando.valor ?? '' } : vazio)
  }, [editando])

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const usaProduto = ['cobranca', 'recebimento', 'negociacao'].includes(f.tipo)
  const usaValor = ['recebimento', 'negociacao', 'cobranca'].includes(f.tipo)

  async function enviar(e) {
    e.preventDefault()
    const ok = await onSalvar({
      tipo: f.tipo,
      produto: usaProduto && f.produto ? f.produto : null,
      cliente: f.cliente || null,
      valor: usaValor && f.valor !== '' ? Number(f.valor) : null,
      descricao: f.descricao || null,
    })
    if (ok && !editando) setF({ ...vazio, tipo: f.tipo })
  }

  return (
    <form onSubmit={enviar} className="card form">
      <h2>{editando ? 'Editar lançamento' : 'Novo lançamento'}</h2>
      <div className="tipos">
        {Object.entries(TIPOS).map(([k, v]) => (
          <button type="button" key={k} className={f.tipo === k ? 'ativo' : ''} onClick={() => setF({ ...f, tipo: k })}>
            {v}
          </button>
        ))}
      </div>
      <div className="linha">
        {usaProduto && (
          <select value={f.produto} onChange={set('produto')} required={f.tipo === 'recebimento'}>
            <option value="">Produto</option>
            {Object.entries(PRODUTOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        )}
        <input placeholder="Cliente / placa / contrato" value={f.cliente} onChange={set('cliente')} />
        {usaValor && (
          <input type="number" step="0.01" min="0" placeholder="Valor (R$)" value={f.valor} onChange={set('valor')}
            required={f.tipo !== 'cobranca'} />
        )}
      </div>
      <div className="linha">
        <input placeholder="Observação" value={f.descricao} onChange={set('descricao')} />
        <button>{editando ? 'Salvar alteração' : 'Registrar'}</button>
        {editando && <button type="button" className="sec" onClick={onCancelar}>Cancelar</button>}
      </div>
    </form>
  )
}

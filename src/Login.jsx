import { useState } from 'react'
import { supabase } from './supabase'

export default function Login() {
  const [modo, setModo] = useState('entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [msg, setMsg] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    if (enviando) return
    setEnviando(true)
    setMsg('')
    const { error } =
      modo === 'entrar'
        ? await supabase.auth.signInWithPassword({ email, password: senha })
        : await supabase.auth.signUp({ email, password: senha, options: { data: { nome }, emailRedirectTo: window.location.origin + window.location.pathname } })
    setEnviando(false)
    if (error) setMsg(error.message)
    else if (modo === 'cadastrar') setMsg('Conta criada. Confirme pelo link que chegou no seu e-mail.')
  }

  return (
    <div className="login">
      <h1>Relatório diário</h1>
      <form onSubmit={enviar} className="card">
        {modo === 'cadastrar' && (
          <input placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        )}
        <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Senha (mín. 6)" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} />
        <button disabled={enviando}>{enviando ? 'Aguarde...' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}</button>
        {msg && <p className="msg">{msg}</p>}
        <button type="button" className="link" onClick={() => setModo(modo === 'entrar' ? 'cadastrar' : 'entrar')}>
          {modo === 'entrar' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
        </button>
      </form>
    </div>
  )
}

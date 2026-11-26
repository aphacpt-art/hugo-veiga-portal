'use client';
import { useState } from 'react';
import { enviarConvites } from '../actions';

const estadoAcesso = (c) => c.estado === 'bloqueado' ? 'Bloqueado' : c.user_id ? 'Ativo' : c.convidado_em ? 'Convidado' : 'Sem convite';

export default function ConvidarSelecionados({ clientes }) {
  const [sel, setSel] = useState(new Set());
  const [msg, setMsg] = useState('');
  const [aEnviar, setAEnviar] = useState(false);
  const alternar = (id) => { const n = new Set(sel); n.has(id) ? n.delete(id) : n.add(id); setSel(n); };
  const todos = clientes.length > 0 && sel.size === clientes.length;

  async function convidar() {
    setAEnviar(true); setMsg('');
    try {
      const r = await enviarConvites([...sel]);
      setMsg(`${r.enviados} convite(s) enviado(s).${r.erros.length ? ' Erros: ' + r.erros.join('; ') : ''}`);
      setSel(new Set());
    } catch (e) { setMsg(e.message); }
    setAEnviar(false);
  }

  return (
    <>
      <div className="linha" style={{ marginBottom: 8 }}>
        <span className="muted">{clientes.length} cliente(s){sel.size ? ` · ${sel.size} selecionado(s)` : ''}</span>
        <button className="btn primario" disabled={!sel.size || aEnviar} onClick={convidar}>
          {aEnviar ? 'A enviar…' : 'Enviar convite de acesso'}</button>
        {msg && <span className="muted" role="status">{msg}</span>}
      </div>
      <div className="card tabela-scroll">
        <table className="lista">
          <thead><tr>
            <th><input type="checkbox" aria-label="Selecionar todos" checked={todos} onChange={() => setSel(todos ? new Set() : new Set(clientes.map((c) => c.id)))} /></th>
            <th>Nome</th><th>NIF</th><th>E-mail</th><th>Marcas</th><th>Acesso</th>
          </tr></thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id}>
                <td><input type="checkbox" aria-label={`Selecionar ${c.nome}`} checked={sel.has(c.id)} onChange={() => alternar(c.id)} /></td>
                <td><a href={`/admin/clientes/${c.id}`}>{c.nome}</a>{c.empresa_cliente && <div className="muted">{c.empresa_cliente}</div>}</td>
                <td>{c.nif}</td><td>{c.email}</td>
                <td>{c.acessos?.[0]?.count ?? 0}</td>
                <td>{estadoAcesso(c)}</td>
              </tr>
            ))}
            {!clientes.length && <tr><td colSpan={6} className="muted">Sem clientes. Importe do HelloLeads ou crie um novo.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

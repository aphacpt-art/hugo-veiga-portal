'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { enviarConvites } from '../../actions';

const CAMPOS = [['nome', 'Nome *'], ['empresa_cliente', 'Empresa / loja'], ['nif', 'NIF *'], ['email', 'E-mail *'],
  ['telefone', 'Telefone'], ['morada', 'Morada'], ['codigo_postal', 'Código postal'], ['localidade', 'Localidade'], ['pais', 'País']];

export default function FichaCliente({ cliente, empresas, acessosIniciais, atividade }) {
  const router = useRouter();
  const [f, setF] = useState(cliente || { pais: 'Portugal', estado: 'ativo' });
  const [acessos, setAcessos] = useState(new Set(acessosIniciais));
  const [msg, setMsg] = useState(''); const [erro, setErro] = useState('');
  const [aGuardar, setAGuardar] = useState(false);

  const alternar = (id) => { const n = new Set(acessos); n.has(id) ? n.delete(id) : n.add(id); setAcessos(n); };

  async function guardar(e) {
    e.preventDefault(); setErro(''); setMsg(''); setAGuardar(true);
    const supabase = createClient();
    const dados = Object.fromEntries(CAMPOS.map(([k]) => [k, (f[k] ?? '').toString().trim() || null]));
    dados.email = dados.email?.toLowerCase(); dados.notas = f.notas || null; dados.estado = f.estado || 'ativo';
    let id = cliente?.id;
    const r = id ? await supabase.from('clientes').update(dados).eq('id', id) :
      await supabase.from('clientes').insert(dados).select('id').single();
    if (r.error) { setAGuardar(false); return setErro(r.error.code === '23505' ? 'Já existe um cliente com este NIF ou e-mail.' : r.error.message); }
    if (!id) id = r.data.id;
    const antes = new Set(acessosIniciais);
    const adicionar = [...acessos].filter((x) => !antes.has(x)).map((empresa_id) => ({ cliente_id: id, empresa_id }));
    const remover = [...antes].filter((x) => !acessos.has(x));
    if (adicionar.length) await supabase.from('acessos').insert(adicionar);
    if (remover.length) await supabase.from('acessos').delete().eq('cliente_id', id).in('empresa_id', remover);
    setAGuardar(false); setMsg('Guardado.');
    if (!cliente) router.replace(`/admin/clientes/${id}`); else router.refresh();
  }

  async function convidar() {
    setMsg(''); setErro('');
    try { const r = await enviarConvites([cliente.id]); r.erros.length ? setErro(r.erros.join('; ')) : setMsg('Convite enviado.'); router.refresh(); }
    catch (e) { setErro(e.message); }
  }

  return (
    <form onSubmit={guardar}>
      <p><a href="/admin/clientes" className="muted">← Clientes</a></p>
      <div className="linha" style={{ justifyContent: 'space-between' }}>
        <h1>{cliente ? cliente.nome : 'Novo cliente'}</h1>
        <div className="linha">
          {cliente && <button type="button" className="btn" onClick={convidar}>{cliente.user_id ? 'Enviar link de nova password' : 'Enviar convite de acesso'}</button>}
          <button className="btn primario" disabled={aGuardar}>{aGuardar ? 'A guardar…' : 'Guardar'}</button>
        </div>
      </div>
      {erro && <p className="erro" role="alert">{erro}</p>}
      {msg && <p className="sucesso" role="status">{msg}</p>}
      <div className="cols2">
        <div className="card pad">
          <h2 style={{ marginTop: 0 }}>Ficha</h2>
          {CAMPOS.map(([k, n]) => (
            <div key={k}>
              <label htmlFor={k}>{n}</label>
              <input id={k} required={n.endsWith('*')} type={k === 'email' ? 'email' : 'text'} value={f[k] ?? ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
            </div>
          ))}
          <label htmlFor="notas">Notas</label>
          <textarea id="notas" rows={3} value={f.notas ?? ''} onChange={(e) => setF({ ...f, notas: e.target.value })} />
          <label htmlFor="estado">Estado</label>
          <select id="estado" value={f.estado} onChange={(e) => setF({ ...f, estado: e.target.value })}>
            <option value="ativo">Ativo</option><option value="bloqueado">Bloqueado (sem acesso)</option>
          </select>
        </div>
        <div>
          <div className="card pad">
            <h2 style={{ marginTop: 0 }}>Marcas que pode ver</h2>
            <div className="linha" style={{ marginBottom: 8 }}>
              <button type="button" className="btn" onClick={() => setAcessos(new Set(empresas.map((e) => e.id)))}>Todas</button>
              <button type="button" className="btn" onClick={() => setAcessos(new Set())}>Nenhuma</button>
            </div>
            {!empresas.length ? <p className="muted">Ainda não há empresas. <a href="/admin/empresas">Criar empresas</a></p> : (
              <div className="checks">
                {empresas.map((e) => (
                  <label key={e.id}><input type="checkbox" checked={acessos.has(e.id)} onChange={() => alternar(e.id)} />{e.nome}</label>
                ))}
              </div>
            )}
          </div>
          {cliente && (
            <div className="card pad" style={{ marginTop: 16 }}>
              <h2 style={{ marginTop: 0 }}>Atividade recente</h2>
              {!atividade.length ? <p className="muted">Sem atividade.</p> : (
                <ul style={{ paddingLeft: 18, margin: 0, fontSize: 14 }}>
                  {atividade.map((a, i) => (
                    <li key={i}>{new Date(a.criado_em).toLocaleString('pt-PT')} · {a.acao.replace('_', ' ')}{a.detalhe?.titulo ? `: ${a.detalhe.titulo}` : a.detalhe?.q ? `: “${a.detalhe.q}”` : ''}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

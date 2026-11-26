'use client';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Pedidos({ pedidos }) {
  const router = useRouter();
  const supabase = createClient();
  async function marcar(id, tratado) { await supabase.from('pedidos_contacto').update({ tratado }).eq('id', id); router.refresh(); }
  async function criarCliente(p) {
    if (!p.nif) return alertar('Este pedido não tem NIF. Crie o cliente manualmente.');
    const { data, error } = await supabase.from('clientes').insert({ nome: p.nome, empresa_cliente: p.empresa, nif: p.nif.replace(/\s/g, ''), email: p.email.toLowerCase(), telefone: p.telefone, notas: p.mensagem }).select('id').single();
    if (error) return alertar(error.code === '23505' ? 'Já existe um cliente com este NIF ou e-mail.' : error.message);
    await marcar(p.id, true);
    router.push(`/admin/clientes/${data.id}`);
  }
  function alertar(m) { window.alert(m); }
  return (
    <>
      <h1>Pedidos de contacto</h1>
      <div className="card tabela-scroll">
        <table className="lista">
          <thead><tr><th>Data</th><th>Nome / empresa</th><th>Contactos</th><th>Mensagem</th><th></th></tr></thead>
          <tbody>
            {pedidos.map((p) => (
              <tr key={p.id} style={{ opacity: p.tratado ? 0.55 : 1 }}>
                <td>{new Date(p.criado_em).toLocaleString('pt-PT')}</td>
                <td><strong>{p.nome}</strong>{p.empresa && <div>{p.empresa}</div>}{p.nif && <div className="muted">NIF {p.nif}</div>}</td>
                <td><a href={`mailto:${p.email}`}>{p.email}</a>{p.telefone && <div><a href={`tel:${p.telefone}`}>{p.telefone}</a></div>}</td>
                <td style={{ maxWidth: 320 }}>{p.mensagem}</td>
                <td className="linha">
                  {!p.tratado && <button className="btn primario" onClick={() => criarCliente(p)}>Criar cliente</button>}
                  <button className="btn" onClick={() => marcar(p.id, !p.tratado)}>{p.tratado ? 'Reabrir' : 'Marcar tratado'}</button>
                </td>
              </tr>
            ))}
            {!pedidos.length && <tr><td colSpan={5} className="muted">Sem pedidos.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

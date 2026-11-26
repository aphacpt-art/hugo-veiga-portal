import { createClient } from '@/lib/supabase/server';

export default async function Atividade() {
  const supabase = await createClient();
  const { data } = await supabase.from('atividade').select('acao, detalhe, criado_em, clientes(id, nome)').order('criado_em', { ascending: false }).limit(300);
  return (
    <>
      <h1>Atividade dos clientes</h1>
      <div className="card tabela-scroll">
        <table className="lista">
          <thead><tr><th>Data</th><th>Cliente</th><th>Ação</th><th>Detalhe</th></tr></thead>
          <tbody>
            {(data || []).map((a, i) => (
              <tr key={i}>
                <td>{new Date(a.criado_em).toLocaleString('pt-PT')}</td>
                <td>{a.clientes ? <a href={`/admin/clientes/${a.clientes.id}`}>{a.clientes.nome}</a> : '—'}</td>
                <td>{a.acao.replace('_', ' ')}</td>
                <td>{a.detalhe?.titulo || (a.detalhe?.q ? `“${a.detalhe.q}”` : '')}</td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={4} className="muted">Sem atividade.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

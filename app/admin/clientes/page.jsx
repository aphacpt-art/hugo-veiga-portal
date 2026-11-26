import { createClient } from '@/lib/supabase/server';
import ConvidarSelecionados from './ConvidarSelecionados';

export default async function Clientes({ searchParams }) {
  const { q = '' } = await searchParams;
  const supabase = await createClient();
  let c = supabase.from('clientes').select('id, nif, nome, empresa_cliente, email, telefone, estado, user_id, convidado_em, acessos(count)').order('nome').limit(500);
  const t = q.replace(/[%,()]/g, ' ').trim();
  if (t) c = c.or(`nome.ilike.%${t}%,nif.ilike.%${t}%,email.ilike.%${t}%,empresa_cliente.ilike.%${t}%`);
  const { data: clientes } = await c;
  return (
    <>
      <div className="linha" style={{ justifyContent: 'space-between' }}>
        <h1>Clientes</h1>
        <div className="linha">
          <a className="btn" href="/admin/importar">Importar do HelloLeads</a>
          <a className="btn primario" href="/admin/clientes/novo">Novo cliente</a>
        </div>
      </div>
      <form className="pesquisa" style={{ marginBottom: 16 }}>
        <input name="q" defaultValue={q} placeholder="Pesquisar por nome, NIF, e-mail ou empresa" />
        <button className="btn">Pesquisar</button>
      </form>
      <ConvidarSelecionados clientes={clientes || []} />
    </>
  );
}

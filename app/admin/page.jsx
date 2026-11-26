import { createClient } from '@/lib/supabase/server';

export default async function Painel() {
  const supabase = await createClient();
  const conta = async (t, f) => { let c = supabase.from(t).select('*', { count: 'exact', head: true }); if (f) c = f(c); return (await c).count ?? 0; };
  const [clientes, ativos, empresas, documentos, pedidos] = await Promise.all([
    conta('clientes'), conta('clientes', (c) => c.not('user_id', 'is', null)), conta('empresas'), conta('documentos'),
    conta('pedidos_contacto', (c) => c.eq('tratado', false)),
  ]);
  const itens = [['Clientes', clientes, '/admin/clientes'], ['Com acesso ativado', ativos, '/admin/clientes'],
    ['Empresas', empresas, '/admin/empresas'], ['Documentos', documentos, '/admin/documentos'], ['Pedidos de contacto por tratar', pedidos, '/admin/pedidos']];
  return (
    <>
      <h1>Back-office</h1>
      <div className="grelha">
        {itens.map(([n, v, h]) => (
          <a key={n} href={h} className="card pad" style={{ textDecoration: 'none' }}>
            <div className="muted" style={{ fontSize: 14 }}>{n}</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{v}</div>
          </a>
        ))}
      </div>
    </>
  );
}

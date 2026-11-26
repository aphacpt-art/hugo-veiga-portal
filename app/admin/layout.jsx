import { redirect } from 'next/navigation';
import { getSessao } from '@/lib/supabase/server';
import Cabecalho from '@/components/Cabecalho';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }) {
  const { admin } = await getSessao();
  if (!admin) redirect('/');
  return (
    <>
      <Cabecalho admin />
      <main className="wrap">
        <nav className="linha" style={{ marginBottom: 20 }}>
          <a className="btn" href="/admin">Painel</a>
          <a className="btn" href="/admin/clientes">Clientes</a>
          <a className="btn" href="/admin/importar">Importar clientes</a>
          <a className="btn" href="/admin/empresas">Empresas</a>
          <a className="btn" href="/admin/documentos">Documentos</a>
          <a className="btn" href="/admin/pedidos">Pedidos de contacto</a>
          <a className="btn" href="/admin/atividade">Atividade</a>
        </nav>
        {children}
      </main>
    </>
  );
}

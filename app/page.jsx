import { redirect } from 'next/navigation';
import { getSessao } from '@/lib/supabase/server';
import Cabecalho from '@/components/Cabecalho';
import Pesquisa from '@/components/Pesquisa';
import { urlLogotipo } from '@/lib/logotipo';

export const dynamic = 'force-dynamic';

export default async function Inicio() {
  const { supabase, user, admin, cliente } = await getSessao();
  if (!user) redirect('/entrar');
  if (cliente) {
    await supabase.from('atividade').insert({ cliente_id: cliente.id, acao: 'entrada' });
  }
  const { data: empresas } = await supabase.from('empresas').select('id, nome, setor, logotipo_path')
    .eq('ativa', true).order('ordem').order('nome');

  return (
    <>
      <Cabecalho admin={admin} />
      <main className="wrap">
        <h1>{cliente ? `Olá, ${cliente.nome}` : 'As marcas'}</h1>
        <Pesquisa />
        <h2>Marcas</h2>
        {!empresas?.length ? (
          <p className="muted">{admin ? 'Ainda não há empresas. Crie-as no back-office.' : 'Ainda não tem marcas associadas. Contacte-nos.'}</p>
        ) : (
          <div className="grelha">
            {empresas.map((e) => (
              <a key={e.id} href={`/empresa/${e.id}`} className="card empresa-tile">
                {e.logotipo_path ? <img src={urlLogotipo(e.logotipo_path)} alt={e.nome} /> : <strong>{e.nome}</strong>}
                {e.logotipo_path && <span className="muted" style={{ fontSize: 14 }}>{e.nome}</span>}
              </a>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

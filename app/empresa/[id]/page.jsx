import { notFound } from 'next/navigation';
import { getSessao } from '@/lib/supabase/server';
import Cabecalho from '@/components/Cabecalho';
import CartaoDocumento from '@/components/CartaoDocumento';
import { urlLogotipo } from '@/lib/logotipo';

export const dynamic = 'force-dynamic';

const FILTROS = [['', 'Todos'], ['catalogo', 'Catálogos'], ['precos', 'Tabelas de preços'], ['outro', 'Outros']];

export default async function Empresa({ params, searchParams }) {
  const { id } = await params;
  const { tipo = '' } = await searchParams;
  const { supabase, admin } = await getSessao();
  const { data: empresa } = await supabase.from('empresas').select('*').eq('id', id).maybeSingle();
  if (!empresa) notFound();
  let consulta = supabase.from('documentos').select('*').eq('empresa_id', id).eq('ativo', true)
    .order('ordem').order('criado_em', { ascending: false });
  if (tipo) consulta = consulta.eq('tipo', tipo);
  const { data: docs } = await consulta;
  const capas = (docs || []).filter((d) => d.capa_path).map((d) => d.capa_path);
  const urls = {};
  if (capas.length) {
    const { data } = await supabase.storage.from('documentos').createSignedUrls(capas, 3600);
    (data || []).forEach((r) => { if (r.signedUrl) urls[r.path] = r.signedUrl; });
  }

  return (
    <>
      <Cabecalho admin={admin} />
      <main className="wrap">
        <p><a href="/" className="muted">← Marcas</a></p>
        <div className="card pad linha" style={{ marginBottom: 16 }}>
          {empresa.logotipo_path && <img src={urlLogotipo(empresa.logotipo_path)} alt="" style={{ maxHeight: 64, maxWidth: 160, objectFit: 'contain' }} />}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ margin: 0 }}>{empresa.nome}</h1>
            {empresa.descricao && <p className="muted" style={{ margin: '4px 0 0' }}>{empresa.descricao}</p>}
          </div>
          {empresa.site_url && <a className="btn" href={empresa.site_url} target="_blank" rel="noopener">Visitar o site ↗</a>}
        </div>
        <div className="linha" style={{ marginBottom: 16 }}>
          {FILTROS.map(([v, n]) => (
            <a key={v} href={v ? `?tipo=${v}` : '?'} className={`btn ${tipo === v ? 'primario' : ''}`}>{n}</a>
          ))}
        </div>
        {!docs?.length ? <p className="muted">Ainda não há documentos nesta secção.</p> : (
          <div className="grelha">
            {docs.map((d) => <CartaoDocumento key={d.id} doc={d} capaUrl={urls[d.capa_path]} />)}
          </div>
        )}
      </main>
    </>
  );
}

import { getSessao } from '@/lib/supabase/server';
import Cabecalho from '@/components/Cabecalho';
import Pesquisa from '@/components/Pesquisa';
import CartaoDocumento from '@/components/CartaoDocumento';

export const dynamic = 'force-dynamic';

const limpar = (s) => s.replace(/[%,()]/g, ' ').trim().slice(0, 100);

export default async function PaginaPesquisa({ searchParams }) {
  const { q: bruto = '' } = await searchParams;
  const q = limpar(bruto);
  const { supabase, admin, cliente } = await getSessao();
  let produtos = [], docs = [];
  if (q) {
    const padrao = `%${q}%`;
    const [p, d] = await Promise.all([
      supabase.from('produtos').select('id, nome, referencia, preco, foto_path, pagina, documento_id, empresas(nome)')
        .or(`nome.ilike.${padrao},descricao.ilike.${padrao},referencia.ilike.${padrao}`).limit(48),
      supabase.from('documentos').select('*').eq('ativo', true).ilike('titulo', padrao).limit(24),
    ]);
    produtos = p.data || []; docs = d.data || [];
    if (cliente) await supabase.from('atividade').insert({ cliente_id: cliente.id, acao: 'pesquisa', detalhe: { q } });
  }
  const fotos = produtos.filter((p) => p.foto_path).map((p) => p.foto_path);
  const urls = {};
  if (fotos.length) {
    const { data } = await supabase.storage.from('documentos').createSignedUrls(fotos, 3600);
    (data || []).forEach((r) => { if (r.signedUrl) urls[r.path] = r.signedUrl; });
  }
  const eur = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  return (
    <>
      <Cabecalho admin={admin} />
      <main className="wrap">
        <Pesquisa q={q} />
        {q && <h2>Resultados para “{q}”</h2>}
        {q && !produtos.length && !docs.length && <p className="muted">Não encontrámos resultados nos catálogos a que tem acesso.</p>}
        {produtos.length > 0 && (<>
          <h2>Produtos</h2>
          <div className="grelha">
            {produtos.map((p) => (
              <div key={p.id} className="card doc produto">
                <div className="foto">{p.foto_path && <img src={urls[p.foto_path]} alt={p.nome} loading="lazy" />}</div>
                <div className="info">
                  <div className="titulo">{p.nome}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{p.empresas?.nome}{p.referencia ? ` · Ref. ${p.referencia}` : ''}</div>
                  {p.preco != null && <div className="preco">{eur.format(p.preco)}</div>}
                  {p.documento_id && <a className="btn" href={`/documento/${p.documento_id}?acao=ver`} target="_blank" rel="noopener">
                    Ver no catálogo{p.pagina ? ` (pág. ${p.pagina})` : ''}</a>}
                </div>
              </div>
            ))}
          </div>
        </>)}
        {docs.length > 0 && (<>
          <h2>Documentos</h2>
          <div className="grelha">{docs.map((d) => <CartaoDocumento key={d.id} doc={d} />)}</div>
        </>)}
      </main>
    </>
  );
}

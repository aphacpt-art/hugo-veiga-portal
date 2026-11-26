import { notFound } from 'next/navigation';
import { getSessao } from '@/lib/supabase/server';
import Cabecalho from '@/components/Cabecalho';
import VerExcel from '@/components/VerExcel';

export const dynamic = 'force-dynamic';

export default async function Ver({ params }) {
  const { id } = await params;
  const { supabase, admin } = await getSessao();
  const { data: doc } = await supabase.from('documentos').select('id, titulo, formato, ficheiro_path, empresa_id').eq('id', id).maybeSingle();
  if (!doc) notFound();
  const { data } = await supabase.storage.from('documentos').createSignedUrl(doc.ficheiro_path, 600);
  return (
    <>
      <Cabecalho admin={admin} />
      <main className="wrap">
        <p><a href={`/empresa/${doc.empresa_id}`} className="muted">← Voltar</a></p>
        <div className="linha" style={{ justifyContent: 'space-between' }}>
          <h1>{doc.titulo}</h1>
          <a className="btn primario" href={`/documento/${doc.id}?acao=descarregar`}>Descarregar</a>
        </div>
        <VerExcel url={data?.signedUrl} />
      </main>
    </>
  );
}

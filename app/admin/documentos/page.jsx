import { createClient } from '@/lib/supabase/server';
import Documentos from './Documentos';

export default async function PaginaDocumentos({ searchParams }) {
  const { empresa = '' } = await searchParams;
  const supabase = await createClient();
  const { data: empresas } = await supabase.from('empresas').select('id, nome').order('ordem').order('nome');
  let c = supabase.from('documentos').select('*, empresas(nome)').order('criado_em', { ascending: false }).limit(300);
  if (empresa) c = c.eq('empresa_id', empresa);
  const { data: docs } = await c;
  return <Documentos empresas={empresas || []} docs={docs || []} filtro={empresa} />;
}

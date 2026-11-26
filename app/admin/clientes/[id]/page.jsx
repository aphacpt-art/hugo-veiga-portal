import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import FichaCliente from './FichaCliente';

export default async function PaginaCliente({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: empresas } = await supabase.from('empresas').select('id, nome, setor').order('ordem').order('nome');
  let cliente = null, acessos = [], atividade = [];
  if (id !== 'novo') {
    ({ data: cliente } = await supabase.from('clientes').select('*').eq('id', id).maybeSingle());
    if (!cliente) notFound();
    const [a, at] = await Promise.all([
      supabase.from('acessos').select('empresa_id').eq('cliente_id', id),
      supabase.from('atividade').select('acao, detalhe, criado_em').eq('cliente_id', id).order('criado_em', { ascending: false }).limit(20),
    ]);
    acessos = (a.data || []).map((r) => r.empresa_id);
    atividade = at.data || [];
  }
  return <FichaCliente cliente={cliente} empresas={empresas || []} acessosIniciais={acessos} atividade={atividade} />;
}

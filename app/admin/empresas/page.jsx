import { createClient } from '@/lib/supabase/server';
import Empresas from './Empresas';

export default async function PaginaEmpresas() {
  const supabase = await createClient();
  const { data } = await supabase.from('empresas').select('*').order('ordem').order('nome');
  return <Empresas iniciais={data || []} />;
}

import { createClient } from '@/lib/supabase/server';
import Importador from './Importador';

export default async function Importar() {
  const supabase = await createClient();
  const { data: empresas } = await supabase.from('empresas').select('id, nome').order('ordem').order('nome');
  return <Importador empresas={empresas || []} />;
}

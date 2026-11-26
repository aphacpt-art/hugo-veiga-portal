import { createClient } from '@/lib/supabase/server';
import Pedidos from './Pedidos';

export default async function PaginaPedidos() {
  const supabase = await createClient();
  const { data } = await supabase.from('pedidos_contacto').select('*').order('tratado').order('criado_em', { ascending: false }).limit(300);
  return <Pedidos pedidos={data || []} />;
}

import { createServerClient } from '@supabase/ssr';
import { createClient as createPlainClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // chamado num Server Component: o middleware renova a sessão
          }
        },
      },
    }
  );
}

// Cliente com a chave de serviço: só para convites (nunca exposto ao browser)
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Falta configurar SUPABASE_SERVICE_ROLE_KEY no servidor.');
  return createPlainClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getSessao() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, admin: false, cliente: null };
  const [{ data: adm }, { data: cliente }] = await Promise.all([
    supabase.from('administradores').select('email').limit(1),
    supabase.from('clientes').select('*').eq('user_id', user.id).maybeSingle(),
  ]);
  return { supabase, user, admin: (adm?.length ?? 0) > 0, cliente };
}

'use server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

async function exigirAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sessão expirada.');
  const { data } = await supabase.from('administradores').select('email').limit(1);
  if (!data?.length) throw new Error('Sem permissão.');
  return supabase;
}

// Envia (ou reenvia) o convite de acesso aos clientes indicados
export async function enviarConvites(ids) {
  const supabase = await exigirAdmin();
  const servico = createServiceClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hugoveiga.pt';
  const { data: clientes } = await supabase.from('clientes').select('id, email, user_id, estado').in('id', ids);
  const resultado = { enviados: 0, erros: [] };
  for (const c of clientes || []) {
    if (c.estado !== 'ativo') { resultado.erros.push(`${c.email}: cliente bloqueado`); continue; }
    let error;
    if (c.user_id) {
      // já tem conta: envia link para redefinir a password
      ({ error } = await servico.auth.resetPasswordForEmail(c.email, { redirectTo: `${site}/auth/callback?next=/definir-password` }));
    } else {
      ({ error } = await servico.auth.admin.inviteUserByEmail(c.email, { redirectTo: `${site}/definir-password` }));
    }
    if (error) { resultado.erros.push(`${c.email}: ${error.message}`); continue; }
    await supabase.from('clientes').update({ convidado_em: new Date().toISOString() }).eq('id', c.id);
    resultado.enviados++;
  }
  return resultado;
}

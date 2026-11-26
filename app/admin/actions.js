'use server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { listarPasta, linkFicheiro } from '@/lib/webtuga';

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

// Cria documentos para os ficheiros novos nas pastas da Webtuga. Devolve os PDF sem capa, com link temporário
export async function sincronizarPastas() {
  const supabase = await exigirAdmin();
  const { data: empresas } = await supabase.from('empresas').select('id, nome, pasta_webtuga').not('pasta_webtuga', 'is', null);
  const res = { novos: 0, erros: [], semPasta: 0, capas: [] };
  if (!empresas?.length) { res.erros.push('Nenhuma empresa tem pasta da Webtuga definida (Empresas > editar).'); return res; }
  for (const emp of empresas) {
    let lista;
    try { lista = await listarPasta(emp.pasta_webtuga); } catch (e) { res.erros.push(`${emp.nome}: ${e.message}`); continue; }
    const caminhos = lista.map((f) => `${emp.pasta_webtuga}/${f.nome}`);
    const { data: existentes } = await supabase.from('documentos').select('ficheiro_path').eq('origem', 'webtuga').in('ficheiro_path', caminhos.length ? caminhos : ['-']);
    const ja = new Set((existentes || []).map((d) => d.ficheiro_path));
    const novos = lista.filter((f) => !ja.has(`${emp.pasta_webtuga}/${f.nome}`)).map((f) => {
      const titulo = f.nome.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
      const formato = /\.pdf$/i.test(f.nome) ? 'pdf' : 'excel';
      const tipo = /pre[cç]o|tabela|price|tarifa/i.test(titulo) ? 'precos' : 'catalogo';
      return { empresa_id: emp.id, origem: 'webtuga', ficheiro_path: `${emp.pasta_webtuga}/${f.nome}`, titulo, formato, tipo, tamanho_bytes: f.tamanho };
    });
    if (novos.length) {
      const { error } = await supabase.from('documentos').insert(novos);
      if (error) { res.erros.push(`${emp.nome}: ${error.message}`); continue; }
      res.novos += novos.length;
    }
  }
  const { data: semCapa } = await supabase.from('documentos').select('id, empresa_id, ficheiro_path').eq('origem', 'webtuga').eq('formato', 'pdf').is('capa_path', null).limit(50);
  res.capas = (semCapa || []).map((d) => ({ id: d.id, empresa_id: d.empresa_id, url: linkFicheiro(d.ficheiro_path, { segundos: 1800 }) }));
  return res;
}

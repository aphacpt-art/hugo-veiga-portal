import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request, { params }) {
  const { id } = await params;
  const acao = new URL(request.url).searchParams.get('acao') === 'descarregar' ? 'descarregar' : 'ver';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/entrar', request.url));
  // RLS garante que só devolve o documento se o cliente tiver acesso à empresa
  const { data: doc } = await supabase.from('documentos').select('id, titulo, formato, ficheiro_path').eq('id', id).maybeSingle();
  if (!doc) return new NextResponse('Documento não encontrado.', { status: 404 });

  const { data: cliente } = await supabase.from('clientes').select('id').eq('user_id', user.id).maybeSingle();
  if (cliente) {
    await supabase.from('atividade').insert({ cliente_id: cliente.id, acao: `documento_${acao}`, detalhe: { documento_id: doc.id, titulo: doc.titulo } });
  }
  if (acao === 'ver' && doc.formato === 'excel') return NextResponse.redirect(new URL(`/ver/${doc.id}`, request.url));

  const ext = doc.ficheiro_path.split('.').pop();
  const nome = `${doc.titulo}.${ext}`.replace(/[\\/:*?"<>|]/g, '-');
  const { data, error } = await supabase.storage.from('documentos')
    .createSignedUrl(doc.ficheiro_path, 600, acao === 'descarregar' ? { download: nome } : undefined);
  if (error) return new NextResponse('Não foi possível abrir o documento.', { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
